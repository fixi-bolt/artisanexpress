# 🔧 FIX SCHEMA CACHE - SOLUTION IMMÉDIATE

## ❌ Problème
```
Could not find the 'name' column of 'users' in the schema cache
```

Cela signifie que Supabase n'a pas actualisé son cache du schéma après la création de votre table.

## ✅ Solution en 3 étapes

### Étape 1 : Ouvrir l'éditeur SQL de Supabase
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur "SQL Editor" dans le menu de gauche

### Étape 2 : Copier-coller ce code SQL

```sql
-- Vérifier si la colonne existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';

-- Si la colonne 'name' n'existe PAS, ajoutez-la
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'User';

-- Rafraîchir le cache du schéma Supabase (TRÈS IMPORTANT!)
NOTIFY pgrst, 'reload schema';

-- Vérifier que tout est OK
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

### Étape 3 : Cliquer sur "Run"

Attendez quelques secondes que Supabase rafraîchisse le cache.

## 🔄 Alternative : Réinitialiser complètement la base de données

Si la solution ci-dessus ne fonctionne pas, vous devez réinitialiser la base de données :

1. Dans Supabase, allez dans "Database" → "Tables"
2. Supprimez TOUTES les tables existantes
3. Retournez dans "SQL Editor"
4. Exécutez le fichier `database/schema-final.sql` complet
5. Attendez que toutes les tables soient créées
6. Exécutez la commande de refresh :
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

## 🧪 Tester

Après avoir exécuté le fix :

1. Redémarrez votre application Expo : `npx expo start --clear`
2. Essayez de vous inscrire à nouveau
3. Le problème devrait être résolu

## 💡 Pourquoi ce problème arrive ?

Supabase utilise PostgREST qui garde en cache le schéma de la base de données pour améliorer les performances. Quand vous modifiez le schéma (ajout de colonnes, tables, etc.), le cache n'est pas automatiquement mis à jour. La commande `NOTIFY pgrst, 'reload schema'` force PostgREST à recharger le schéma.

## 🆘 Besoin d'aide ?

Si le problème persiste :
1. Vérifiez les logs dans Supabase Dashboard → "Database" → "Logs"
2. Assurez-vous que toutes les migrations ont été exécutées avec succès
3. Vérifiez que vous utilisez le bon projet Supabase (URL et clés)
