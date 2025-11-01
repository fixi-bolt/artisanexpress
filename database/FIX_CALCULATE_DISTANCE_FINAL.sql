-- ========================================
-- FIX: Fonction calculate_distance manquante
-- ========================================
-- Cette fonction calcule la distance entre deux points GPS en kilomètres

-- Supprimer la fonction si elle existe déjà (pour éviter les conflits)
DROP FUNCTION IF EXISTS calculate_distance(NUMERIC, NUMERIC, NUMERIC, NUMERIC);

-- Créer la fonction calculate_distance
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 NUMERIC,
  lon1 NUMERIC,
  lat2 NUMERIC,
  lon2 NUMERIC
)
RETURNS NUMERIC AS $$
DECLARE
  earth_radius CONSTANT NUMERIC := 6371;
  d_lat NUMERIC;
  d_lon NUMERIC;
  a NUMERIC;
  c NUMERIC;
  distance NUMERIC;
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

-- Ajouter un commentaire
COMMENT ON FUNCTION calculate_distance IS 'Calcule la distance en kilomètres entre deux points GPS';

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION calculate_distance TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_distance TO anon;
