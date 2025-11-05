# 🔧 ACTION IMMÉDIATE : Rendre les Plombiers Visibles

## ✅ Problème Résolu dans le Code

Le code de l'application a été corrigé pour utiliser les **vraies données Supabase** au lieu des données mockées.

**Changements apportés** :
- ✅ `app/(client)/home.tsx` : Remplace `mockArtisans` par `useSupabaseArtisans()`
- ✅ La carte et la liste affichent maintenant les vrais artisans de la base de données
- ✅ Indicateur de chargement ajouté pendant la récupération des données

---

## 🔍 Diagnostic à Effectuer dans Supabase

### **1. Exécutez le script de diagnostic**

Allez dans **Supabase → SQL Editor** et exécutez :

```sql
-- Copiez le contenu de : database/DIAGNOSTIC_PLOMBIERS.sql
```

Ce script va identifier les problèmes spécifiques :
- ❌ Artisans sans profil `artisans`
- ❌ `is_available = false`
- ❌ `is_suspended = true`
- ❌ Coordonnées GPS manquantes (`latitude` ou `longitude` NULL)
- ❌ `user_type` incorrect

---

## 🛠️ Solutions selon le Diagnostic

### **Problème A : Les artisans n'ont pas de coordonnées GPS**

```sql
-- Vérifiez d'abord :
SELECT u.name, u.email, a.latitude, a.longitude
FROM users u
INNER JOIN artisans a ON u.id = a.id
WHERE a.category = 'plumber';
```

**Solution** : Ajoutez les vraies coordonnées GPS des artisans :

```sql
-- Remplacez USER_ID, LATITUDE, LONGITUDE par les vraies valeurs
UPDATE artisans
SET 
  latitude = 48.8566,     -- Exemple : Paris
  longitude = 2.3522,     -- Exemple : Paris
  intervention_radius = 20,
  updated_at = NOW()
WHERE id = 'USER_ID_DU_PLOMBIER_1';

UPDATE artisans
SET 
  latitude = 48.8606,     -- Exemple : Paris Nord
  longitude = 2.3376,
  intervention_radius = 20,
  updated_at = NOW()
WHERE id = 'USER_ID_DU_PLOMBIER_2';
```

---

### **Problème B : Les artisans ne sont pas disponibles**

```sql
-- Vérifiez :
SELECT u.name, a.is_available, a.is_suspended
FROM users u
INNER JOIN artisans a ON u.id = a.id
WHERE a.category = 'plumber';
```

**Solution** : Activez leur disponibilité :

```sql
UPDATE artisans
SET 
  is_available = true,
  is_suspended = false,
  updated_at = NOW()
WHERE category = 'plumber';
```

---

### **Problème C : Le profil artisan n'existe pas**

```sql
-- Vérifiez :
SELECT u.id, u.name, u.email, u.user_type
FROM users u
WHERE u.user_type = 'artisan'
  AND NOT EXISTS (SELECT 1 FROM artisans WHERE id = u.id);
```

**Solution** : Créez le profil artisan :

```sql
INSERT INTO artisans (
  id,
  category,
  hourly_rate,
  travel_fee,
  intervention_radius,
  is_available,
  latitude,
  longitude,
  specialties
)
VALUES (
  'USER_ID_DU_PLOMBIER',
  'plumber',
  45.00,
  25.00,
  20,
  true,
  48.8566,  -- À REMPLACER par la vraie localisation
  2.3522,   -- À REMPLACER par la vraie localisation
  ARRAY['Installation', 'Dépannage', 'Débouchage']
);
```

---

### **Problème D : user_type incorrect**

```sql
-- Vérifiez :
SELECT u.id, u.name, u.user_type
FROM users u
INNER JOIN artisans a ON u.id = a.id
WHERE a.category = 'plumber'
  AND u.user_type != 'artisan';
```

**Solution** :

```sql
UPDATE users
SET user_type = 'artisan', updated_at = NOW()
WHERE id IN (
  SELECT id FROM artisans WHERE category = 'plumber'
);
```

---

## ✅ Vérification Finale

Après avoir appliqué les corrections, exécutez cette requête pour confirmer :

```sql
SELECT 
  u.name,
  u.email,
  a.category,
  a.is_available,
  a.is_suspended,
  a.latitude,
  a.longitude,
  a.intervention_radius,
  CASE 
    WHEN a.is_available = true 
      AND a.is_suspended = false 
      AND a.latitude IS NOT NULL 
      AND a.longitude IS NOT NULL 
      AND u.user_type = 'artisan'
    THEN '✅ VISIBLE SUR LA CARTE'
    ELSE '❌ INVISIBLE'
  END as statut
FROM users u
INNER JOIN artisans a ON u.id = a.id
WHERE a.category = 'plumber'
ORDER BY a.created_at DESC;
```

Tous les plombiers doivent avoir le statut **"✅ VISIBLE SUR LA CARTE"**.

---

## 🔄 Actualisation de l'App

Une fois les corrections appliquées dans Supabase :

1. **Rechargez l'application** (Ctrl+R ou Cmd+R)
2. Les artisans Plombiers devraient maintenant apparaître :
   - ✅ Sur la **carte** (marqueurs)
   - ✅ Dans la **liste des artisans disponibles**
   - ✅ Lorsque vous créez une demande catégorie "Plombier"

---

## 📊 Checklist Complète

- [ ] Code corrigé pour utiliser Supabase (✅ Déjà fait)
- [ ] Script de diagnostic exécuté dans Supabase
- [ ] Problèmes identifiés (noter lesquels)
- [ ] Coordonnées GPS ajoutées aux profils artisans
- [ ] `is_available = true` et `is_suspended = false`
- [ ] `user_type = 'artisan'` dans la table users
- [ ] Profil artisan existe dans la table artisans
- [ ] Vérification finale : statut "✅ VISIBLE"
- [ ] App rechargée et artisans visibles

---

## 🆘 Si le Problème Persiste

1. **Vérifiez les logs de la console** dans l'app :
   - Recherchez les erreurs liées à Supabase
   - Vérifiez les requêtes SQL dans les logs

2. **Vérifiez les politiques RLS (Row Level Security)** :
   ```sql
   -- Les artisans disponibles doivent être visibles par tous
   SELECT * FROM artisans WHERE category = 'plumber' AND is_available = true;
   ```

3. **Testez la requête du hook directement** :
   ```sql
   SELECT a.*, u.name, u.email, u.photo, u.rating, u.review_count
   FROM artisans a
   INNER JOIN users u ON a.id = u.id
   WHERE a.is_available = true
     AND a.is_suspended = false
   ORDER BY u.rating DESC;
   ```

Si cette requête retourne vos plombiers, alors l'app devrait les afficher.
