# ⚡ ACTION IMMÉDIATE

## 🎯 Vous êtes ici car...

Les interfaces Client et Artisan sont identiques dans votre application.

---

## ✅ ÉTAPE 1 : Diagnostic (30 secondes)

### Ouvrez Supabase SQL Editor

1. Allez sur **https://supabase.com**
2. Cliquez sur **SQL Editor** (menu gauche)
3. **Collez et exécutez** :

```sql
SELECT email, user_type FROM users;
```

### Résultats possibles :

#### ❌ PROBLÈME IDENTIFIÉ
```
email                 | user_type
─────────────────────┼──────────
client@test.com      | NULL
artisan@test.com     | NULL
```
→ **Passez à l'ÉTAPE 2**

#### ✅ TOUT EST OK
```
email                 | user_type
─────────────────────┼──────────
client@test.com      | client
artisan@test.com     | artisan
```
→ **Passez à l'ÉTAPE 3** (problème de cache)

---

## ✅ ÉTAPE 2 : Correction (1 minute)

### Dans Supabase SQL Editor, collez ceci :

```sql
-- Correction automatique
UPDATE users u
SET user_type = CASE
  WHEN EXISTS (SELECT 1 FROM artisans WHERE id = u.id) THEN 'artisan'
  WHEN EXISTS (SELECT 1 FROM clients WHERE id = u.id) THEN 'client'
  WHEN EXISTS (SELECT 1 FROM admins WHERE id = u.id) THEN 'admin'
  ELSE 'client'
END
WHERE user_type IS NULL OR user_type = '';

-- Vérification
SELECT email, user_type FROM users;
```

**Cliquez sur "Run"** → Vous devriez voir tous les `user_type` définis.

---

## ✅ ÉTAPE 3 : Redémarrage (1 minute)

### Dans votre terminal :

```bash
# Arrêter le serveur (Ctrl+C)

# Vider le cache
npx expo start --clear
```

---

## ✅ ÉTAPE 4 : Test (2 minutes)

### 1. Ouvrir l'application

### 2. Se déconnecter (si connecté)

### 3. Se reconnecter

**Vous devriez maintenant voir** :

- **Si compte Client** : Grille de catégories (🔧 ⚡ 🎨)
- **Si compte Artisan** : Liste de missions avec boutons "Accepter"

---

## 🎉 Ça marche !

Félicitations ! Les interfaces sont maintenant différentes.

### Vérification visuelle :

| CLIENT | ARTISAN |
|--------|---------|
| 🗺️ Carte | 💼 Missions |
| Grille catégories | Liste demandes |
| Couleur bleue | Couleur orange |

---

## ⚠️ Ça ne marche toujours pas ?

### Cas 1 : "user_type toujours NULL"

**Solution** : Forcer manuellement

```sql
-- Remplacez par votre email
UPDATE users SET user_type = 'client' WHERE email = 'votre@email.com';
```

Puis recommencez l'ÉTAPE 3.

---

### Cas 2 : "Interface identique après correction"

**Solution** : Cache tenace

```bash
# Terminal
rm -rf .expo
rm -rf node_modules/.cache
npx expo start --clear
```

Puis :
1. Fermez complètement l'app (glisser vers le haut)
2. Redémarrez l'app
3. Déconnectez-vous
4. Reconnectez-vous

---

### Cas 3 : "L'app crash"

**Solution** : Profils manquants

```sql
-- Créer les profils clients manquants
INSERT INTO clients (id)
SELECT id FROM users WHERE user_type = 'client'
ON CONFLICT (id) DO NOTHING;

-- Créer les profils artisans manquants
INSERT INTO artisans (id, category, hourly_rate, travel_fee, intervention_radius, is_available)
SELECT id, 'plumber', 50, 25, 20, true
FROM users WHERE user_type = 'artisan'
ON CONFLICT (id) DO NOTHING;

-- Créer les wallets
INSERT INTO wallets (artisan_id, balance, pending_balance, total_earnings, total_withdrawals, currency)
SELECT id, 0, 0, 0, 0, 'EUR'
FROM artisans
ON CONFLICT (artisan_id) DO NOTHING;
```

---

## 🔍 Panneau de Debug

Pour vérifier en temps réel :

1. **Ouvrez l'app en mode dev**
2. **Cherchez le bouton œil bleu** en haut à droite
3. **Cliquez dessus** → Affiche le type d'utilisateur

**Doit afficher** :
- `CLIENT` (en bleu) pour les clients
- `ARTISAN` (en orange) pour les artisans

---

## 📞 Besoin d'aide supplémentaire ?

Consultez ces fichiers dans l'ordre :

1. **`SOLUTION_RAPIDE_ROLES.md`** → Guide illustré
2. **`DIFFERENCES_VISUELLES_CLIENT_ARTISAN.md`** → Tableau comparatif
3. **`INSTRUCTIONS_CORRIGER_ROLES.md`** → Guide complet
4. **`database/fix-user-roles.sql`** → Script SQL complet

---

## 📊 Récapitulatif

```
┌─────────────────────────────────────┐
│ 1. Diagnostic SQL                   │
│    → Vérifier user_type             │
│                                     │
│ 2. Correction SQL                   │
│    → UPDATE users SET user_type...  │
│                                     │
│ 3. Vider cache                      │
│    → npx expo start --clear         │
│                                     │
│ 4. Reconnecter                      │
│    → Voir interfaces différentes ✅ │
└─────────────────────────────────────┘
```

**⏱️ Temps total** : 5 minutes

**🎯 Commencez maintenant** : ÉTAPE 1 → Diagnostic SQL
