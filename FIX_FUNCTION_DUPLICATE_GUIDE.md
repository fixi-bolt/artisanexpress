# 🔧 FIX: Erreur "function name is not unique"

## ❌ Problème Identifié

L'erreur `ERROR: 42725: function name "public.calculate_distance_km" is not unique` signifie que plusieurs versions de la fonction `calculate_distance_km` existent dans votre base de données avec des signatures différentes (ex. `DECIMAL` vs `DOUBLE PRECISION`).

PostgreSQL ne peut pas déterminer quelle version utiliser.

---

## ✅ Solution

Copier-coller ce script dans **Supabase SQL Editor** :

```sql
-- Fichier: database/FIX_DUPLICATE_FUNCTION.sql
```

### Ce que fait le script :

1. **Supprime toutes les versions** de `calculate_distance` et `calculate_distance_km`
2. **Recrée une seule version propre** avec la signature :
   ```sql
   calculate_distance_km(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION)
   ```
3. **Met à jour toutes les fonctions dépendantes** :
   - `find_nearby_missions()`
   - `get_nearby_artisans()`
   - `notify_nearby_artisans()`
4. **Recrée le trigger** sur la table `missions`

---

## 🚀 Étapes à Suivre

### 1️⃣ Ouvrir Supabase

- Aller sur [app.supabase.com](https://app.supabase.com)
- Sélectionner votre projet
- Aller dans **SQL Editor**

### 2️⃣ Exécuter le script

- Cliquer sur **"New Query"**
- Copier le contenu du fichier `database/FIX_DUPLICATE_FUNCTION.sql`
- Coller dans l'éditeur
- Cliquer sur **"Run"** (ou `Ctrl+Enter`)

### 3️⃣ Vérifier le résultat

Vous devriez voir dans les logs :

```
✅ CORRECTION TERMINÉE
========================================

Nombre de fonctions calculate_distance_km: 1

✅ Parfait ! Une seule version de la fonction existe.

📍 Fonctions mises à jour:
  • calculate_distance_km()
  • find_nearby_missions()
  • get_nearby_artisans()
  • notify_nearby_artisans()
```

---

## 🧪 Tests Recommandés

### Test 1 : Vérifier la fonction

```sql
-- Calculer la distance entre Paris et Lyon
SELECT calculate_distance_km(48.8566, 2.3522, 45.7640, 4.8357) AS distance_km;
-- Résultat attendu : ~392 km
```

### Test 2 : Tester find_nearby_missions

```sql
-- Remplacer par un ID d'artisan réel
SELECT * FROM find_nearby_missions(
  'uuid-artisan-ici',
  48.8566, 2.3522
);
```

### Test 3 : Tester le trigger de notification

```sql
-- Créer une mission test (remplacer l'UUID client)
INSERT INTO missions (
  client_id,
  category,
  title,
  description,
  address,
  status,
  latitude,
  longitude
) VALUES (
  'uuid-client-ici',
  'Plomberie',
  'Mission test',
  'Test notification',
  'Paris, France',
  'pending',
  48.8566,
  2.3522
);

-- Vérifier que des notifications ont été créées
SELECT * FROM notifications 
WHERE mission_id IN (
  SELECT id FROM missions WHERE title = 'Mission test'
)
ORDER BY created_at DESC;
```

---

## 🔍 Diagnostic Supplémentaire

Si le problème persiste, vérifier les fonctions existantes :

```sql
-- Lister toutes les fonctions calculate_distance*
SELECT 
  proname AS function_name,
  pg_get_function_arguments(oid) AS arguments,
  pg_get_functiondef(oid) AS definition
FROM pg_proc
WHERE proname LIKE 'calculate_distance%'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

---

## 📋 Cause Racine

Le problème est survenu parce que différents scripts SQL ont créé des versions de la fonction avec des types différents :

1. **Version 1** : `calculate_distance(DOUBLE PRECISION, ...)`
2. **Version 2** : `calculate_distance_km(DOUBLE PRECISION, ...)`
3. **Version 3** : `calculate_distance_km(DECIMAL, ...)`

PostgreSQL traite ces versions comme des fonctions séparées (surcharge de fonctions). Quand vous appelez `calculate_distance_km(...)` sans spécifier le type exact, PostgreSQL ne sait pas laquelle choisir.

---

## ✅ Prochaines Étapes

Après avoir exécuté le script :

1. **Tester la géolocalisation** dans l'app
2. **Créer une mission** et vérifier que les artisans reçoivent une notification
3. **Vérifier les logs Supabase** (Database > Logs) pour voir les `RAISE NOTICE`

---

## 📞 Support

Si le problème persiste :

1. Copier les erreurs exactes du SQL Editor
2. Exécuter le diagnostic et copier les résultats
3. Fournir les détails pour une assistance supplémentaire
