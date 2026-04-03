# 🚨 FIX URGENT : Demande d'intervention ne passe pas

## ❌ Problème
Erreur : `function round(double precision, integer) does not exist`

## ✅ Solution
Le problème vient de la fonction `calculate_distance` qui retourne `double precision` au lieu de `NUMERIC`. PostgreSQL ne peut pas faire `round(double precision, 2)`, seulement `round(numeric, 2)`.

## 📋 Action à faire MAINTENANT

### 1️⃣ Ouvrir Supabase
- Allez sur [supabase.com](https://supabase.com)
- Sélectionnez votre projet
- Allez dans **SQL Editor** (icône < dans le menu de gauche)

### 2️⃣ Copier-coller le script
- Créez une **New Query**
- Ouvrez le fichier `database/FIX_ROUND_FUNCTION_COMPLETE.sql`
- **COPIEZ TOUT** le contenu
- **COLLEZ** dans Supabase SQL Editor
- Cliquez sur **Run** (ou Ctrl+Enter)

### 3️⃣ Vérifier le résultat
Vous devez voir :
```
✅ Une seule fonction calculate_distance existe (CORRECT)
✅ calculate_distance retourne NUMERIC (CORRECT)
✅✅✅ CORRECTION TERMINÉE !
```

### 4️⃣ Tester
- Retournez sur l'app mobile
- Faites une **Demande d'intervention**
- Remplissez le formulaire
- Cliquez sur "Soumettre"
- ✅ **Ça devrait fonctionner !**

## 🔍 Ce que le script fait
1. **Supprime** les anciennes fonctions `calculate_distance` et `calculate_distance_km`
2. **Crée** UNE SEULE fonction `calculate_distance` qui retourne `NUMERIC`
3. **Recrée** les fonctions dépendantes (`find_nearby_missions`, `update_artisan_location`)
4. **Configure** les bonnes permissions
5. **Vérifie** que tout est OK

## ⏱️ Temps estimé
**30 secondes** ⚡

## ❓ En cas de problème
Si ça ne fonctionne toujours pas :
1. Vérifiez les logs dans Supabase SQL Editor
2. Assurez-vous que le script s'est exécuté sans erreur
3. Rechargez l'app (Ctrl+R ou Cmd+R)
