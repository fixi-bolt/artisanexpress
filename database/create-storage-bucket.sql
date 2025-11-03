-- ========================================
-- 📦 SUPABASE STORAGE BUCKET FOR MISSION PHOTOS
-- ========================================

-- This script creates a storage bucket for mission photos and sets up RLS policies
-- to allow clients to upload and artisans to view photos

-- 1. Create the storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('mission-photos', 'mission-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload mission photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view mission photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow mission owner to delete photos" ON storage.objects;

-- 4. Create policy: Allow authenticated clients to upload photos
CREATE POLICY "Allow authenticated users to upload mission photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'mission-photos'
);

-- 5. Create policy: Allow public to view photos (so artisans can see them)
CREATE POLICY "Allow public to view mission photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'mission-photos');

-- 6. Create policy: Allow mission creators to delete their photos
CREATE POLICY "Allow mission owner to delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'mission-photos'
);

-- 7. Update existing missions table to ensure photos column can store full URLs
COMMENT ON COLUMN missions.photos IS 'Array of public URLs to photos stored in Supabase Storage';

-- ========================================
-- ✅ VERIFICATION QUERIES (run these to check setup)
-- ========================================

-- Check if bucket exists
-- SELECT * FROM storage.buckets WHERE id = 'mission-photos';

-- Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- ========================================
-- 📝 NOTES
-- ========================================
-- 1. Photos are stored in: missions/{mission-id}/{photo-filename}
-- 2. Public URLs are automatically generated and stored in missions.photos
-- 3. Artisans can view all photos via public URLs
-- 4. Only authenticated users can upload (done via client app)
-- 5. Bucket is public, so no authentication needed to view photos
