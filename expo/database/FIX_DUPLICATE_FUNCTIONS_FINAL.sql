-- ========================================
-- 🔧 FIX FONCTIONS DUPLIQUÉES - SCRIPT DE NETTOYAGE
-- ========================================
-- Objectif: Supprimer toutes les versions des fonctions dupliquées
-- Puis recréer les versions correctes
-- Date: 2025-10-31
-- ========================================

-- ÉTAPE 1: Supprimer TOUTES les versions de calculate_distance
-- ========================================
DROP FUNCTION IF EXISTS public.calculate_distance(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_distance(DECIMAL, DECIMAL, DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_distance_km(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_distance_km(DECIMAL, DECIMAL, DECIMAL, DECIMAL) CASCADE;

-- ÉTAPE 2: Supprimer TOUTES les versions de find_nearby_missions
-- ========================================
DROP FUNCTION IF EXISTS public.find_nearby_missions(UUID, DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;
DROP FUNCTION IF EXISTS public.find_nearby_missions(UUID, DECIMAL, DECIMAL) CASCADE;

-- ÉTAPE 3: Supprimer TOUTES les versions de get_nearby_artisans
-- ========================================
DROP FUNCTION IF EXISTS public.get_nearby_artisans(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_nearby_artisans(DECIMAL, DECIMAL, DECIMAL, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_nearby_artisans(DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;
DROP FUNCTION IF EXISTS public.get_nearby_artisans(DECIMAL, DECIMAL) CASCADE;

-- ÉTAPE 4: Recréer la fonction calculate_distance_km (version unique)
-- ========================================
CREATE OR REPLACE FUNCTION public.calculate_distance_km(
  lat1 DECIMAL, 
  lon1 DECIMAL, 
  lat2 DECIMAL, 
  lon2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  r CONSTANT DECIMAL := 6371;
  dlat_rad DECIMAL;
  dlon_rad DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  dlat_rad := RADIANS(lat2 - lat1);
  dlon_rad := RADIANS(lon2 - lon1);
  a := POWER(SIN(dlat_rad/2), 2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * POWER(SIN(dlon_rad/2), 2);
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE;

COMMENT ON FUNCTION public.calculate_distance_km IS 'Calcule la distance en km entre deux points GPS (formule Haversine)';

-- ÉTAPE 5: Recréer la fonction find_nearby_missions (version unique)
-- ========================================
CREATE OR REPLACE FUNCTION public.find_nearby_missions(
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
  SELECT a.category, a.intervention_radius
  INTO v_category, v_intervention_radius
  FROM artisans a
  WHERE a.id = p_artisan_id;

  RETURN QUERY
  SELECT 
    m.id AS mission_id,
    public.calculate_distance_km(
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
    AND public.calculate_distance_km(
      p_latitude, p_longitude,
      m.latitude, m.longitude
    ) <= v_intervention_radius
  ORDER BY distance_km ASC, m.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.find_nearby_missions TO authenticated;
COMMENT ON FUNCTION public.find_nearby_missions IS 'Trouve les missions à proximité d''un artisan';

-- ÉTAPE 6: Recréer la fonction get_nearby_artisans (version unique)
-- ========================================
CREATE OR REPLACE FUNCTION public.get_nearby_artisans(
  client_latitude DECIMAL(10,8),
  client_longitude DECIMAL(11,8),
  radius_km DECIMAL DEFAULT 10,
  artisan_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  category TEXT,
  distance_km DECIMAL,
  hourly_rate NUMERIC,
  rating NUMERIC,
  is_available BOOLEAN,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8)
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
    public.calculate_distance_km(client_latitude, client_longitude, u.latitude, u.longitude) AS distance_km,
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
    AND public.calculate_distance_km(client_latitude, client_longitude, u.latitude, u.longitude) <= radius_km
    AND (artisan_category IS NULL OR a.category = artisan_category)
  ORDER BY distance_km ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_nearby_artisans TO authenticated;
COMMENT ON FUNCTION public.get_nearby_artisans IS 'Trouve les artisans à proximité d''un client';

-- ÉTAPE 7: Recréer la fonction notify_nearby_artisans
-- ========================================
CREATE OR REPLACE FUNCTION public.notify_nearby_artisans()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
  v_notified_count INTEGER := 0;
  v_mission_lat DECIMAL(10,8);
  v_mission_lon DECIMAL(11,8);
BEGIN
  v_mission_lat := NEW.latitude;
  v_mission_lon := NEW.longitude;

  RAISE NOTICE '🔔 [NOTIFICATIONS] Nouvelle mission créée: % (catégorie: %, lat: %, lon: %)',
    NEW.id, NEW.category, v_mission_lat, v_mission_lon;

  FOR r IN
    SELECT 
      a.id AS artisan_id,
      u.name AS artisan_name,
      a.latitude AS artisan_lat,
      a.longitude AS artisan_lon,
      a.intervention_radius,
      public.calculate_distance_km(
        v_mission_lat, v_mission_lon,
        a.latitude, a.longitude
      ) AS distance
    FROM public.artisans a
    INNER JOIN public.users u ON u.id = a.id
    WHERE 
      a.category = NEW.category
      AND a.is_available = true
      AND a.is_suspended = false
      AND COALESCE(a.is_verified, true) = true
      AND a.latitude IS NOT NULL
      AND a.longitude IS NOT NULL
      AND public.calculate_distance_km(
        v_mission_lat, v_mission_lon,
        a.latitude, a.longitude
      ) <= COALESCE(a.intervention_radius, 20)
    ORDER BY distance ASC
    LIMIT 20
  LOOP
    BEGIN
      INSERT INTO public.notifications (
        user_id, 
        type,
        title, 
        message, 
        mission_id,
        read,
        created_at
      )
      VALUES (
        r.artisan_id,
        'mission_request',
        '🔔 Nouvelle mission disponible',
        format('Mission "%s" à %.1f km de vous', NEW.title, r.distance),
        NEW.id,
        false,
        NOW()
      );
      
      v_notified_count := v_notified_count + 1;
      
      RAISE NOTICE '✅ [NOTIFICATIONS] Notification envoyée à artisan % (distance: %.1f km)', 
        r.artisan_name, r.distance;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '❌ [NOTIFICATIONS] Erreur lors de la notification pour artisan %: %', 
        r.artisan_name, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '📊 [NOTIFICATIONS] Total artisans notifiés: %', v_notified_count;
  
  IF v_notified_count = 0 THEN
    RAISE WARNING '⚠️ [NOTIFICATIONS] Aucun artisan notifié pour mission % (catégorie: %)', 
      NEW.id, NEW.category;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ [NOTIFICATIONS] Erreur globale lors de la notification des artisans: %', SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_nearby_artisans IS 'Notifie automatiquement les artisans à proximité lors de la création d''une mission';

-- ÉTAPE 8: Recréer le trigger
-- ========================================
DROP TRIGGER IF EXISTS on_new_mission_notify ON public.missions;

CREATE TRIGGER on_new_mission_notify
AFTER INSERT ON public.missions
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION public.notify_nearby_artisans();

COMMENT ON TRIGGER on_new_mission_notify ON public.missions IS 'Déclenche la notification des artisans lors de la création d''une mission en statut pending';

-- ========================================
-- ✅ VÉRIFICATIONS FINALES
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ NETTOYAGE ET RECRÉATION TERMINÉS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📦 Fonctions créées:';
  RAISE NOTICE '  • calculate_distance_km(lat1, lon1, lat2, lon2)';
  RAISE NOTICE '  • find_nearby_missions(artisan_id, lat, lon)';
  RAISE NOTICE '  • get_nearby_artisans(lat, lon, radius, category)';
  RAISE NOTICE '  • notify_nearby_artisans() [trigger function]';
  RAISE NOTICE '';
  RAISE NOTICE '🔔 Trigger activé:';
  RAISE NOTICE '  • on_new_mission_notify sur table missions';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END$$;

-- ========================================
-- FIN DU SCRIPT
-- ========================================
