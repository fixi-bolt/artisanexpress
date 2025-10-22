# 🔧 Correction du routage Client/Artisan

## 🔍 Diagnostic du problème

Vous voyez la même interface pour Client et Artisan alors que le code est correct. Voici les causes possibles :

### 1. **Le champ `user_type` n'est pas défini dans Supabase**

Vérifiez dans votre base de données Supabase :
```sql
-- Exécuter dans Supabase SQL Editor
SELECT id, email, name, user_type 
FROM users 
WHERE email = 'VOTRE_EMAIL_TEST';
```

**Résultat attendu :**
```
user_type = 'client' ou 'artisan'
```

**Si `user_type` est NULL ou vide**, c'est le problème principal.

---

## ✅ Solution 1 : Créer un script SQL de correction

Copiez-collez ce script dans **Supabase SQL Editor** :

```sql
-- ========================================
-- 🔧 CORRECTION AUTOMATIQUE DES RÔLES
-- ========================================

-- Vérifier l'état actuel
SELECT 
  u.id, 
  u.email, 
  u.user_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM artisans WHERE id = u.id) THEN 'artisan'
    WHEN EXISTS (SELECT 1 FROM clients WHERE id = u.id) THEN 'client'
    WHEN EXISTS (SELECT 1 FROM admins WHERE id = u.id) THEN 'admin'
    ELSE 'unknown'
  END as detected_type
FROM users u;

-- Corriger automatiquement les user_type basés sur les tables liées
UPDATE users u
SET user_type = CASE
  WHEN EXISTS (SELECT 1 FROM artisans WHERE id = u.id) THEN 'artisan'
  WHEN EXISTS (SELECT 1 FROM clients WHERE id = u.id) THEN 'client'
  WHEN EXISTS (SELECT 1 FROM admins WHERE id = u.id) THEN 'admin'
  ELSE u.user_type
END
WHERE u.user_type IS NULL 
   OR u.user_type = '';

-- Vérifier les résultats
SELECT 
  u.id, 
  u.email, 
  u.user_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM artisans WHERE id = u.id) THEN 'a'
    ELSE '-'
  END as "artisan?",
  CASE 
    WHEN EXISTS (SELECT 1 FROM clients WHERE id = u.id) THEN 'c'
    ELSE '-'
  END as "client?"
FROM users u;
```

---

## ✅ Solution 2 : Forcer un utilisateur spécifique à être Client

```sql
-- Remplacez 'votre@email.com' par votre email de test
UPDATE users 
SET user_type = 'client' 
WHERE email = 'votre@email.com';

-- Vérifier que le profil client existe
INSERT INTO clients (id)
SELECT id FROM users WHERE email = 'votre@email.com'
ON CONFLICT (id) DO NOTHING;
```

---

## ✅ Solution 3 : Forcer un utilisateur spécifique à être Artisan

```sql
-- Remplacez 'artisan@email.com' par l'email de test artisan
UPDATE users 
SET user_type = 'artisan' 
WHERE email = 'artisan@email.com';

-- Créer le profil artisan s'il n'existe pas
INSERT INTO artisans (id, category, hourly_rate, travel_fee, intervention_radius, is_available)
SELECT id, 'plumber', 50.00, 25.00, 20, true
FROM users WHERE email = 'artisan@email.com'
ON CONFLICT (id) DO NOTHING;

-- Créer le wallet artisan
INSERT INTO wallets (artisan_id, balance, pending_balance, total_earnings, total_withdrawals, currency)
SELECT id, 0, 0, 0, 0, 'EUR'
FROM users WHERE email = 'artisan@email.com'
ON CONFLICT (artisan_id) DO NOTHING;
```

---

## 🧪 Test après correction

### 1. Déconnectez-vous de l'app
```typescript
// Dans l'app, cliquer sur Déconnexion ou exécuter :
await logout();
```

### 2. Reconnectez-vous avec chaque compte

**Compte Client :**
- Email: `votre@email.com`
- Devrait rediriger vers → `/(client)/home`
- Interface : Recherche d'artisans, catégories

**Compte Artisan :**
- Email: `artisan@email.com`
- Devrait rediriger vers → `/(artisan)/dashboard`
- Interface : Liste de missions, bouton "Accepter"

---

## 🔍 Debugging en console

Ajoutez ces logs temporaires dans `app/index.tsx` :

```typescript
useEffect(() => {
  console.log('===== AUTH DEBUG =====');
  console.log('isAuthenticated:', isAuthenticated);
  console.log('user?.type:', user?.type);
  console.log('isClient:', isClient);
  console.log('isArtisan:', authContext?.isArtisan);
  console.log('=====================');
  
  if (isAuthenticated) {
    const route = isClient ? '/(client)/home' : '/(artisan)/dashboard';
    console.log('🔀 Redirecting to:', route);
    router.replace(route as any);
  }
}, [isAuthenticated, isClient]);
```

---

## 📱 Vérification visuelle

### Interface CLIENT
✅ Onglets : **Carte** / **Missions** / **Profil**
✅ Couleur primaire : **Bleu** (#007AFF)
✅ Écran principal : **Grille de catégories d'artisans**
✅ Bouton "Ouvrir la Super App"

### Interface ARTISAN
✅ Onglets : **Missions** / **Revenus** / **Profil**
✅ Couleur secondaire : **Orange** (#FF9500)
✅ Écran principal : **Liste des demandes de missions**
✅ Carte "Statut : Disponible"

---

## ⚠️ Problème persistant ?

Si après ces corrections vous voyez toujours la même interface :

1. **Vider le cache de l'app**
```bash
# Dans votre terminal
npx expo start --clear
```

2. **Supprimer et recréer les comptes**
```sql
-- Supprimer l'utilisateur
DELETE FROM users WHERE email = 'test@example.com';

-- Puis recréer via l'interface de signup
```

3. **Vérifier les logs dans la console**
- Ouvrez DevTools (F12)
- Onglet Console
- Cherchez les messages : `🔵 User data fetched:` et `✅ User profile fully loaded:`

---

## 📞 Besoin d'aide ?

Si le problème persiste, envoyez-moi :
1. Le résultat de la requête SQL de diagnostic
2. Les logs de la console lors de la connexion
3. Capture d'écran de l'interface que vous voyez
