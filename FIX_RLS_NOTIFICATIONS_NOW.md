# 🚨 FIX IMMÉDIAT : Erreur RLS Notifications

## ❌ Erreur actuelle
```
new row violates row-level security policy for table "notifications"
```

## ✅ Solution en 30 secondes

### Étape 1 : Ouvrir Supabase
1. Allez sur https://supabase.com
2. Sélectionnez votre projet
3. Cliquez sur "SQL Editor" dans le menu de gauche

### Étape 2 : Copier-Coller le script
1. Ouvrez le fichier `database/FIX_RLS_NOTIFICATIONS_INSERT.sql`
2. **Copiez TOUT le contenu**
3. **Collez** dans l'éditeur SQL de Supabase
4. Cliquez sur **"Run"**

### Étape 3 : Vérifier
Vous devriez voir dans les logs :
```
✅ Test réussi ! Notification créée avec ID: ...
✅ FIX RLS NOTIFICATIONS APPLIQUÉ AVEC SUCCÈS
```

## 🔍 Que fait ce script ?

1. **Supprime les anciennes policies restrictives** qui bloquaient l'insertion
2. **Crée une nouvelle policy permissive** `"System can create notifications"` qui autorise le système à créer des notifications
3. **Conserve les restrictions de lecture** (les utilisateurs ne voient que leurs notifications)
4. **Teste automatiquement** que tout fonctionne

## 📝 Explication technique

Le problème était que la policy RLS bloquait l'insertion de notifications même depuis une fonction `SECURITY DEFINER`. La nouvelle policy avec `WITH CHECK (true)` permet au système de créer des notifications pour n'importe quel utilisateur, ce qui est nécessaire pour le trigger automatique lors de l'acceptation d'une mission.

## ✅ Après l'application

Testez dans votre app :
1. En tant qu'artisan, acceptez une mission
2. En tant que client, vérifiez que vous recevez la notification
3. Les notifications devraient maintenant fonctionner ! 🎉

## ❓ En cas de problème

Si ça ne marche toujours pas, vérifiez dans Supabase SQL Editor :

```sql
-- Vérifier les notifications créées
SELECT * FROM notifications 
ORDER BY created_at DESC 
LIMIT 5;

-- Vérifier les policies actives
SELECT * FROM pg_policies 
WHERE tablename = 'notifications';
```
