-- ============================================
-- FIX: Suppression des fonctions dupliquées
-- ============================================
-- Ce script supprime toutes les versions de calculate_distance
-- et recrée une seule version propre
-- ============================================

-- ÉTAPE 1: Supprimer TOUTES les versions de calculate_distance
-- ============================================

-- Supprimer toutes les versions possibles (avec différentes signatures)
DROP FUNCTION IF EXISTS public.calculate_distance(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_distance_km(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_distance_km(DECIMAL, DECIMAL, DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_distance(DECIMAL, DECIMAL, DECIMAL, DECIMAL) CASCADE;

-- ============================================
-- ÉTAPE 2: Créer UNE SEULE version propre
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_distance_km(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE plpgsql
IMMUTABLE PARALLEL SAFE
AS $$
DECLARE
  r CONSTANT DOUBLE PRECISION := 6371; -- Rayon de la Terre en km
  dlat_rad DOUBLE PRECISION;
  dlon_rad DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  -- Vérifier valeurs nulles
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Formule de Haversine
  dlat_rad := RADIANS(lat2 - lat1);
  dlon_rad := RADIANS(lon2 - lon1);
  
  a := POWER(SIN(dlat_rad/2), 2) + 
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
       POWER(SIN(dlon_rad/2), 2);
       
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  
  RETURN r * c;
END;
$$;

-- ============================================
-- ÉTAPE 3: Donner les permissions
-- ============================================

GRANT EXECUTE ON FUNCTION public.calculate_distance_km TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_distance_km TO anon;

-- ============================================
-- ÉTAPE 4: Re-créer les fonctions dépendantes
-- ============================================

-- Fonction: find_nearby_missions (mise à jour pour utiliser calculate_distance_km)
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
) AS $$
DECLARE
  v_category TEXT;
  v_intervention_radius INTEGER;
BEGIN
  -- Récupérer catégorie et rayon de l'artisan
  SELECT a.category, a.intervention_radius
  INTO v_category, v_intervention_radius
  FROM artisans a
  WHERE a.id = p_artisan_id;

  -- Retourner missions à proximité
  RETURN QUERY
  SELECT 
    m.id AS mission_id,
    calculate_distance_km(
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
    AND calculate_distance_km(
      p_latitude, p_longitude,
      m.latitude, m.longitude
    ) <= v_intervention_radius
  ORDER BY distance_km ASC, m.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.find_nearby_missions TO authenticated;

-- ============================================
-- Fonction: get_nearby_artisans (mise à jour pour utiliser calculate_distance_km)
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

-- ============================================
-- Fonction: notify_nearby_artisans (mise à jour pour utiliser calculate_distance_km)
CREATE OR REPLACE FUNCTION public.notify_nearby_artisans()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  artisan_record RECORD;
  distance_km DOUBLE PRECISION;
  client_name TEXT;
  client_lat DOUBLE PRECISION;
  client_lon DOUBLE PRECISION;
  notified_count INTEGER := 0;
BEGIN
  -- Récupérer les infos du client qui a créé la mission
  SELECT u.name, u.latitude, u.longitude
  INTO client_name, client_lat, client_lon
  FROM public.users u
  WHERE u.id = NEW.client_id;

  -- Si le client n'a pas de position GPS, utiliser la position de la mission
  IF client_lat IS NULL OR client_lon IS NULL THEN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
      client_lat := NEW.latitude;
      client_lon := NEW.longitude;
    ELSE
      -- Position par défaut : Paris centre
      client_lat := 48.8566;
      client_lon := 2.3522;
    END IF;
  END IF;

  RAISE NOTICE 'Nouvelle mission créée: % à (%, %)', NEW.category, client_lat, client_lon;

  -- Parcourir tous les artisans actifs de la même catégorie
  FOR artisan_record IN
    SELECT 
      u.id, 
      u.name, 
      u.latitude, 
      u.longitude,
      a.intervention_radius,
      a.category
    FROM public.users u
    INNER JOIN public.artisans a ON a.id = u.id
    WHERE 
      u.user_type = 'artisan'
      AND a.is_available = true
      AND a.is_suspended = false
      AND (a.category = NEW.category OR NEW.category = 'Non spécifié')
      AND u.latitude IS NOT NULL 
      AND u.longitude IS NOT NULL
  LOOP
    -- Calculer la distance entre le client et l'artisan
    distance_km := public.calculate_distance_km(
      client_lat,
      client_lon,
      artisan_record.latitude,
      artisan_record.longitude
    );

    RAISE NOTICE 'Artisan % à % km', artisan_record.name, distance_km;

    -- Si l'artisan est dans le rayon d'intervention
    IF distance_km <= COALESCE(artisan_record.intervention_radius, 10) THEN
      -- Insérer une notification
      INSERT INTO public.notifications (
        user_id, 
        title, 
        message, 
        type,
        mission_id,
        metadata
      )
      VALUES (
        artisan_record.id,
        '🔔 Nouvelle mission disponible',
        format(
          'Mission "%s" à %.1f km de vous. Client: %s',
          NEW.category,
          distance_km,
          COALESCE(client_name, 'Client')
        ),
        'mission',
        NEW.id,
        jsonb_build_object(
          'distance_km', distance_km,
          'category', NEW.category,
          'mission_id', NEW.id,
          'client_name', client_name
        )
      );

      notified_count := notified_count + 1;
      RAISE NOTICE 'Notification envoyée à artisan %', artisan_record.name;
    END IF;
  END LOOP;

  RAISE NOTICE 'Total artisans notifiés: %', notified_count;

  RETURN NEW;
END;
$$;

-- Re-créer le trigger
DROP TRIGGER IF EXISTS on_mission_created_notify_artisans ON public.missions;
CREATE TRIGGER on_mission_created_notify_artisans
AFTER INSERT ON public.missions
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION public.notify_nearby_artisans();

-- ============================================
-- VÉRIFICATIONS FINALES
-- ============================================

DO $$
DECLARE
  func_count INTEGER;
BEGIN
  -- Compter les versions de la fonction
  SELECT COUNT(*) INTO func_count
  FROM pg_proc 
  WHERE proname = 'calculate_distance_km'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CORRECTION TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Nombre de fonctions calculate_distance_km: %', func_count;
  RAISE NOTICE '';
  
  IF func_count = 1 THEN
    RAISE NOTICE '✅ Parfait ! Une seule version de la fonction existe.';
  ELSE
    RAISE NOTICE '⚠️  Attention: % versions trouvées (attendu: 1)', func_count;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '📍 Fonctions mises à jour:';
  RAISE NOTICE '  • calculate_distance_km()';
  RAISE NOTICE '  • find_nearby_missions()';
  RAISE NOTICE '  • get_nearby_artisans()';
  RAISE NOTICE '  • notify_nearby_artisans()';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END$$;
