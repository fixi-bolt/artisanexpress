-- ====================================================================
-- Script de vérification : Configuration des photos
-- À exécuter dans Supabase SQL Editor
-- ====================================================================

-- 1️⃣ VÉRIFICATION DU BUCKET
-- ====================================================================
SELECT 
  '✅ Bucket mission-photos' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM storage.buckets 
      WHERE id = 'mission-photos' AND public = true
    ) THEN '✅ CONFIGURÉ CORRECTEMENT'
    WHEN EXISTS (
      SELECT 1 FROM storage.buckets 
      WHERE id = 'mission-photos' AND public = false
    ) THEN '⚠️ EXISTE MAIS PAS PUBLIC'
    ELSE '❌ BUCKET MANQUANT'
  END as status;

-- Détails du bucket
SELECT 
  id as bucket_id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'mission-photos';

-- 2️⃣ VÉRIFICATION DES POLICIES
-- ====================================================================
SELECT 
  '✅ Policies RLS' as check_name,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ ' || COUNT(*) || ' POLICIES ACTIVES'
    WHEN COUNT(*) > 0 THEN '⚠️ SEULEMENT ' || COUNT(*) || ' POLICIES (devrait être 3)'
    ELSE '❌ AUCUNE POLICY'
  END as status
FROM storage.policies 
WHERE bucket_id = 'mission-photos';

-- Liste détaillée des policies
SELECT 
  name,
  command as operation,
  CASE 
    WHEN 'authenticated' = ANY(roles) THEN 'authenticated'
    WHEN 'public' = ANY(roles) THEN 'public'
    ELSE array_to_string(roles, ', ')
  END as allowed_role,
  CASE 
    WHEN definition LIKE '%mission-photos%' THEN '✅'
    ELSE '⚠️'
  END as correct_bucket
FROM storage.policies 
WHERE bucket_id = 'mission-photos'
ORDER BY command;

-- 3️⃣ VÉRIFICATION DES PHOTOS UPLOADÉES
-- ====================================================================
SELECT 
  '📊 Photos stockées' as info,
  COUNT(*) as total_photos,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_size_mb
FROM storage.objects 
WHERE bucket_id = 'mission-photos';

-- Dernières photos uploadées
SELECT 
  name as filename,
  SUBSTRING(name FROM 'missions/([^/]+)') as mission_id,
  created_at,
  ROUND((metadata->>'size')::bigint / 1024.0, 2) as size_kb,
  metadata->>'mimetype' as mime_type
FROM storage.objects 
WHERE bucket_id = 'mission-photos'
ORDER BY created_at DESC
LIMIT 10;

-- 4️⃣ VÉRIFICATION DES MISSIONS AVEC PHOTOS
-- ====================================================================
SELECT 
  '📋 Missions avec photos' as info,
  COUNT(*) as total_missions_with_photos,
  SUM(array_length(photos, 1)) as total_photo_refs,
  ROUND(AVG(array_length(photos, 1)), 1) as avg_photos_per_mission
FROM missions 
WHERE photos IS NOT NULL 
  AND array_length(photos, 1) > 0;

-- Dernières missions avec photos
SELECT 
  id,
  title,
  status,
  array_length(photos, 1) as photo_count,
  created_at,
  -- Premier URL de photo (pour test)
  SUBSTRING(photos[1] FROM 'https://[^/]+/storage/v1/object/public/([^?]+)') as first_photo_path
FROM missions 
WHERE photos IS NOT NULL 
  AND array_length(photos, 1) > 0
ORDER BY created_at DESC
LIMIT 10;

-- 5️⃣ TEST DE COHÉRENCE
-- ====================================================================
-- Vérifie que toutes les URLs dans les missions pointent vers le bon bucket
SELECT 
  '🔍 Cohérence URLs' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ TOUTES LES URLs SONT VALIDES'
    ELSE '⚠️ ' || COUNT(*) || ' MISSIONS AVEC URLs INCORRECTES'
  END as status
FROM missions m
CROSS JOIN LATERAL unnest(m.photos) as photo_url
WHERE m.photos IS NOT NULL 
  AND array_length(m.photos, 1) > 0
  AND photo_url NOT LIKE '%mission-photos%';

-- 6️⃣ RÉSUMÉ FINAL
-- ====================================================================
SELECT 
  '📊 RÉSUMÉ CONFIGURATION' as section,
  '===================' as separator;

WITH summary AS (
  SELECT 
    EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'mission-photos' AND public = true) as bucket_ok,
    (SELECT COUNT(*) FROM storage.policies WHERE bucket_id = 'mission-photos') >= 3 as policies_ok,
    (SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'mission-photos') as photo_count,
    (SELECT COUNT(*) FROM missions WHERE array_length(photos, 1) > 0) as missions_with_photos
)
SELECT 
  CASE WHEN bucket_ok THEN '✅' ELSE '❌' END || ' Bucket configuré' as check_1,
  CASE WHEN policies_ok THEN '✅' ELSE '❌' END || ' Policies RLS' as check_2,
  CASE WHEN photo_count > 0 THEN '✅' ELSE '⚠️' END || ' ' || photo_count || ' photos stockées' as check_3,
  CASE WHEN missions_with_photos > 0 THEN '✅' ELSE '⚠️' END || ' ' || missions_with_photos || ' missions avec photos' as check_4,
  CASE 
    WHEN bucket_ok AND policies_ok THEN '✅ CONFIGURATION COMPLÈTE'
    WHEN bucket_ok THEN '⚠️ BUCKET OK MAIS POLICIES MANQUANTES'
    ELSE '❌ CONFIGURATION INCOMPLÈTE'
  END as final_status
FROM summary;

-- 7️⃣ ACTIONS RECOMMANDÉES (si erreurs)
-- ====================================================================
-- Si le bucket n'est pas public :
-- UPDATE storage.buckets SET public = true WHERE id = 'mission-photos';

-- Si les policies manquent, exécute :
-- CREATE POLICY "mission_photos_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'mission-photos');
-- CREATE POLICY "mission_photos_select" ON storage.objects FOR SELECT TO public USING (bucket_id = 'mission-photos');
-- CREATE POLICY "mission_photos_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'mission-photos');
