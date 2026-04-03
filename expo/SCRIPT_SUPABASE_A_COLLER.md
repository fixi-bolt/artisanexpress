# 📋 Script à Coller sur Supabase

## 🎯 Ce que ce script fait :

Ce script corrige **tous** les problèmes de profil artisan, notamment :
- ✅ Corrige l'erreur `interventionRadius of null`
- ✅ Ajoute des valeurs par défaut pour tous les champs
- ✅ Crée automatiquement les profils manquants
- ✅ Synchronise auth.users avec public.users
- ✅ Crée les wallets pour les artisans
- ✅ Configure correctement les politiques RLS

---

## 📝 Instructions (pas à pas)

### Étape 1 : Ouvrir Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Connectez-vous à votre projet
3. Dans le menu de gauche, cliquez sur **"SQL Editor"**

### Étape 2 : Créer une nouvelle requête
1. Cliquez sur **"New Query"** en haut à droite
2. Donnez-lui un nom (ex: "Fix Artisan Profile")

### Étape 3 : Copier-coller le script
1. Ouvrez le fichier `database/FIX_ARTISAN_PROFILE_COMPLET.sql`
2. **Copiez TOUT le contenu** du fichier
3. **Collez-le** dans l'éditeur SQL de Supabase

### Étape 4 : Exécuter le script
1. Cliquez sur le bouton **"Run"** (ou appuyez sur `Ctrl+Enter` / `Cmd+Enter`)
2. Attendez que le script se termine
3. Vous verrez un message de succès avec un résumé :
   ```
   ====================================
   ✅ CORRECTION TERMINÉE
   ====================================
   Total utilisateurs: X
   Total artisans: Y
   Total clients: Z
   Artisans avec valeurs NULL: 0
   ====================================
   ```

---

## ✅ Vérification

Après avoir exécuté le script, vérifiez que tout fonctionne :

### 1. Vérifier les données artisan
```sql
-- Exécutez cette requête pour vérifier qu'il n'y a plus de NULL
SELECT 
  id, 
  category,
  hourly_rate,
  intervention_radius,
  is_available,
  specialties
FROM artisans
WHERE hourly_rate IS NULL 
   OR intervention_radius IS NULL 
   OR is_available IS NULL;
```

**Résultat attendu** : 0 lignes (aucun NULL)

### 2. Vérifier votre profil artisan
```sql
-- Remplacez 'VOTRE_EMAIL' par votre vrai email
SELECT 
  u.email,
  u.name,
  u.user_type,
  a.hourly_rate,
  a.intervention_radius,
  a.is_available,
  a.specialties
FROM users u
LEFT JOIN artisans a ON u.id = a.id
WHERE u.email = 'VOTRE_EMAIL';
```

**Résultat attendu** : Une ligne avec toutes les valeurs remplies

---

## 🔍 Que faire si ça ne marche pas ?

### Erreur : "permission denied"
➡️ **Solution** : Vous devez être connecté avec un compte qui a les droits d'administration sur Supabase

### Erreur : "relation does not exist"
➡️ **Solution** : Votre schéma n'est pas complètement créé. Exécutez d'abord `database/schema-final.sql`

### Les valeurs sont toujours NULL après le script
➡️ **Solution** : 
1. Vérifiez dans "Table Editor" → "artisans" que les colonnes existent
2. Exécutez à nouveau le script (il est idempotent, donc pas de problème)
3. Déconnectez-vous et reconnectez-vous dans l'application

---

## 🚀 Prochaines étapes

Une fois le script exécuté avec succès :

1. **Testez votre application** :
   - Déconnectez-vous
   - Reconnectez-vous en tant qu'artisan
   - Vérifiez que le profil s'affiche correctement

2. **Vérifiez les fonctionnalités** :
   - Le toggle "Disponibilité" fonctionne
   - Les informations s'affichent (rayon, tarif, etc.)
   - Pas d'erreur dans la console

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans la console de votre navigateur
2. Vérifiez les erreurs dans Supabase (onglet "Logs")
3. Partagez l'erreur complète pour obtenir de l'aide

---

## 🎉 C'est tout !

Après avoir exécuté ce script, tous vos problèmes de profil artisan devraient être résolus !
