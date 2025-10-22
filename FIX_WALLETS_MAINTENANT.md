# 🔧 CORRECTION - Table WALLETS manquante

## ❌ Problème

Vous avez cette erreur :
```
ERROR: 42P01: relation "wallets" does not exist
```

Cela signifie que la table `wallets` n'existe pas dans votre base de données Supabase.

## ✅ Solution

### Étape 1: Ouvrir l'éditeur SQL de Supabase

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur **"SQL Editor"** dans le menu de gauche (icône </> ou texte "SQL Editor")

### Étape 2: Exécuter le script de correction

1. Cliquez sur **"New query"** (ou "+ New")
2. Copiez TOUT le contenu du fichier `database/fix-create-all-missing-tables.sql`
3. Collez-le dans l'éditeur SQL
4. Cliquez sur **"RUN"** (bouton en bas à droite)

### Étape 3: Vérifier que ça fonctionne

Vous devriez voir dans les résultats :
```
✅ Tables créées avec succès: wallets, withdrawals
✅✅✅ Toutes les tables ont été créées avec succès!
```

### Étape 4: Redémarrer votre application

1. Arrêtez votre serveur de développement (Ctrl+C)
2. Redémarrez-le avec `bun start` ou `npm start`
3. Testez à nouveau votre application

## 🔍 Si ça ne fonctionne toujours pas

Si vous avez toujours l'erreur après avoir exécuté le script :

### Option A: Vérifier que les tables existent

Exécutez cette requête dans l'éditeur SQL :
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('wallets', 'withdrawals')
ORDER BY table_name;
```

Vous devriez voir les deux tables listées.

### Option B: Recréer tout le schéma

Si votre base de données est vide ou si vous pouvez tout réinitialiser :

1. Exécutez `database/setup-new-supabase.sql` (le fichier complet)
2. Cela créera toutes les tables nécessaires

## 📋 Contenu du script fix-create-all-missing-tables.sql

Le script crée :
- ✅ Table `wallets` avec toutes ses colonnes
- ✅ Table `withdrawals` avec toutes ses colonnes  
- ✅ Index pour améliorer les performances
- ✅ Triggers pour mettre à jour `updated_at` automatiquement
- ✅ Politiques RLS (Row Level Security) pour la sécurité
- ✅ Vérifications pour confirmer la création

## 🆘 Support

Si vous avez toujours des problèmes :
1. Vérifiez que vous êtes connecté au bon projet Supabase
2. Vérifiez que votre fichier `.env` contient les bonnes informations de connexion
3. Essayez de rafraîchir la page Supabase Dashboard
4. Contactez le support Supabase si le problème persiste
