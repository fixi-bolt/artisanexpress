-- ========================================
-- 🔧 SCRIPT À COPIER-COLLER DANS SUPABASE SQL EDITOR
-- ========================================
-- Ce script corrige l'erreur "function calculate_distance does not exist"
-- et remet la carte fonctionnelle
-- 
-- Instructions:
-- 1. Ouvrez Supabase Dashboard
-- 2. Allez dans SQL Editor
-- 3. Copiez-collez tout ce fichier
-- 4. Cliquez sur "Run"
-- ========================================

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS calculate_distance(NUMERIC, NUMERIC, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS calculate_distance(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);

-- Créer la fonction avec les bons types
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  earth_radius CONSTANT DOUBLE PRECISION := 6371;
  d_lat DOUBLE PRECISION;
  d_lon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
  distance DOUBLE PRECISION;
BEGIN
  d_lat := radians(lat2 - lat1);
  d_lon := radians(lon2 - lon1);

  a := sin(d_lat / 2) * sin(d_lat / 2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(d_lon / 2) * sin(d_lon / 2);
  
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  
  distance := earth_radius * c;
  
  RETURN distance;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_distance IS 'Calcule la distance en kilomètres entre deux points GPS';

GRANT EXECUTE ON FUNCTION calculate_distance TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_distance TO anon;
GRANT EXECUTE ON FUNCTION calculate_distance TO service_role;

-- ========================================
-- Recréer find_nearby_missions
-- ========================================
DROP FUNCTION IF EXISTS find_nearby_missions(UUID, DECIMAL, DECIMAL);
DROP FUNCTION IF EXISTS find_nearby_missions(UUID, DOUBLE PRECISION, DOUBLE PRECISION);

CREATE OR REPLACE FUNCTION find_nearby_missions(
  p_artisan_id UUID,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION
)
RETURNS TABLE(
  mission_id UUID,
  distance_km DOUBLE PRECISION,
  title TEXT,
  category TEXT,
  status TEXT,
  estimated_price NUMERIC(10,2),
  description TEXT,
  address TEXT,
  client_id UUID,
  client_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  photos TEXT[],
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_category TEXT;
  v_intervention_radius INTEGER;
BEGIN
  SELECT a.category, COALESCE(a.intervention_radius, 50)
  INTO v_category, v_intervention_radius
  FROM artisans a
  WHERE a.id = p_artisan_id;
  
  IF v_category IS NULL THEN
    SELECT u.category, 50
    INTO v_category, v_intervention_radius
    FROM users u
    WHERE u.id = p_artisan_id AND u.type = 'artisan';
  END IF;

  RETURN QUERY
  SELECT 
    m.id AS mission_id,
    calculate_distance(
      p_latitude, p_longitude,
      m.latitude, m.longitude
    ) AS distance_km,
    m.title,
    m.category,
    m.status,
    m.estimated_price,
    m.description,
    m.address,
    m.client_id,
    COALESCE(u.name, 'Client') AS client_name,
    m.latitude,
    m.longitude,
    m.photos,
    m.created_at
  FROM missions m
  LEFT JOIN users u ON u.id = m.client_id
  WHERE m.status = 'pending'
    AND (v_category IS NULL OR m.category = v_category)
    AND m.artisan_id IS NULL
    AND calculate_distance(
      p_latitude, p_longitude,
      m.latitude, m.longitude
    ) <= v_intervention_radius
  ORDER BY distance_km ASC, m.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION find_nearby_missions TO authenticated;
GRANT EXECUTE ON FUNCTION find_nearby_missions TO service_role;

COMMENT ON FUNCTION find_nearby_missions IS 'Trouve les missions à proximité de l''artisan';

-- ========================================
-- TEST: Vérifier que tout fonctionne
-- ========================================
DO $$
DECLARE
  test_distance DOUBLE PRECISION;
BEGIN
  test_distance := calculate_distance(48.8566, 2.3522, 45.7640, 4.8357);
  RAISE NOTICE '✅ Distance Paris-Lyon: % km (attendu: ~392 km)', ROUND(test_distance::numeric, 0);
  
  IF test_distance BETWEEN 390 AND 395 THEN
    RAISE NOTICE '✅ Fonction calculate_distance fonctionne correctement';
  ELSE
    RAISE WARNING '⚠️  Distance incorrecte: % km', test_distance;
  END IF;
END $$;

RAISE NOTICE '========================================';
RAISE NOTICE '✅ Script exécuté avec succès!';
RAISE NOTICE '✅ Vous pouvez maintenant créer des missions';
RAISE NOTICE '✅ La carte rétractable est disponible';
RAISE NOTICE '========================================';
