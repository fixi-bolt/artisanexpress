-- ========================================
-- 🌍 SCRIPT DE GÉOLOCALISATION COMPLET POUR SUPABASE
-- À COPIER-COLLER DANS LE SQL EDITOR
-- ========================================

-- 1️⃣ ACTIVER LES EXTENSIONS NÉCESSAIRES
CREATE EXTENSION IF NOT EXISTS "earthdistance" CASCADE;
CREATE EXTENSION IF NOT EXISTS "cube";

-- 2️⃣ VÉRIFIER QUE LES COLONNES EXISTENT
-- (Si elles existent déjà, ces commandes ne feront rien)
DO $$ 
BEGIN
  -- Ajouter latitude/longitude aux artisans si manquant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artisans' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE artisans ADD COLUMN latitude DECIMAL(10, 8);
    ALTER TABLE artisans ADD COLUMN longitude DECIMAL(11, 8);
    ALTER TABLE artisans ADD CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90);
    ALTER TABLE artisans ADD CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180);
  END IF;

  -- Ajouter latitude/longitude aux missions si manquant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'missions' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE missions ADD COLUMN latitude DECIMAL(10, 8) NOT NULL DEFAULT 0;
    ALTER TABLE missions ADD COLUMN longitude DECIMAL(11, 8) NOT NULL DEFAULT 0;
    ALTER TABLE missions ADD CONSTRAINT valid_mission_latitude CHECK (latitude >= -90 AND latitude <= 90);
    ALTER TABLE missions ADD CONSTRAINT valid_mission_longitude CHECK (longitude >= -180 AND longitude <= 180);
  END IF;
END $$;

-- 3️⃣ CRÉER LES INDEX GÉOSPATIAUX POUR PERFORMANCES
DROP INDEX IF EXISTS idx_artisans_location;
DROP INDEX IF EXISTS idx_missions_location;

CREATE INDEX idx_artisans_location ON artisans 
  USING gist (ll_to_earth(latitude, longitude))
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX idx_missions_location ON missions 
  USING gist (ll_to_earth(latitude, longitude))
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 4️⃣ FONCTION CALCUL DE DISTANCE (Haversine via earthdistance)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, 
  lon1 DECIMAL, 
  lat2 DECIMAL, 
  lon2 DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  -- Retourne distance en kilomètres
  RETURN earth_distance(
    ll_to_earth(lat1, lon1),
    ll_to_earth(lat2, lon2)
  ) / 1000;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_distance IS 'Calcule la distance en km entre deux coordonnées GPS';

-- 5️⃣ FONCTION MISE À JOUR LOCALISATION ARTISAN
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

GRANT EXECUTE ON FUNCTION update_artisan_location TO authenticated;

COMMENT ON FUNCTION update_artisan_location IS 'Met à jour la position GPS en temps réel de l artisan';

-- 6️⃣ FONCTION MISSIONS À PROXIMITÉ
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
  -- Récupérer la catégorie et le rayon d'intervention de l'artisan
  SELECT a.category, a.intervention_radius
  INTO v_category, v_intervention_radius
  FROM artisans a
  WHERE a.id = p_artisan_id;

  -- Si artisan non trouvé, retourner vide
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Retourner les missions à proximité
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

GRANT EXECUTE ON FUNCTION find_nearby_missions TO authenticated;

COMMENT ON FUNCTION find_nearby_missions IS 'Trouve les missions à proximité selon catégorie et rayon d intervention';

