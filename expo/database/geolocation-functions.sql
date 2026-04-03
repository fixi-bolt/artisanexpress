-- ========================================
-- 🌍 GEOLOCATION FUNCTIONS FOR ARTISAN CONNECT
-- ========================================

-- Function: find_nearby_missions
-- Description: Find missions near artisan's current location within their intervention radius
-- Returns missions that match artisan's category and are within range

CREATE OR REPLACE FUNCTION find_nearby_missions(
  p_artisan_id UUID,
  p_latitude DECIMAL(10,8),
  p_longitude DECIMAL(11,8)
)
RETURNS TABLE(
  mission_id UUID,
  distance_km DECIMAL,
  title TEXT,
  category TEXT,
  status TEXT,
  estimated_price DECIMAL(10,2),
  description TEXT,
  address TEXT,
  client_id UUID,
  client_name TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  photos TEXT[],
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_category TEXT;
  v_intervention_radius INTEGER;
BEGIN
  -- Get artisan's category and intervention radius
  SELECT a.category, a.intervention_radius
  INTO v_category, v_intervention_radius
  FROM artisans a
  WHERE a.id = p_artisan_id;

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
    AND calculate_distance(
      p_latitude, p_longitude,
      m.latitude, m.longitude
    ) <= v_intervention_radius
  ORDER BY distance_km ASC, m.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION find_nearby_missions TO authenticated;

-- Function: update_artisan_location
-- Description: Update artisan's current location and last updated timestamp
-- This is called periodically from the frontend

CREATE OR REPLACE FUNCTION update_artisan_location(
  p_artisan_id UUID,
  p_latitude DECIMAL(10,8),
  p_longitude DECIMAL(11,8)
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_artisan_location TO authenticated;

COMMENT ON FUNCTION find_nearby_missions IS 'Find pending missions near artisan location within their intervention radius';
COMMENT ON FUNCTION update_artisan_location IS 'Update artisan GPS coordinates';
