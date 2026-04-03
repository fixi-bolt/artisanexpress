-- ==========================================
-- FIX: Suppression des doublons de find_nearby_missions
-- ==========================================

-- 1. Supprimer TOUTES les versions de la fonction
DROP FUNCTION IF EXISTS find_nearby_missions CASCADE;
DROP FUNCTION IF EXISTS find_nearby_missions(double precision, double precision, double precision) CASCADE;
DROP FUNCTION IF EXISTS find_nearby_missions(uuid, double precision, double precision, double precision) CASCADE;

-- 2. Recréer UNE SEULE version correcte
CREATE OR REPLACE FUNCTION find_nearby_missions(
  p_lat double precision,
  p_lon double precision,
  p_radius_km double precision DEFAULT 50
)
RETURNS TABLE (
  mission_id uuid,
  title text,
  description text,
  category text,
  urgency text,
  budget numeric,
  status text,
  latitude double precision,
  longitude double precision,
  distance_km double precision,
  client_id uuid,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id AS mission_id,
    m.title,
    m.description,
    m.category,
    m.urgency,
    m.budget,
    m.status,
    m.latitude,
    m.longitude,
    calculate_distance(p_lat, p_lon, m.latitude, m.longitude) AS distance_km,
    m.client_id,
    m.created_at
  FROM missions m
  WHERE 
    m.status = 'pending'
    AND m.latitude IS NOT NULL
    AND m.longitude IS NOT NULL
    AND calculate_distance(p_lat, p_lon, m.latitude, m.longitude) <= p_radius_km
  ORDER BY distance_km ASC;
END;
$$;

-- 3. Vérifier que tout fonctionne
SELECT 
  'Fonction find_nearby_missions créée avec succès' AS status,
  count(*) AS nombre_de_versions
FROM pg_proc
WHERE proname = 'find_nearby_missions';
