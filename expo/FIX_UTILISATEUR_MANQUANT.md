# 🔧 CORRECTION - Profil utilisateur manquant

## 🎯 Problème
L'utilisateur avec l'ID `a52ede25-7947-48cb-9c3b-5ae865a6d8a0` existe dans l'authentification Supabase mais pas dans la table `users`.

## ✅ Solution rapide

### Étape 1: Ouvrir l'éditeur SQL
1. Allez sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet **ArtisanNow**
3. Dans le menu de gauche, cliquez sur **SQL Editor**

### Étape 2: Copier et exécuter le script
1. Cliquez sur **New query**
2. Ouvrez le fichier `database/fix-missing-user-profile.sql`
3. **Copiez UNIQUEMENT le code SQL** (pas les commentaires markdown)
4. Collez dans l'éditeur SQL de Supabase
5. Cliquez sur **Run** (ou appuyez sur Ctrl+Enter)

### Étape 3: Vérifier le résultat
Vous devriez voir dans les messages:
```
✅ Profil utilisateur créé avec succès!
```

### Étape 4: Tester la connexion
1. Retournez dans votre application
2. Essayez de vous connecter avec vos identifiants
3. L'utilisateur devrait maintenant pouvoir se connecter

## 🔍 Vérification manuelle

Si vous voulez vérifier manuellement dans l'éditeur SQL:

```sql
-- Voir l'utilisateur dans auth
SELECT id, email, created_at 
FROM auth.users 
WHERE id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0';

-- Voir l'utilisateur dans public.users
SELECT id, email, name, user_type 
FROM users 
WHERE id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0';

-- Les deux requêtes devraient retourner des résultats
```

## ⚠️ Note importante

Si le problème persiste après avoir exécuté le script, il se peut que:
1. Le cache du schéma Supabase n'est pas rechargé → **Redémarrez votre projet Supabase**
2. Un autre utilisateur a le même problème → **Exécutez à nouveau le script avec le bon ID**

## 🚀 Pour éviter ce problème à l'avenir

Le code dans `contexts/AuthContext.tsx` gère déjà la création du profil lors de l'inscription. Ce problème ne devrait plus se reproduire pour les nouveaux utilisateurs.

Pour cet utilisateur spécifique qui a été créé avant la correction, le script ci-dessus est la solution.
