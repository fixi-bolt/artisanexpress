# 🔧 Solution : Problème de Cache Supabase

## 🚨 Le Problème

L'erreur que vous rencontrez :
```
Could not find the 'photo' column of 'users' in the schema cache
Cannot coerce the result to a single JSON object (The result contains 0 rows)
```

**Cause** : Le schéma de la base de données est correct, mais le cache de PostgREST (l'API de Supabase) n'a pas été actualisé.

---

## ✅ Solution Rapide (Méthode Recommandée)

### Option 1 : Redémarrer PostgREST via l'Interface Supabase

1. **Allez sur votre tableau de bord Supabase** : https://supabase.com/dashboard/project/nkxucjhavjfsogzpitry

2. **Allez dans les paramètres** :
   - Cliquez sur "Settings" (roue dentée) dans le menu de gauche
   - Puis cliquez sur "API"

3. **Redémarrez le service PostgREST** :
   - Cherchez le bouton "Restart" ou "Restart now"
   - Cliquez dessus
   - Attendez 30-60 secondes que le service redémarre

4. **Testez votre application** :
   - Rechargez votre application (npx expo start --clear)
   - Essayez de créer un compte

---

### Option 2 : Exécuter le Script SQL de Rechargement

Si l'Option 1 ne fonctionne pas, ou si vous n'avez pas accès au bouton Restart :

1. **Allez dans l'éditeur SQL de Supabase** :
   - Ouvrez https://supabase.com/dashboard/project/nkxucjhavjfsogzpitry
   - Cliquez sur "SQL Editor" dans le menu de gauche

2. **Créez une nouvelle requête** :
   - Cliquez sur "New query"

3. **Copiez et exécutez ce code** :
   ```sql
   -- Forcer le rechargement du cache PostgREST
   NOTIFY pgrst, 'reload schema';

   -- Vérifier que les colonnes existent
   SELECT 
       column_name, 
       data_type 
   FROM 
       information_schema.columns
   WHERE 
       table_schema = 'public' 
       AND table_name = 'users'
   ORDER BY 
       ordinal_position;
   ```

4. **Cliquez sur "RUN"**

5. **Vérifiez que les colonnes s'affichent** :
   - Vous devriez voir : `id`, `email`, `name`, `phone`, `photo`, `user_type`, `rating`, `review_count`, `created_at`, `updated_at`

---

## 🔍 Vérification Rapide

Pour vérifier que tout fonctionne :

1. **Dans l'éditeur SQL de Supabase**, exécutez :
   ```sql
   SELECT 
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') AS has_name,
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'photo') AS has_photo,
       EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') AS has_phone;
   ```

2. **Résultat attendu** :
   ```
   has_name | has_photo | has_phone
   ---------|-----------|----------
   true     | true      | true
   ```

---

## 🎯 Après le Redémarrage

Une fois PostgREST redémarré :

1. **Videz le cache de votre application** :
   ```bash
   npx expo start --clear
   ```

2. **Testez l'inscription** :
   - Créez un nouveau compte
   - L'erreur devrait avoir disparu

---

## 🆘 Si le Problème Persiste

Si après ces étapes le problème persiste :

### Vérifiez les Politiques RLS (Row Level Security)

Il est possible que les politiques RLS bloquent l'insertion. Exécutez dans l'éditeur SQL :

```sql
-- Vérifier les politiques RLS sur la table users
SELECT * FROM pg_policies WHERE tablename = 'users';
```

Si vous ne voyez pas de politique pour `INSERT`, ajoutez-en une temporairement :

```sql
-- Politique temporaire pour permettre l'inscription
DROP POLICY IF EXISTS users_insert_own ON users;

CREATE POLICY users_insert_own ON users 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);
```

Puis essayez à nouveau de créer un compte.

---

## 📋 Checklist de Dépannage

- [ ] Redémarrer PostgREST via l'interface Supabase
- [ ] Vider le cache de l'application (expo start --clear)
- [ ] Vérifier que les colonnes existent dans le schéma
- [ ] Vérifier les politiques RLS
- [ ] Tester l'inscription avec un nouvel email

---

## 💡 Pourquoi Ce Problème Arrive ?

PostgREST (l'API REST de Supabase) met en cache le schéma de la base de données pour des raisons de performance. Quand vous modifiez le schéma (ajout de colonnes, tables, etc.), le cache n'est pas toujours automatiquement actualisé.

**Solution définitive** : Toujours redémarrer PostgREST après avoir modifié le schéma de la base de données.

---

## 🎉 Résultat Attendu

Après avoir suivi ces étapes :
- ✅ L'inscription fonctionne sans erreur
- ✅ Le profil utilisateur est créé correctement
- ✅ La connexion fonctionne
- ✅ Les données s'affichent dans l'application

---

**Besoin d'aide ?** Si le problème persiste après toutes ces étapes, vérifiez les logs dans la console de Supabase (Dashboard > Logs).
