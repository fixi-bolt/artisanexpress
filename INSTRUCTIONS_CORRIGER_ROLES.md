# 🎯 Instructions pour corriger le problème Client/Artisan identique

## 📋 Résumé du problème

Vous voyez la même interface pour Client et Artisan, alors que votre code est correct et contient déjà des interfaces séparées.

**Cause probable** : Le champ `user_type` dans la base de données Supabase n'est pas correctement défini.

---

## ✅ ÉTAPE 1 : Diagnostic dans Supabase

### 1.1 Ouvrir Supabase SQL Editor

1. Allez sur [supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans le menu gauche

### 1.2 Exécuter le diagnostic

```sql
-- Afficher tous les utilisateurs et leurs types
SELECT 
  u.id,
  u.email,
  u.name,
  u.user_type as "Type actuel",
  CASE 
    WHEN EXISTS (SELECT 1 FROM artisans WHERE id = u.id) THEN '✅ Artisan'
    WHEN EXISTS (SELECT 1 FROM clients WHERE id = u.id) THEN '✅ Client'
    WHEN EXISTS (SELECT 1 FROM admins WHERE id = u.id) THEN '✅ Admin'
    ELSE '❌ Aucun'
  END as "Profil détecté"
FROM users u
ORDER BY u.created_at DESC
LIMIT 10;
```

### 1.3 Analyser les résultats

**Si vous voyez :**
- `Type actuel` = **NULL** ou vide → **Problème identifié** ✅
- `Profil détecté` ≠ `Type actuel` → **Incohérence** ⚠️

---

## ✅ ÉTAPE 2 : Correction automatique

Copiez et exécutez ce script dans Supabase SQL Editor :

```sql
-- ========================================
-- 🔧 CORRECTION AUTOMATIQUE DES user_type
-- ========================================

-- Corriger tous les user_type incohérents
UPDATE users u
SET user_type = CASE
  WHEN EXISTS (SELECT 1 FROM artisans WHERE id = u.id) THEN 'artisan'
  WHEN EXISTS (SELECT 1 FROM clients WHERE id = u.id) THEN 'client'
  WHEN EXISTS (SELECT 1 FROM admins WHERE id = u.id) THEN 'admin'
  ELSE u.user_type
END
WHERE u.user_type IS NULL 
   OR u.user_type = ''
   OR u.user_type NOT IN ('client', 'artisan', 'admin');

-- Afficher les résultats
SELECT 
  email,
  user_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM artisans WHERE id = users.id) THEN '👨‍🔧'
    WHEN EXISTS (SELECT 1 FROM clients WHERE id = users.id) THEN '👤'
    ELSE '❓'
  END as "Icône"
FROM users
ORDER BY created_at DESC;
```

**Résultat attendu :** Tous les utilisateurs ont maintenant un `user_type` correct.

---

## ✅ ÉTAPE 3 : Créer un compte de test

### 3.1 Créer un Client de test

```sql
-- Remplacez 'client@test.com' par votre email
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Récupérer l'ID de l'utilisateur depuis auth.users
  SELECT id INTO user_id 
  FROM auth.users 
  WHERE email = 'client@test.com' 
  LIMIT 1;

  -- Si l'utilisateur existe dans auth mais pas dans users
  IF user_id IS NOT NULL THEN
    -- Insérer dans users
    INSERT INTO users (id, email, name, user_type)
    VALUES (user_id, 'client@test.com', 'Test Client', 'client')
    ON CONFLICT (id) DO UPDATE SET user_type = 'client';

    -- Insérer dans clients
    INSERT INTO clients (id)
    VALUES (user_id)
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Client créé avec succès: %', user_id;
  ELSE
    RAISE NOTICE 'Utilisateur non trouvé dans auth.users';
  END IF;
END $$;
```

### 3.2 Créer un Artisan de test

```sql
-- Remplacez 'artisan@test.com' par votre email
DO $$
DECLARE
  user_id UUID;
BEGIN
  SELECT id INTO user_id 
  FROM auth.users 
  WHERE email = 'artisan@test.com' 
  LIMIT 1;

  IF user_id IS NOT NULL THEN
    -- Insérer dans users
    INSERT INTO users (id, email, name, user_type)
    VALUES (user_id, 'artisan@test.com', 'Test Artisan', 'artisan')
    ON CONFLICT (id) DO UPDATE SET user_type = 'artisan';

    -- Insérer dans artisans
    INSERT INTO artisans (id, category, hourly_rate, travel_fee, intervention_radius, is_available)
    VALUES (user_id, 'plumber', 50.00, 25.00, 20, true)
    ON CONFLICT (id) DO NOTHING;

    -- Créer le wallet
    INSERT INTO wallets (artisan_id, balance, pending_balance, total_earnings, total_withdrawals, currency)
    VALUES (user_id, 0, 0, 0, 0, 'EUR')
    ON CONFLICT (artisan_id) DO NOTHING;

    RAISE NOTICE 'Artisan créé avec succès: %', user_id;
  ELSE
    RAISE NOTICE 'Utilisateur non trouvé dans auth.users';
  END IF;
END $$;
```

---

## ✅ ÉTAPE 4 : Tester dans l'application

### 4.1 Vider le cache

Dans votre terminal :
```bash
npx expo start --clear
```

### 4.2 Test compte Client

1. **Se connecter** avec : `client@test.com`
2. **Vérifier** :
   - ✅ Redirection vers `/(client)/home`
   - ✅ Onglets : **Carte** / **Missions** / **Profil**
   - ✅ Interface : Grille de catégories d'artisans
   - ✅ Bouton "Ouvrir la Super App"
   - ✅ Bouton debug en haut à droite affiche **CLIENT**

### 4.3 Test compte Artisan

1. **Se déconnecter**
2. **Se connecter** avec : `artisan@test.com`
3. **Vérifier** :
   - ✅ Redirection vers `/(artisan)/dashboard`
   - ✅ Onglets : **Missions** / **Revenus** / **Profil**
   - ✅ Interface : Liste des demandes de missions
   - ✅ Carte "Statut : Disponible"
   - ✅ Bouton debug en haut à droite affiche **ARTISAN**

---

## 🔍 Panneau de Debug

Un panneau de debug a été ajouté pour vous aider :

1. **Localisation** : En haut à droite de l'écran (œil bleu)
2. **Affichage** : Cliquez sur l'œil pour voir les infos
3. **Informations** :
   - Type utilisateur (CLIENT / ARTISAN / ADMIN)
   - Statut isClient / isArtisan / isAdmin
   - ID utilisateur
   - Email

**⚠️ Important** : Ce panneau n'apparaît qu'en mode développement.

---

## 🐛 Débogage avancé

### Vérifier les logs dans la console

Ouvrez DevTools (F12) et cherchez :

```
🔵 Loading user profile for ID: xxx
✅ User data fetched: email@example.com client
✅ User profile fully loaded: Nom client
```

**Si vous voyez des erreurs**, envoyez-moi :
1. Le message d'erreur complet
2. La sortie de la requête SQL de diagnostic
3. Capture d'écran du panneau de debug

---

## ❓ Problèmes courants

### "Je vois toujours la même interface"

**Solutions** :
1. Vider le cache : `npx expo start --clear`
2. Supprimer l'app et réinstaller
3. Vérifier que le `user_type` est correct dans Supabase
4. Se déconnecter puis se reconnecter

### "Le panneau de debug affiche 'NON DÉFINI'"

Le `user_type` n'est pas défini dans Supabase. Réexécutez le script de correction à l'ÉTAPE 2.

### "Le type est correct mais l'interface est mauvaise"

Problème de cache. Solution :
```bash
# Terminal 1 : Arrêter le serveur
Ctrl+C

# Terminal 2 : Vider complètement
rm -rf .expo
rm -rf node_modules/.cache

# Redémarrer
npx expo start --clear
```

---

## 📞 Support

Si le problème persiste après ces étapes, fournissez-moi :

1. **Résultat du diagnostic SQL** (ÉTAPE 1.2)
2. **Logs de la console** lors de la connexion
3. **Capture d'écran du panneau de debug**
4. **Email de test** que vous utilisez

Je vous aiderai à résoudre le problème spécifique.
