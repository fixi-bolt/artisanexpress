-- ============================================================
-- FIX: Supprimer les doublons de calculate_distance
-- ============================================================
-- À copier-coller dans l'éditeur SQL de Supabase

-- 1. Supprimer toutes les versions de la fonction
DROP FUNCTION IF EXISTS calculate_distance(double precision, double precision, double precision, double precision) CASCADE;

-- 2. Recréer une seule version propre
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 double precision, 
  lon1 double precision, 
  lat2 double precision, 
  lon2 double precision
)
RETURNS double precision
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R CONSTANT double precision := 6371;
  dLat double precision;
  dLon double precision;
  a double precision;
  c double precision;
BEGIN
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  
  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dLon/2) * sin(dLon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$;

-- 3. Vérifier qu'il n'y a qu'une seule version
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  COUNT(*) as count
FROM pg_proc
WHERE proname = 'calculate_distance'
GROUP BY proname, oid;
