-- ========================================
-- 🔍 VÉRIFICATION RAPIDE DES TABLES
-- ========================================
-- Copier-coller ce script dans Supabase SQL Editor

-- 1️⃣ Vérifier que la table 'artisans' existe
SELECT 
  table_name,
  CASE 
    WHEN table_name = 'artisans' THEN '✅ Table artisans existe'
    ELSE '❌ Table manquante'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'artisans', 'clients', 'missions', 'notifications');

-- 2️⃣ Vérifier les colonnes de la table artisans
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'artisans'
ORDER BY ordinal_position;

-- 3️⃣ Compter les artisans disponibles
SELECT 
  COUNT(*) as total_artisans,
  COUNT(CASE WHEN is_available = true THEN 1 END) as artisans_disponibles,
  COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as artisans_avec_geoloc
FROM artisans;

-- 4️⃣ Vérifier qu'il n'y a pas de table 'artisan_profiles' (qui ne doit PAS exister)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Pas de table artisan_profiles (correct)'
    ELSE '⚠️ Table artisan_profiles existe (à supprimer)'
  END as verification
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'artisan_profiles';
