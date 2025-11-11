-- =====================================================
-- SUPPRESSION DE TOUTES LES FONCTIONS calculate_distance
-- =====================================================

-- Supprimer toutes les versions possibles de calculate_distance
DROP FUNCTION IF EXISTS calculate_distance(double precision, double precision, double precision, double precision) CASCADE;
DROP FUNCTION IF EXISTS calculate_distance(numeric, numeric, numeric, numeric) CASCADE;
DROP FUNCTION IF EXISTS calculate_distance(real, real, real, real) CASCADE;
DROP FUNCTION IF EXISTS calculate_distance(float, float, float, float) CASCADE;

-- =====================================================
-- RECRÉATION DE LA FONCTION CORRECTE
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
) RETURNS double precision AS $$
DECLARE
  R CONSTANT double precision := 6371; -- Rayon de la Terre en km
  dLat double precision;
  dLon double precision;
  a double precision;
  c double precision;
BEGIN
  -- Convertir les degrés en radians
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  
  -- Formule de Haversine
  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dLon/2) * sin(dLon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  -- Retourner la distance en km
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Vérification
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'calculate_distance';
