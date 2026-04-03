# 🔧 CORRECTION IMMÉDIATE - Colonne user_type manquante

## ❌ Erreur actuelle
```
ERROR: column "user_type" of relation "users" does not exist
```

## ✅ Solution en 3 étapes

### Étape 1: Ouvrir Supabase SQL Editor
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche
4. Cliquez sur **New query** (nouveau requête)

### Étape 2: Copier-Coller le script SQL
1. Ouvrez le fichier `database/FIX_USER_TYPE_COLUMN.sql`
2. **Copiez TOUT le contenu** du fichier (Ctrl+A puis Ctrl+C)
3. **Collez** dans l'éditeur SQL de Supabase (Ctrl+V)

### Étape 3: Exécuter le script
1. Cliquez sur le bouton **Run** (ou appuyez sur Ctrl+Enter)
2. Attendez que l'exécution se termine (environ 5-10 secondes)
3. Vous devriez voir le message: `✅ Schema recréé avec succès!`

---

## 📝 Ce que fait ce script

Le script va :
1. ✅ Supprimer toutes les anciennes tables
2. ✅ Recréer les tables avec la bonne structure (incluant `user_type`)
3. ✅ Configurer les permissions (RLS)
4. ✅ Recharger le cache de Supabase

## ⚠️ ATTENTION
- Ce script **supprime toutes les données existantes**
- Si vous avez des utilisateurs ou données importantes, sauvegardez-les d'abord
- Après l'exécution, vous devrez créer un nouveau compte

## 🔄 Après l'exécution

1. **Fermez complètement votre application** (tuez le processus)
2. **Redémarrez l'application**
3. **Essayez de créer un nouveau compte**

## ✅ Comment vérifier que ça a marché

Après avoir exécuté le script, vous pouvez vérifier avec cette requête :

\`\`\`sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
\`\`\`

Vous devriez voir `user_type` dans la liste des colonnes.

---

## 🆘 Si ça ne marche toujours pas

Si vous voyez encore l'erreur après :
1. Redémarrez votre projet Supabase :
   - Dashboard → Settings → General → Restart project
2. Attendez 2-3 minutes
3. Réessayez de vous inscrire

## 💡 Pourquoi cette erreur ?

Le schéma dans votre base Supabase n'était pas synchronisé avec le code de l'application. Le code essayait d'insérer dans une colonne `user_type` qui n'existait pas dans la base de données.
