-- ========================================
-- 🔧 FIX: Ajouter la fonction calculate_distance manquante
-- ========================================
-- Cette fonction calcule la distance entre deux points GPS en kilomètres
-- Utilise la formule de Haversine pour calculer la distance sur une sphère

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

-- Ajouter un commentaire pour la documentation
COMMENT ON FUNCTION calculate_distance IS 'Calcule la distance en kilomètres entre deux points GPS en utilisant la formule de Haversine';

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION calculate_distance TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_distance TO anon;

-- ========================================
-- ✅ TEST: Vérifier que la fonction fonctionne
-- ========================================
-- Test simple: Distance Paris (48.8566, 2.3522) -> Lyon (45.7640, 4.8357) ≈ 392 km
DO $$
DECLARE
  test_distance NUMERIC;
BEGIN
  test_distance := calculate_distance(48.8566, 2.3522, 45.7640, 4.8357);
  RAISE NOTICE 'Distance test Paris-Lyon: % km (attendu: ~392 km)', ROUND(test_distance, 0);
  
  IF test_distance BETWEEN 390 AND 395 THEN
    RAISE NOTICE '✅ Fonction calculate_distance fonctionne correctement';
  ELSE
    RAISE WARNING '⚠️ Distance calculée semble incorrecte';
  END IF;
END $$;
