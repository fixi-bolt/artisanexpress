# 🔧 CORRECTION ERREUR "column u.type does not exist"

## ❌ Problème
Lors de la création d'une mission, vous recevez l'erreur :
```
column u.type does not exist
```

## 🎯 Cause
Dans la fonction SQL `notify_nearby_artisans()`, la requête utilise `u.type` mais la colonne correcte dans la table `users` est `u.user_type`.

## ✅ Solution

### Étape 1 : Copier le script SQL
Ouvrez le fichier : `database/FIX_USER_TYPE_COLUMN_NOW.sql`

### Étape 2 : Exécuter dans Supabase
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur "SQL Editor" dans le menu de gauche
4. Cliquez sur "+ New query"
5. Collez le contenu du fichier `database/FIX_USER_TYPE_COLUMN_NOW.sql`
6. Cliquez sur "Run" (ou Ctrl+Enter)

### Étape 3 : Vérifier
Vous devriez voir :
```
✓ Trigger "on_mission_created_notify_artisans" existe
✓ Fonction "notify_nearby_artisans" existe
✅ CORRECTION RÉUSSIE !
🎯 Vous pouvez maintenant créer des missions sans erreur
```

### Étape 4 : Tester
1. Relancez l'application
2. Essayez de créer une nouvelle demande d'intervention
3. L'erreur ne devrait plus apparaître

## 📋 Ce qui a été corrigé

**Avant (ligne 63) :**
```sql
WHERE u.type = 'artisan'  -- ❌ Mauvais nom de colonne
```

**Après (ligne 63) :**
```sql
WHERE u.user_type = 'artisan'  -- ✅ Bon nom de colonne
```

## ⏱️ Temps estimé
⏰ 30 secondes

## 🆘 En cas de problème
Si l'erreur persiste :
1. Vérifiez que le script s'est exécuté sans erreur
2. Vérifiez les logs dans Supabase (section "Logs")
3. Essayez de rafraîchir l'application (Cmd+R ou Ctrl+R)
