# 🔧 FIX: Erreur "function round(double precision, integer) does not exist"

## ❌ Problème
Lors de la création d'une mission, vous obtenez l'erreur :
```
ERROR ❌ Error in createMission: [Error: function round(double precision, integer) does not exist]
```

## 🔍 Cause
La fonction SQL `calculate_distance()` n'existe pas en base de données. Cette fonction est appelée par d'autres fonctions SQL mais n'a jamais été créée.

## ✅ Solution (30 secondes)

### Étape 1: Ouvrir Supabase
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans la barre latérale

### Étape 2: Exécuter le script
1. Cliquez sur **New Query**
2. Copiez TOUT le contenu du fichier `database/FIX_ROUND_ERROR.sql`
3. Collez-le dans l'éditeur
4. Cliquez sur **Run** (ou Ctrl+Enter)

### Étape 3: Vérifier
Vous devriez voir dans les logs :
```
✅ Fonction calculate_distance créée
✅ Fonction calculate_distance_km créée (alias)
✅ Permissions accordées
📝 Vous pouvez maintenant créer des missions
```

## 🧪 Tester
1. Retournez dans votre app
2. Essayez de créer une nouvelle mission
3. Elle devrait être créée sans erreur

## 📝 Notes Techniques
- La fonction `calculate_distance()` utilise la formule de Haversine
- Elle calcule la distance en kilomètres entre deux coordonnées GPS
- Elle est utilisée par d'autres fonctions comme `find_nearby_missions()`
- La fonction `calculate_distance_km()` est un alias pour compatibilité

## ❓ Si ça ne marche toujours pas
Vérifiez que la fonction existe :
```sql
SELECT proname, prosrc
FROM pg_proc
WHERE proname LIKE '%distance%';
```

Vous devriez voir `calculate_distance` et `calculate_distance_km` dans les résultats.
