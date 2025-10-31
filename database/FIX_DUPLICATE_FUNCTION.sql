-- ============================================
-- FIX: Supprimer les fonctions en double
-- ============================================
-- À coller dans l'éditeur SQL de Supabase
-- ============================================

-- ÉTAPE 1 : Supprimer toutes les versions de calculate_distance
-- ============================================
DROP FUNCTION IF EXISTS public.calculate_distance_km(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_distance(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_distance(DECIMAL, DECIMAL, DECIMAL, DECIMAL) CASCADE;

-- ÉTAPE 2 : Supprimer toutes les versions de find_nearby_missions
-- ============================================
DROP FUNCTION IF EXISTS public.find_nearby_missions(UUID, DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS public.find_nearby_missions(UUID, DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;

-- ÉTAPE 3 : Supprimer toutes les versions de update_artisan_location
-- ============================================
DROP FUNCTION IF EXISTS public.update_artisan_location(UUID, DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS public.update_artisan_location(UUID, DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;

-- ÉTAPE 4 : Supprimer toutes les versions de get_nearby_artisans
-- ============================================
DROP FUNCTION IF EXISTS public.get_nearby_artisans(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT) CASCADE;

-- ============================================
-- ÉTAPE 5 : Recréer la fonction calculate_distance (une seule version)
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Formule de Haversine pour calculer la distance en km
  RETURN 6371 * acos(
    cos(radians(lat1)) *
    cos(radians(lat2)) *
    cos(radians(lon2) - radians(lon1)) +
    sin(radians(lat1)) *
    sin(radians(lat2))
  );
END;
$$;

-- ============================================
-- ÉTAPE 6 : Recréer find_nearby_missions (une seule version)
-- ============================================
CREATE OR REPLACE FUNCTION public.find_nearby_missions(
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
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_category TEXT;
  v_intervention_radius DOUBLE PRECISION;
BEGIN
  -- Get artisan's category and intervention radius
  SELECT a.category, a.intervention_radius
  INTO v_category, v_intervention_radius
  FROM public.artisans a
  WHERE a.id = p_artisan_id;

  -- Return nearby missions
  RETURN QUERY
  SELECT 
    m.id AS mission_id,
    public.calculate_distance(
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
  FROM public.missions m
  JOIN public.users u ON u.id = m.client_id
  WHERE m.status = 'pending'
    AND m.category = v_category
    AND m.artisan_id IS NULL
    AND public.calculate_distance(
      p_latitude, p_longitude,
      m.latitude, m.longitude
    ) <= COALESCE(v_intervention_radius, 10)
  ORDER BY distance_km ASC, m.created_at DESC
  LIMIT 50;
END;
$$;

-- ============================================
-- ÉTAPE 7 : Recréer update_artisan_location (une seule version)
-- ============================================
CREATE OR REPLACE FUNCTION public.update_artisan_location(
  p_artisan_id UUID,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION
)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.artisans
  SET 
    latitude = p_latitude,
    longitude = p_longitude,
    updated_at = NOW()
  WHERE id = p_artisan_id;

  RETURN FOUND;
END;
$$;

-- ============================================
-- ÉTAPE 8 : Recréer get_nearby_artisans (une seule version)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_nearby_artisans(
  client_latitude DOUBLE PRECISION,
  client_longitude DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 10,
  artisan_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  distance_km DOUBLE PRECISION,
  hourly_rate NUMERIC,
  rating NUMERIC,
  is_available BOOLEAN,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    a.category,
    public.calculate_distance(client_latitude, client_longitude, u.latitude, u.longitude) AS distance_km,
    a.hourly_rate,
    u.rating,
    a.is_available,
    u.latitude,
    u.longitude
  FROM public.users u
  INNER JOIN public.artisans a ON a.id = u.id
  WHERE 
    u.user_type = 'artisan'
    AND a.is_suspended = false
    AND u.latitude IS NOT NULL 
    AND u.longitude IS NOT NULL
    AND public.calculate_distance(client_latitude, client_longitude, u.latitude, u.longitude) <= radius_km
    AND (artisan_category IS NULL OR a.category = artisan_category)
  ORDER BY distance_km ASC;
END;
$$;

-- ============================================
-- ÉTAPE 9 : Ajouter les permissions d'exécution
-- ============================================
GRANT EXECUTE ON FUNCTION public.calculate_distance TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_nearby_missions TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_artisan_location TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_nearby_artisans TO authenticated;

-- ============================================
-- VÉRIFICATION FINALE
-- ============================================
-- Vérifier que les fonctions existent et sont uniques
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'calculate_distance',
    'find_nearby_missions', 
    'update_artisan_location',
    'get_nearby_artisans'
  )
ORDER BY routine_name;

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- ✅ Toutes les versions en double ont été supprimées
-- ✅ Chaque fonction n'existe plus qu'en une seule version
-- ✅ Utilisation de DOUBLE PRECISION pour la cohérence
-- ✅ Permissions ajoutées pour les utilisateurs authentifiés
-- ============================================
