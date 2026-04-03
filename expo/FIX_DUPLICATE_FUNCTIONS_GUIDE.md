# 🔧 Guide de correction des fonctions dupliquées

## 🚨 Problème rencontré

Vous avez des erreurs de type :
```
ERROR: 42725: function name "public.get_nearby_artisans" is not unique
ERROR: 42725: function name "public.calculate_distance_km" is not unique
ERROR: 42725: function name "public.find_nearby_missions" is not unique
```

**Cause:** Plusieurs scripts ont créé des versions différentes de ces fonctions avec des signatures différentes.

---

## ✅ Solution rapide

### Étape 1: Coller ce script dans Supabase

Ouvrez votre dashboard Supabase → SQL Editor → Nouveau query

Copiez-collez le contenu du fichier :
```
database/FIX_DUPLICATE_FUNCTIONS_FINAL.sql
```

### Étape 2: Exécuter le script

Cliquez sur **Run** (ou Ctrl/Cmd + Enter)

---

## 📋 Ce que fait ce script

1. **Nettoie toutes les versions dupliquées** de :
   - `calculate_distance_km`
   - `find_nearby_missions`
   - `get_nearby_artisans`

2. **Recrée les versions uniques et correctes** avec :
   - Types de données cohérents (DECIMAL pour la précision GPS)
   - Permissions appropriées
   - Documentation des fonctions

3. **Recrée le trigger** `on_new_mission_notify` pour les notifications

---

## 🧪 Tests à effectuer après exécution

### Test 1: Vérifier les fonctions
```sql
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'calculate_distance_km',
    'find_nearby_missions',
    'get_nearby_artisans',
    'notify_nearby_artisans'
  );
```

Vous devriez voir **4 fonctions** (une seule version de chaque).

### Test 2: Tester le calcul de distance
```sql
SELECT public.calculate_distance_km(
  48.8566, 2.3522,  -- Paris
  45.7640, 4.8357   -- Lyon
) AS distance_km;
```

Résultat attendu: ~392 km

### Test 3: Créer une mission de test
```sql
-- Vérifier qu'un artisan existe et noter son ID
SELECT id, name, category, latitude, longitude 
FROM users u
JOIN artisans a ON a.id = u.id
WHERE is_available = true
LIMIT 1;

-- Créer une mission dans son secteur
-- (remplacer les valeurs par les vôtres)
INSERT INTO missions (
  client_id, 
  title, 
  category, 
  description,
  latitude,
  longitude,
  status
) VALUES (
  '<votre_client_id>',
  'Test notification',
  '<category_de_l_artisan>',
  'Mission de test',
  <latitude_artisan>,
  <longitude_artisan>,
  'pending'
);

-- Vérifier que la notification a été créée
SELECT * FROM notifications
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🎯 Vérification de la synchronisation disponibilité

Le problème de synchronisation entre Mission et Profil sera résolu séparément.

Ce script se concentre uniquement sur :
- ✅ Nettoyage des fonctions dupliquées
- ✅ Système de notifications artisans
- ✅ Géolocalisation fonctionnelle

---

## 📊 Logs à surveiller

Après avoir créé une mission de test, allez dans :
**Supabase Dashboard → Database → Logs**

Vous devriez voir des messages comme :
```
🔔 [NOTIFICATIONS] Nouvelle mission créée: <id> (catégorie: plumber, lat: 48.8566, lon: 2.3522)
✅ [NOTIFICATIONS] Notification envoyée à artisan Jean Dupont (distance: 2.3 km)
📊 [NOTIFICATIONS] Total artisans notifiés: 3
```

---

## ⚠️ En cas de problème

Si l'erreur persiste après exécution du script :

1. **Vérifier qu'il n'y a plus de doublons**
```sql
SELECT 
  routine_name,
  COUNT(*) as count
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'calculate_distance_km',
    'find_nearby_missions',
    'get_nearby_artisans'
  )
GROUP BY routine_name
HAVING COUNT(*) > 1;
```

2. **Si des doublons persistent**, supprimez-les manuellement :
```sql
-- Lister toutes les signatures
SELECT 
  routine_name,
  data_type,
  type_udt_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'calculate_distance_km';

-- Puis supprimer chaque version
DROP FUNCTION public.calculate_distance_km(...signature complète...);
```

---

## 📞 Support

Si vous avez toujours des problèmes après avoir suivi ce guide, fournissez :
- Le message d'erreur complet
- Le résultat de la requête de vérification des doublons
- Les logs Supabase après création d'une mission

---

**Date de création:** 2025-10-31  
**Statut:** Production ready ✅
