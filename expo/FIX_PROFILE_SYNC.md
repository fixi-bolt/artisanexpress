# 🔧 CORRECTION : Synchronisation des profils utilisateurs

## ❌ Problème actuel
L'utilisateur avec l'ID `a52ede25-7947-48cb-9c3b-5ae865a6d8a0` existe dans `auth.users` mais pas dans la table `users` publique.

## ✅ Solution en 3 étapes

### Étape 1: Exécuter le script SQL dans Supabase

1. Allez sur **https://supabase.com/dashboard**
2. Sélectionnez votre projet **ArtisanNow**
3. Allez dans **SQL Editor** (dans le menu de gauche)
4. Cliquez sur **New Query**
5. Copiez-collez TOUT le contenu du fichier `database/fix-auth-profile-sync.sql`
6. Cliquez sur **Run** (ou appuyez sur Ctrl+Enter)

### Étape 2: Vérifier que ça fonctionne

Après avoir exécuté le script, vous devriez voir 3 résultats:
```
Auth users count: X
Public users count: X  (doit être égal)
Missing profiles: 0    (doit être 0)
```

### Étape 3: Tester la connexion

1. Fermez complètement l'application
2. Rouvrez l'application
3. Essayez de vous connecter avec vos identifiants

## 🎯 Ce que fait le script

1. **Crée un trigger automatique** qui synchronise chaque nouvel utilisateur auth avec la table users
2. **Corrige les utilisateurs existants** en créant leurs profils manquants
3. **Crée les entrées clients** pour tous les utilisateurs de type client
4. **Ajoute les politiques RLS** pour permettre les insertions automatiques

## 🔍 Pourquoi ce problème est arrivé ?

Le code d'inscription créait d'abord l'utilisateur dans `auth.users`, puis essayait de créer le profil dans `users`. Si la création du profil échouait (cache, RLS, etc.), l'utilisateur existait dans auth mais pas dans la table publique.

## 🛡️ Protection future

Le trigger créé va maintenant **automatiquement** créer un profil dans `users` pour chaque nouvel utilisateur inscrit, même si le code applicatif échoue.

## ❓ Besoin d'aide ?

Si après ces étapes le problème persiste:
1. Vérifiez que le script SQL s'est bien exécuté sans erreur
2. Vérifiez dans **Table Editor → users** que votre utilisateur existe
3. Essayez de vous déconnecter puis reconnecter
