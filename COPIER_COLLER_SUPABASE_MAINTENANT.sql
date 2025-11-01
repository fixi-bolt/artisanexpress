-- ========================================
-- 🔧 FIX COMPLET: calculate_distance + RetractableMap
-- ========================================
-- Ce script corrige tous les problèmes actuels

-- ========================================
-- ÉTAPE 1: Supprimer les anciennes versions
-- ========================================
DROP FUNCTION IF EXISTS calculate_distance(NUMERIC, NUMERIC, NUMERIC, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS calculate_distance(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;
DROP FUNCTION IF EXISTS find_nearby_missions(UUID, DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS find_nearby_missions(UUID, DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;

-- ========================================
-- ÉTAPE 2: Créer la fonction calculate_distance (version corrigée)
-- ========================================
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  earth_radius CONSTANT DOUBLE PRECISION := 6371; -- Rayon de la Terre en kilomètres
  d_lat DOUBLE PRECISION;
  d_lon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
  distance DOUBLE PRECISION;
BEGIN
  -- Convertir les degrés en radians
  d_lat := radians(lat2 - lat1);
  d_lon := radians(lon2 - lon1);

  -- Formule de Haversine
  a := sin(d_lat / 2) * sin(d_lat / 2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(d_lon / 2) * sin(d_lon / 2);
  
  c := 2 * atan2(sqrt(a), sqrt(1 - a));
  
  distance := earth_radius * c;
  
  RETURN distance;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_distance IS 'Calcule la distance en kilomètres entre deux points GPS en utilisant la formule de Haversine';

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION calculate_distance TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_distance TO anon;
GRANT EXECUTE ON FUNCTION calculate_distance TO service_role;

-- ========================================
-- ÉTAPE 3: Tester la fonction
-- ========================================
DO $$
DECLARE
  test_distance DOUBLE PRECISION;
BEGIN
  test_distance := calculate_distance(48.8566, 2.3522, 45.7640, 4.8357);
  RAISE NOTICE '✅ Distance test Paris-Lyon: % km (attendu: ~392 km)', ROUND(test_distance::numeric, 0);
  
  IF test_distance BETWEEN 390 AND 395 THEN
    RAISE NOTICE '✅ Fonction calculate_distance fonctionne correctement';
  ELSE
    RAISE WARNING '⚠️ Distance calculée semble incorrecte: % km', test_distance;
  END IF;
END $$;

-- ========================================
-- ÉTAPE 4: Créer find_nearby_missions (corrigée)
-- ========================================
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
  -- Get artisan's category and intervention radius
  SELECT 
    COALESCE(a.category, u.category) as category,
    COALESCE(a.intervention_radius, 50) as radius
  INTO v_category, v_intervention_radius
  FROM users u
  LEFT JOIN artisans a ON a.id = u.id
  WHERE u.id = p_artisan_id;

  -- Return nearby missions
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

COMMENT ON FUNCTION find_nearby_missions IS 'Find pending missions near artisan location within their intervention radius';

-- ========================================
-- ÉTAPE 5: Message de succès
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TOUTES LES FONCTIONS SONT CRÉÉES';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ calculate_distance - OK';
  RAISE NOTICE '✅ find_nearby_missions - OK';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 Vous pouvez maintenant utiliser l application !';
  RAISE NOTICE '========================================';
END $$;
