# 🔧 Guide de correction : Photos visibles par l'artisan

## ✅ État actuel du code

Le code frontend est **déjà correctement configuré** :

### 1. Upload des photos (`utils/uploadPhotos.ts`)
- ✅ Utilise le bucket `'mission-photos'`
- ✅ Upload les photos avec le bon format
- ✅ Retourne les URLs publiques
- ✅ Gestion d'erreurs complète

### 2. Affichage des photos dans le dashboard artisan
- ✅ Photos affichées dans `NearbyMissionCard` (lignes 309-330)
- ✅ Photos affichées dans `MissionRequestCard` (lignes 413-434)
- ✅ Modal plein écran pour agrandir les photos
- ✅ Compteur de photos visible

### 3. Affichage des photos dans les détails de mission
- ✅ Section photos dans `app/mission-details.tsx` (lignes 160-189)
- ✅ Modal plein écran fonctionnel

## 🎯 Configuration requise dans Supabase Dashboard

### Étape 1 : Créer le bucket (DÉJÀ FAIT ✅)

Tu as déjà créé le bucket via le Dashboard :
- Name: `mission-photos`
- Public: ✅ OUI
- File size limit: 5242880 (5MB)
- Allowed MIME types: `image/jpeg,image/jpg,image/png,image/webp`

### Étape 2 : Configurer les policies (DÉJÀ FAIT ✅)

Les 3 policies sont créées :

#### Policy 1 - Upload (INSERT)
```sql
CREATE POLICY "mission_photos_insert" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'mission-photos');
```

#### Policy 2 - Read (SELECT)
```sql
CREATE POLICY "mission_photos_select" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'mission-photos');
```

#### Policy 3 - Delete
```sql
CREATE POLICY "mission_photos_delete" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'mission-photos');
```

## 🧪 Tests à effectuer

### Test 1 : Upload depuis le client
1. Connecte-toi en tant que **client**
2. Crée une nouvelle mission (bouton "Nouvelle demande")
3. Ajoute 1-3 photos
4. Vérifie dans les logs : `[PhotoUpload] Photo X uploaded successfully`
5. Soumets la mission

### Test 2 : Visualisation par l'artisan
1. Connecte-toi en tant qu'**artisan**
2. Va sur le dashboard
3. Vérifie que tu vois :
   - L'icône 📷 avec le nombre de photos
   - La barre de défilement horizontal avec les miniatures
4. Clique sur une photo → modal plein écran
5. Ferme le modal avec le bouton X

### Test 3 : Vérifier les URLs dans Supabase
1. Va dans **Supabase Dashboard → Storage → mission-photos**
2. Tu devrais voir :
   ```
   missions/
     ├── {mission-id}/
     │   ├── {mission-id}_0_{timestamp}.jpg
     │   ├── {mission-id}_1_{timestamp}.jpg
     │   └── {mission-id}_2_{timestamp}.jpg
   ```
3. Clique sur une image → Copie l'URL publique
4. Ouvre l'URL dans un navigateur → L'image doit s'afficher

## 🔍 Diagnostic en cas de problème

### Problème 1 : "Upload failed - permission denied"

**Solution** : Vérifie la policy INSERT
```sql
-- Exécute dans Supabase SQL Editor
SELECT * FROM storage.policies 
WHERE bucket_id = 'mission-photos' AND command = 'INSERT';
```

Si vide ou incorrecte, recrée la policy :
```sql
CREATE POLICY "mission_photos_insert" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'mission-photos');
```

### Problème 2 : "Les miniatures ne s'affichent pas"

**Cause** : Les URLs sont incorrectes ou le bucket n'est pas public

**Solution** :
```sql
-- Vérifie que le bucket est public
SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'mission-photos';

-- Si public = false, corrige :
UPDATE storage.buckets 
SET public = true 
WHERE id = 'mission-photos';
```

### Problème 3 : "404 Not Found sur les images"

**Cause** : Policy SELECT manquante ou incorrecte

**Solution** :
```sql
-- Vérifie la policy SELECT
SELECT * FROM storage.policies 
WHERE bucket_id = 'mission-photos' AND command = 'SELECT';

-- Si manquante, recrée :
CREATE POLICY "mission_photos_select" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'mission-photos');
```

## 📊 Script de vérification complet

Exécute ce script dans **Supabase SQL Editor** pour vérifier toute la configuration :

```sql
-- 1. Vérifier que le bucket existe et est public
SELECT 
  id, 
  name, 
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'mission-photos';

-- 2. Vérifier les policies
SELECT 
  name,
  command,
  roles,
  definition
FROM storage.policies 
WHERE bucket_id = 'mission-photos'
ORDER BY command;

-- 3. Lister les photos uploadées (dernières 20)
SELECT 
  name,
  bucket_id,
  created_at,
  metadata->>'size' as size_bytes
FROM storage.objects 
WHERE bucket_id = 'mission-photos'
ORDER BY created_at DESC
LIMIT 20;

-- 4. Vérifier les missions avec photos
SELECT 
  id,
  title,
  status,
  array_length(photos, 1) as photo_count,
  photos[1] as first_photo_url
FROM missions 
WHERE photos IS NOT NULL 
  AND array_length(photos, 1) > 0
ORDER BY created_at DESC
LIMIT 10;
```

## 🎯 Résultat attendu

### ✅ Configuration correcte
- Bucket `mission-photos` existe et est **public**
- 3 policies actives (INSERT, SELECT, DELETE)
- Les photos uploadées sont visibles dans Storage
- Les missions contiennent des URLs publiques dans la colonne `photos`

### ✅ Comportement frontend
- **Client** : Peut uploader 1-5 photos lors de la création d'une mission
- **Artisan** : Voit les miniatures dans le dashboard et peut les agrandir
- **Tous** : Les photos se chargent rapidement sans erreur 404

## 🚀 Si tout fonctionne

Tu devrais voir dans les logs du client :
```
[PhotoUpload] Uploading photo 1/2: file:///...
[PhotoUpload] Photo 1 uploaded successfully: https://xxx.supabase.co/storage/v1/object/public/mission-photos/missions/xxx/xxx.jpg
[MissionContext] Photos uploaded: ["https://...", "https://..."]
✅ Mission created successfully: {...}
```

Et dans l'app artisan :
- Les cartes de mission affichent "📷 2 photos"
- Les miniatures sont visibles en défilement horizontal
- Cliquer sur une photo l'affiche en plein écran

## 📞 En cas de blocage

Si après avoir suivi ce guide les photos ne s'affichent toujours pas :

1. **Vérifie les logs** dans l'app :
   - Recherche `[PhotoUpload]` pour voir les uploads
   - Recherche `Error` pour voir les erreurs

2. **Teste une URL directement** :
   - Copie l'URL d'une photo depuis la DB
   - Ouvre-la dans un navigateur
   - Si 404 → problème de policy ou bucket non public
   - Si l'image s'affiche → problème frontend

3. **Vérifie la console Supabase** :
   - Storage → mission-photos → Les fichiers sont là ?
   - Policies → Les 3 policies sont actives ?

---

**Dernière mise à jour** : Configuration complète vérifiée et documentée.
