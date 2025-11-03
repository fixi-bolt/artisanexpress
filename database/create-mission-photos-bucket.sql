-- ============================================
-- SCRIPT DE CRÉATION DU BUCKET MISSION-PHOTOS
-- ============================================
-- ⚠️ IMPORTANT : Exécutez ce script en tant que "postgres" role dans Supabase SQL Editor
-- OU suivez les instructions manuelles via Dashboard (plus sûr)

-- 1️⃣ CRÉATION DU BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'mission-photos',
    'mission-photos',
    true,  -- Public pour que les artisans puissent voir les photos
    5242880,  -- 5MB max par fichier
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) 
DO UPDATE SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- 2️⃣ POLICIES RLS SUR STORAGE.OBJECTS
-- ============================================
-- ⚠️ Ces policies nécessitent le rôle postgres ou owner de storage.objects

-- Policy 1: Upload pour utilisateurs authentifiés
DROP POLICY IF EXISTS "mission_photos_insert" ON storage.objects;
CREATE POLICY "mission_photos_insert" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'mission-photos');

-- Policy 2: Lecture publique (pour que les artisans voient les photos)
DROP POLICY IF EXISTS "mission_photos_select" ON storage.objects;
CREATE POLICY "mission_photos_select" 
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'mission-photos');

-- Policy 3: Mise à jour pour utilisateurs authentifiés
DROP POLICY IF EXISTS "mission_photos_update" ON storage.objects;
CREATE POLICY "mission_photos_update" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'mission-photos');

-- Policy 4: Suppression pour utilisateurs authentifiés
DROP POLICY IF EXISTS "mission_photos_delete" ON storage.objects;
CREATE POLICY "mission_photos_delete" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'mission-photos');

-- ============================================
-- ✅ VÉRIFICATIONS
-- ============================================

-- Vérifier que le bucket existe
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'mission-photos';

-- Vérifier les policies
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE 'mission_photos%';

-- ============================================
-- 📝 NOTES D'UTILISATION
-- ============================================
-- 
-- Format d'upload des photos:
--   - Path: missions/{mission-id}/{timestamp}-{filename}
--   - URL publique: {SUPABASE_URL}/storage/v1/object/public/mission-photos/missions/{mission-id}/{photo}
--
-- Exemple dans le code:
--   const { data, error } = await supabase.storage
--     .from('mission-photos')
--     .upload(`missions/${missionId}/${Date.now()}-photo.jpg`, file);
--
-- ============================================
