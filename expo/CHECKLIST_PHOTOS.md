# ✅ Checklist : Photos visibles par l'artisan

## 🎯 Configuration Supabase (À faire dans le Dashboard)

### 1. Créer le bucket
- [ ] Va dans **Storage** (menu gauche)
- [ ] Click **New bucket**
- [ ] Name: `mission-photos`
- [ ] Public bucket: ✅ **COCHÉ**
- [ ] File size limit: `5242880` (5MB)
- [ ] Allowed MIME types: `image/jpeg,image/jpg,image/png,image/webp`
- [ ] Click **Save**

### 2. Créer les policies RLS

#### Policy 1 - Upload (INSERT)
- [ ] Va dans le bucket `mission-photos` → onglet **Policies**
- [ ] Click **New policy** → **For full customization**
- [ ] Name: `mission_photos_insert`
- [ ] Target roles: `authenticated`
- [ ] Operation: `INSERT`
- [ ] Policy definition: `bucket_id = 'mission-photos'`
- [ ] Click **Review** → **Save policy**

#### Policy 2 - Read (SELECT)
- [ ] Click **New policy** → **For full customization**
- [ ] Name: `mission_photos_select`
- [ ] Target roles: `public`
- [ ] Operation: `SELECT`
- [ ] Policy definition: `bucket_id = 'mission-photos'`
- [ ] Click **Review** → **Save policy**

#### Policy 3 - Delete
- [ ] Click **New policy** → **For full customization**
- [ ] Name: `mission_photos_delete`
- [ ] Target roles: `authenticated`
- [ ] Operation: `DELETE`
- [ ] Policy definition: `bucket_id = 'mission-photos'`
- [ ] Click **Review** → **Save policy**

## 🔍 Vérification

### Étape 1 : Vérifier la configuration
- [ ] Va dans **SQL Editor**
- [ ] Exécute le fichier `database/verify-photos-setup.sql`
- [ ] Vérifie que tu vois :
  - ✅ Bucket configuré
  - ✅ 3 Policies RLS
  - ✅ Configuration complète

### Étape 2 : Test upload (Client)
- [ ] Connecte-toi en tant que **client**
- [ ] Crée une nouvelle mission
- [ ] Ajoute 2 photos
- [ ] Soumets la mission
- [ ] Vérifie dans les logs : `[PhotoUpload] Upload successful`
- [ ] Vérifie dans **Supabase Storage → mission-photos** : les photos sont là

### Étape 3 : Test affichage (Artisan)
- [ ] Connecte-toi en tant qu'**artisan**
- [ ] Va sur le dashboard
- [ ] Vérifie que tu vois :
  - [ ] Icône 📷 avec le nombre de photos
  - [ ] Miniatures des photos
- [ ] Clique sur une photo
- [ ] Vérifie que le modal plein écran s'ouvre
- [ ] Ferme le modal avec le bouton X

## 🐛 Dépannage rapide

### ❌ Erreur "permission denied" lors de l'upload
```sql
-- Vérifie la policy INSERT dans SQL Editor
SELECT * FROM storage.policies 
WHERE bucket_id = 'mission-photos' AND command = 'INSERT';
```
Si vide → Recrée la policy INSERT (voir étape 2.1 ci-dessus)

### ❌ Photos ne s'affichent pas (404)
```sql
-- Vérifie que le bucket est public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'mission-photos';
```

### ❌ Miniatures ne chargent pas
```sql
-- Vérifie la policy SELECT
SELECT * FROM storage.policies 
WHERE bucket_id = 'mission-photos' AND command = 'SELECT';
```
Si vide → Recrée la policy SELECT (voir étape 2.2 ci-dessus)

## 📊 Validation finale

Une fois tous les tests passés, vérifie que :

- [ ] Le client peut uploader 1-5 photos
- [ ] Les photos sont stockées dans Supabase Storage
- [ ] L'artisan voit les miniatures dans le dashboard
- [ ] L'artisan peut agrandir les photos en modal
- [ ] Les URLs sont correctes (format `https://xxx.supabase.co/storage/v1/object/public/mission-photos/...`)
- [ ] Aucune erreur 404 dans les logs

## 🎉 Terminé !

Si toutes les cases sont cochées → **Le système de photos fonctionne correctement** ✅

## 📁 Fichiers de référence

- **Guide complet** : `FIX_PHOTOS_ARTISAN_GUIDE.md`
- **Flow technique** : `PHOTO_SYSTEM_FLOW.md`
- **Script SQL** : `database/verify-photos-setup.sql`
- **Actions rapides** : `PHOTOS_ARTISAN_ACTION_IMMEDIATE.md`
