# ✅ Photos visibles par l'artisan - Actions terminées

## 🎉 Résumé

Le système de photos est maintenant **entièrement configuré** :

### ✅ Configuration Supabase (fait dans le Dashboard)
1. Bucket `mission-photos` créé et public ✅
2. Policy INSERT pour authenticated ✅  
3. Policy SELECT pour public ✅
4. Policy DELETE pour authenticated ✅

### ✅ Code Frontend (déjà en place)
1. Upload des photos via `utils/uploadPhotos.ts` ✅
2. Affichage dans le dashboard artisan ✅
3. Modal plein écran pour agrandir ✅
4. Logs de debug améliorés ✅

## 🧪 Test rapide

### 1. Vérifier la configuration Supabase

Exécute ce script dans **Supabase SQL Editor** :

```bash
database/verify-photos-setup.sql
```

Tu devrais voir :
- ✅ Bucket configuré
- ✅ 3 Policies RLS
- ✅ Configuration complète

### 2. Tester l'upload (Client)

1. Connecte-toi en tant que **client**
2. Crée une nouvelle mission
3. Ajoute 2-3 photos
4. Soumets la mission

**Logs attendus** :
```
[PhotoUpload] Uploading photo 1/2: file:///...
[PhotoUpload] Uploading to bucket: mission-photos, path: missions/xxx/xxx.jpg
[PhotoUpload] Upload successful for photo 1
[PhotoUpload] Public URL generated: https://xxx.supabase.co/storage/v1/object/public/mission-photos/missions/xxx/xxx.jpg
✅ Mission created successfully
```

### 3. Tester l'affichage (Artisan)

1. Connecte-toi en tant qu'**artisan**
2. Va sur le dashboard
3. Tu dois voir :
   - 📷 Icône avec nombre de photos
   - Miniatures des photos
4. Clique sur une photo → Modal plein écran

## 📊 Vérification rapide dans Supabase

### Storage → mission-photos
Tu devrais voir une structure comme :
```
missions/
  ├── mission-id-1/
  │   ├── mission-id-1_0_timestamp.jpg
  │   └── mission-id-1_1_timestamp.jpg
  └── mission-id-2/
      └── mission-id-2_0_timestamp.jpg
```

### Table missions
```sql
SELECT id, title, array_length(photos, 1) as photo_count, photos[1] 
FROM missions 
WHERE photos IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;
```

Tu devrais voir des URLs comme :
```
https://xxx.supabase.co/storage/v1/object/public/mission-photos/missions/xxx/xxx.jpg
```

## ❌ En cas d'erreur

### "Failed to upload photo: permission denied"
```sql
-- Vérifie la policy INSERT
SELECT * FROM storage.policies WHERE bucket_id = 'mission-photos' AND command = 'INSERT';

-- Si manquante, recrée :
CREATE POLICY "mission_photos_insert" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'mission-photos');
```

### "404 Not Found" sur les images
```sql
-- Vérifie que le bucket est public
UPDATE storage.buckets SET public = true WHERE id = 'mission-photos';

-- Vérifie la policy SELECT
CREATE POLICY "mission_photos_select" ON storage.objects 
FOR SELECT TO public 
USING (bucket_id = 'mission-photos');
```

## 📁 Fichiers modifiés

- ✅ `utils/uploadPhotos.ts` - Logs de debug améliorés
- ✅ `FIX_PHOTOS_ARTISAN_GUIDE.md` - Guide complet
- ✅ `database/verify-photos-setup.sql` - Script de vérification

## 🎯 Prochaine étape

**Teste maintenant** :
1. Exécute `database/verify-photos-setup.sql` dans Supabase
2. Crée une mission avec des photos (client)
3. Vérifie l'affichage (artisan)

Si tout fonctionne → ✅ **Problème résolu !**

Si erreur → Partage les logs console et je t'aide.
