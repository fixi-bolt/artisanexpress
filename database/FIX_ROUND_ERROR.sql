-- ========================================
-- 🔧 FIX: Erreur "function round(double precision, integer) does not exist"
-- ========================================
-- Cette erreur se produit lors de la création de missions
-- La cause : La fonction calculate_distance n'existe pas en base de données
-- ========================================

-- Supprimer les anciennes versions si elles existent
DROP FUNCTION IF EXISTS calculate_distance(NUMERIC, NUMERIC, NUMERIC, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS calculate_distance_km(DECIMAL, DECIMAL, DECIMAL, DECIMAL) CASCADE;

-- ========================================
-- CRÉER LA FONCTION calculate_distance
-- ========================================
-- Cette fonction calcule la distance entre deux points GPS en kilomètres
-- Utilise la formule de Haversine

CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 NUMERIC,
  lon1 NUMERIC,
  lat2 NUMERIC,
  lon2 NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  earth_radius CONSTANT NUMERIC := 6371; -- Rayon de la Terre en kilomètres
  d_lat NUMERIC;
  d_lon NUMERIC;
  a NUMERIC;
  c NUMERIC;
  distance NUMERIC;
BEGIN
  -- Vérifier les valeurs nulles
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;

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

-- ========================================
-- CRÉER UN ALIAS calculate_distance_km
-- ========================================
-- Pour compatibilité avec d'autres parties du code

CREATE OR REPLACE FUNCTION calculate_distance_km(
  lat1 NUMERIC,
  lon1 NUMERIC,
  lat2 NUMERIC,
  lon2 NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
  RETURN calculate_distance(lat1, lon1, lat2, lon2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ========================================
-- ACCORDER LES PERMISSIONS
-- ========================================

GRANT EXECUTE ON FUNCTION calculate_distance TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_distance TO anon;
GRANT EXECUTE ON FUNCTION calculate_distance_km TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_distance_km TO anon;

-- ========================================
-- AJOUTER LES COMMENTAIRES
-- ========================================

COMMENT ON FUNCTION calculate_distance IS 'Calcule la distance en kilomètres entre deux points GPS en utilisant la formule de Haversine';
COMMENT ON FUNCTION calculate_distance_km IS 'Alias de calculate_distance pour compatibilité';

-- ========================================
-- TEST DE LA FONCTION
-- ========================================

DO $$
DECLARE
  test_distance NUMERIC;
BEGIN
  -- Test simple: Distance Paris (48.8566, 2.3522) -> Lyon (45.7640, 4.8357) ≈ 392 km
  test_distance := calculate_distance(48.8566, 2.3522, 45.7640, 4.8357);
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TEST DE LA FONCTION';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Distance Paris-Lyon: % km', CAST(test_distance AS INTEGER);
  RAISE NOTICE 'Attendu: ~392 km';
  
  IF test_distance BETWEEN 390 AND 395 THEN
    RAISE NOTICE '✅ Fonction calculate_distance fonctionne correctement';
  ELSE
    RAISE WARNING '⚠️ Distance calculée semble incorrecte';
  END IF;
  RAISE NOTICE '';
END $$;

-- ========================================
-- VÉRIFICATION FINALE
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 CORRECTION APPLIQUÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Fonction calculate_distance créée';
  RAISE NOTICE '✅ Fonction calculate_distance_km créée (alias)';
  RAISE NOTICE '✅ Permissions accordées';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Vous pouvez maintenant créer des missions';
  RAISE NOTICE '';
END $$;
