-- ============================================================================
-- FIX COMPLET : Erreur "function round(double precision, integer) does not exist"
-- ============================================================================
-- Ce script corrige l'erreur de fonction round en :
-- 1. Supprimant les fonctions calculate_distance en double
-- 2. Créant une seule fonction calculate_distance qui retourne NUMERIC
-- 3. Recréant les fonctions dépendantes avec le bon type
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Supprimer les anciennes fonctions calculate_distance
-- ============================================================================

DROP FUNCTION IF EXISTS calculate_distance(double precision, double precision, double precision, double precision);
DROP FUNCTION IF EXISTS calculate_distance_km(decimal, decimal, decimal, decimal);

-- ============================================================================
-- ÉTAPE 2 : Créer LA fonction calculate_distance correcte (retourne NUMERIC)
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 NUMERIC, 
  lon1 NUMERIC, 
  lat2 NUMERIC, 
  lon2 NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  r CONSTANT NUMERIC := 6371; -- Rayon de la Terre en km
  dlat_rad NUMERIC;
  dlon_rad NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  -- Vérifier les NULL
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Convertir en radians
  dlat_rad := RADIANS(lat2 - lat1);
  dlon_rad := RADIANS(lon2 - lon1);
  
  -- Formule de Haversine
  a := POWER(SIN(dlat_rad/2), 2) + 
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
       POWER(SIN(dlon_rad/2), 2);
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  
  -- Retourner distance arrondie à 2 décimales
  RETURN ROUND(r * c, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE;

-- ============================================================================
-- ÉTAPE 3 : Recréer find_nearby_missions
-- ============================================================================

CREATE OR REPLACE FUNCTION find_nearby_missions(
  p_artisan_id UUID,
  p_latitude NUMERIC,
  p_longitude NUMERIC
)
RETURNS TABLE(
  mission_id UUID,
  distance_km NUMERIC,
  title TEXT,
  category TEXT,
  status TEXT,
  estimated_price NUMERIC,
  description TEXT,
  address TEXT,
  client_id UUID,
  client_name TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  photos TEXT[],
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_category TEXT;
  v_intervention_radius INTEGER;
BEGIN
  -- Récupérer catégorie et rayon de l'artisan
  SELECT a.category, COALESCE(a.intervention_radius, 50)
  INTO v_category, v_intervention_radius
  FROM artisans a
  WHERE a.id = p_artisan_id;

  -- Retourner missions à proximité
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
    u.name AS client_name,
    m.latitude,
    m.longitude,
    m.photos,
    m.created_at
  FROM missions m
  JOIN clients c ON c.id = m.client_id
  JOIN users u ON u.id = c.id
  WHERE m.status = 'pending'
    AND m.category = v_category
    AND m.artisan_id IS NULL
    AND m.latitude IS NOT NULL
    AND m.longitude IS NOT NULL
    AND calculate_distance(
      p_latitude, p_longitude,
      m.latitude, m.longitude
    ) <= v_intervention_radius
  ORDER BY distance_km ASC, m.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ÉTAPE 4 : Recréer update_artisan_location
-- ============================================================================

CREATE OR REPLACE FUNCTION update_artisan_location(
  p_artisan_id UUID,
  p_latitude NUMERIC,
  p_longitude NUMERIC
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE artisans
  SET 
    latitude = p_latitude,
    longitude = p_longitude,
    updated_at = NOW()
  WHERE id = p_artisan_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ÉTAPE 5 : Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION calculate_distance TO authenticated;
GRANT EXECUTE ON FUNCTION find_nearby_missions TO authenticated;
GRANT EXECUTE ON FUNCTION update_artisan_location TO authenticated;

-- ============================================================================
-- ÉTAPE 6 : Vérification
-- ============================================================================

DO $$
DECLARE
  func_count INTEGER;
BEGIN
  -- Compter combien de calculate_distance existent
  SELECT COUNT(*) INTO func_count
  FROM pg_proc 
  WHERE proname = 'calculate_distance';
  
  IF func_count = 1 THEN
    RAISE NOTICE '✅ Une seule fonction calculate_distance existe (CORRECT)';
  ELSE
    RAISE WARNING '⚠️  % fonctions calculate_distance trouvées (devrait être 1)', func_count;
  END IF;
  
  -- Vérifier le type de retour
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'calculate_distance' 
    AND prorettype = 'numeric'::regtype
  ) THEN
    RAISE NOTICE '✅ calculate_distance retourne NUMERIC (CORRECT)';
  ELSE
    RAISE WARNING '⚠️  calculate_distance ne retourne pas NUMERIC';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅✅✅ CORRECTION TERMINÉE !';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Vous pouvez maintenant créer une mission sans erreur.';
  RAISE NOTICE 'Testez depuis l''app mobile : Demande d''intervention';
END $$;
