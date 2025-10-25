# 🚨 CORRECTION IMMÉDIATE - Erreur Foreign Key

## ❌ Problème
```
ERROR: 42703: column "id" referenced in foreign key constraint does not exist
```

## ✅ Solution

### Étape 1: Ouvrez Supabase
1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche
4. Cliquez sur **New Query**

### Étape 2: Copiez le script
Ouvrez le fichier: `database/FIX_FOREIGN_KEY_ERROR.sql`

### Étape 3: Collez et exécutez
1. **Copiez TOUT le contenu** du fichier `FIX_FOREIGN_KEY_ERROR.sql`
2. **Collez** dans l'éditeur SQL de Supabase
3. Cliquez sur **Run** (ou appuyez sur Ctrl+Enter / Cmd+Enter)

### Étape 4: Vérifiez le résultat
Vous devriez voir en bas:
```
✅ CORRECTION TERMINÉE !
========================================
📊 STATISTIQUES:
  👥 Users: X
  🔧 Artisans: X
  👤 Clients: X
  💰 Wallets: X
  📜 Subscriptions: X

🚀 BASE DE DONNÉES PRÊTE !
```

### Étape 5: Testez l'application
1. Dans votre terminal, appuyez sur **R** pour recharger l'app
2. Essayez de vous connecter

---

## 🔍 Ce que fait le script

Le script:
1. ✅ Supprime toutes les tables dans le bon ordre
2. ✅ Recrée les tables **dans l'ordre correct** (sans erreur de foreign key)
3. ✅ Crée tous les index de performance
4. ✅ Configure les triggers et fonctions
5. ✅ Active les politiques RLS
6. ✅ Crée les profils manquants pour les utilisateurs existants
7. ✅ Crée les wallets et subscriptions automatiquement

---

## ⚠️ Note importante

Ce script **supprime et recrée** toutes les tables. Si vous avez des données importantes, **faites une sauvegarde** avant d'exécuter le script.

Pour faire une sauvegarde:
- Supabase Dashboard → Database → Backups → Create backup

---

## 💡 Après l'exécution

Si le problème persiste:
1. Vérifiez vos variables d'environnement dans `.env`
2. Rechargez complètement l'application (fermez et rouvrez)
3. Vérifiez la console pour d'autres erreurs

---

## 📞 Besoin d'aide ?

Si cette correction ne résout pas le problème, partagez:
- Le message d'erreur complet
- La sortie du script SQL
- Les logs de la console