-- 7️⃣ FONCTION ARTISANS À PROXIMITÉ (POUR CLIENTS)
CREATE OR REPLACE FUNCTION find_nearby_artisans(
  p_latitude DECIMAL(10,8),
  p_longitude DECIMAL(11,8),
  p_category TEXT DEFAULT NULL,
  p_max_distance INTEGER DEFAULT 50
)
RETURNS TABLE(
  artisan_id UUID,
  name TEXT,
  category TEXT,
  hourly_rate DECIMAL(10,2),
  travel_fee DECIMAL(10,2),
  distance_km DECIMAL,
  rating DECIMAL(3,2),
  review_count INTEGER,
  photo TEXT,
  specialties TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id AS artisan_id,
    u.name,
    a.category,
    a.hourly_rate,
    a.travel_fee,
    calculate_distance(p_latitude, p_longitude, a.latitude, a.longitude) AS distance_km,
    u.rating,
    u.review_count,
    u.photo,
    a.specialties
  FROM artisans a
  JOIN users u ON a.id = u.id
  WHERE a.is_available = true
    AND a.is_suspended = false
    AND a.latitude IS NOT NULL
    AND a.longitude IS NOT NULL
    AND (p_category IS NULL OR a.category = p_category)
    AND calculate_distance(p_latitude, p_longitude, a.latitude, a.longitude) <= p_max_distance
  ORDER BY distance_km ASC, u.rating DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION find_nearby_artisans TO authenticated;

COMMENT ON FUNCTION find_nearby_artisans IS 'Trouve les artisans disponibles à proximité pour les clients';

-- 8️⃣ FONCTION NOTIFIER ARTISANS À PROXIMITÉ D'UNE NOUVELLE MISSION
CREATE OR REPLACE FUNCTION notify_nearby_artisans_on_mission_create()
RETURNS TRIGGER AS $$
DECLARE
  v_artisan RECORD;
  v_distance DECIMAL;
BEGIN
  -- Seulement pour les nouvelles missions en statut 'pending'
  IF NEW.status = 'pending' AND NEW.artisan_id IS NULL THEN
    
    -- Trouver tous les artisans disponibles dans la catégorie
    FOR v_artisan IN
      SELECT 
        a.id,
        u.name,
        calculate_distance(
          NEW.latitude, NEW.longitude,
          a.latitude, a.longitude
        ) AS distance_km
      FROM artisans a
      JOIN users u ON a.id = u.id
      WHERE a.category = NEW.category
        AND a.is_available = true
        AND a.is_suspended = false
        AND a.latitude IS NOT NULL
        AND a.longitude IS NOT NULL
        AND calculate_distance(
          NEW.latitude, NEW.longitude,
          a.latitude, a.longitude
        ) <= a.intervention_radius
      LIMIT 20
    LOOP
      -- Créer une notification pour chaque artisan
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        mission_id,
        read,
        created_at
      ) VALUES (
        v_artisan.id,
        'mission_request',
        'Nouvelle mission à proximité',
        'Mission "' || NEW.title || '" à ' || ROUND(v_artisan.distance_km, 1) || ' km de vous',
        NEW.id,
        false,
        NOW()
      );
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS notify_artisans_on_mission_create ON missions;

CREATE TRIGGER notify_artisans_on_mission_create
  AFTER INSERT ON missions
  FOR EACH ROW
  EXECUTE FUNCTION notify_nearby_artisans_on_mission_create();

COMMENT ON FUNCTION notify_nearby_artisans_on_mission_create IS 'Notifie automatiquement les artisans proches lors de la création d une mission';

-- 9️⃣ FONCTION POUR TESTER LA GÉOLOCALISATION
CREATE OR REPLACE FUNCTION test_geolocation()
RETURNS TABLE(
  test_name TEXT,
  result TEXT,
  details TEXT
) AS $$
BEGIN
  -- Test 1: Extensions installées
  RETURN QUERY
  SELECT 
    'Extensions'::TEXT,
    CASE 
      WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'earthdistance') 
      THEN '✅ OK'::TEXT 
      ELSE '❌ ERREUR'::TEXT 
    END,
    'earthdistance extension'::TEXT;

  -- Test 2: Colonnes présentes
  RETURN QUERY
  SELECT 
    'Colonnes artisans'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'artisans' AND column_name = 'latitude'
      ) 
      THEN '✅ OK'::TEXT 
      ELSE '❌ MANQUANT'::TEXT 
    END,
    'latitude/longitude dans artisans'::TEXT;

  -- Test 3: Fonctions créées
  RETURN QUERY
  SELECT 
    'Fonctions'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'calculate_distance'
      ) 
      THEN '✅ OK'::TEXT 
      ELSE '❌ ERREUR'::TEXT 
    END,
    'Fonctions de géolocalisation'::TEXT;

  -- Test 4: Index géospatiaux
  RETURN QUERY
  SELECT 
    'Index'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_artisans_location'
      ) 
      THEN '✅ OK'::TEXT 
      ELSE '⚠️ MANQUANT'::TEXT 
    END,
    'Index géospatiaux'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- ✅ SCRIPT TERMINÉ - LANCER LE TEST
-- ========================================

-- Exécuter le test de configuration
SELECT * FROM test_geolocation();

-- Message de confirmation
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Configuration de géolocalisation terminée avec succès !';
  RAISE NOTICE '📍 Fonctions disponibles:';
  RAISE NOTICE '   - calculate_distance(lat1, lon1, lat2, lon2)';
  RAISE NOTICE '   - update_artisan_location(artisan_id, lat, lon)';
  RAISE NOTICE '   - find_nearby_missions(artisan_id, lat, lon)';
  RAISE NOTICE '   - find_nearby_artisans(lat, lon, category, max_distance)';
  RAISE NOTICE '🔔 Notifications automatiques activées pour nouvelles missions';
END $$;
