-- ========================================
-- SCRIPT FINAL CORRIGÉ - ARTISANNOW
-- ========================================
-- Ce script corrige les erreurs de colonnes manquantes
-- et configure correctement les notifications géolocalisées

-- ========================================
-- ÉTAPE 1: Corriger la table notifications
-- ========================================

-- 1.1 Désactiver temporairement RLS
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;

-- 1.2 Ajouter la colonne is_read si elle n'existe pas
DO $$
BEGIN
  -- Vérifier si la colonne "read" existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'read'
  ) THEN
    -- Renommer "read" en "is_read"
    ALTER TABLE public.notifications RENAME COLUMN "read" TO is_read;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'is_read'
  ) THEN
    -- Créer la colonne is_read
    ALTER TABLE public.notifications ADD COLUMN is_read BOOLEAN DEFAULT false NOT NULL;
  END IF;
  
  -- Ajouter les colonnes manquantes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN type VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'mission_id'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.3 Mettre à jour les index
DROP INDEX IF EXISTS public.idx_notifications_user_unread;
DROP INDEX IF EXISTS public.idx_notifications_user;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications(user_id, created_at DESC) 
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_user 
  ON public.notifications(user_id, is_read, created_at DESC);

-- 1.4 Réactiver RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ========================================
-- ÉTAPE 2: Ajouter les colonnes de géolocalisation aux users
-- ========================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'latitude'
  ) THEN
    ALTER TABLE public.users ADD COLUMN latitude DOUBLE PRECISION;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'longitude'
  ) THEN
    ALTER TABLE public.users ADD COLUMN longitude DOUBLE PRECISION;
  END IF;
END $$;

-- Ajouter un index géospatial pour les performances
CREATE INDEX IF NOT EXISTS idx_users_location 
  ON public.users(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ========================================
-- ÉTAPE 3: Ajouter les colonnes de géolocalisation aux missions
-- ========================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'missions' 
    AND column_name = 'latitude'
  ) THEN
    ALTER TABLE public.missions ADD COLUMN latitude DOUBLE PRECISION;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'missions' 
    AND column_name = 'longitude'
  ) THEN
    ALTER TABLE public.missions ADD COLUMN longitude DOUBLE PRECISION;
  END IF;
END $$;

-- Ajouter un index géospatial pour les performances
CREATE INDEX IF NOT EXISTS idx_missions_location 
  ON public.missions(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ========================================
-- ÉTAPE 4: Ajouter les colonnes nécessaires aux artisans
-- ========================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artisans' 
    AND column_name = 'latitude'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN latitude DOUBLE PRECISION;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artisans' 
    AND column_name = 'longitude'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN longitude DOUBLE PRECISION;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artisans' 
    AND column_name = 'intervention_radius'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN intervention_radius INTEGER DEFAULT 10;
  END IF;
END $$;

-- Ajouter un index géospatial pour les performances
CREATE INDEX IF NOT EXISTS idx_artisans_location 
  ON public.artisans(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ========================================
-- ÉTAPE 5: Fonction de calcul de distance
-- ========================================

CREATE OR REPLACE FUNCTION public.calculate_distance_km(
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
    LEAST(1.0, GREATEST(-1.0,
      cos(radians(lat1)) *
      cos(radians(lat2)) *
      cos(radians(lon2) - radians(lon1)) +
      sin(radians(lat1)) *
      sin(radians(lat2))
    ))
  );
END;
$$;

-- ========================================
-- ÉTAPE 6: Fonction de notification des artisans
-- ========================================

CREATE OR REPLACE FUNCTION public.notify_nearby_artisans()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
  v_notified_count INTEGER := 0;
BEGIN
  -- Vérifier que la mission a des coordonnées
  IF NEW.latitude IS NULL OR NEW.longitude IS NULL THEN
    RETURN NEW;
  END IF;

  -- Sélectionner les artisans dans leur rayon d'intervention
  FOR r IN
    SELECT 
      a.id, 
      u.name, 
      a.latitude, 
      a.longitude,
      a.intervention_radius,
      public.calculate_distance_km(
        NEW.latitude, NEW.longitude,
        a.latitude, a.longitude
      ) as distance
    FROM public.artisans a
    JOIN public.users u ON u.id = a.id
    WHERE a.category = NEW.category
      AND a.is_available = true
      AND a.is_suspended = false
      AND a.is_verified = true
      AND a.latitude IS NOT NULL
      AND a.longitude IS NOT NULL
      AND public.calculate_distance_km(
        NEW.latitude, NEW.longitude,
        a.latitude, a.longitude
      ) <= COALESCE(a.intervention_radius, 10)
    ORDER BY distance ASC
    LIMIT 20
  LOOP
    -- Envoyer une notification
    INSERT INTO public.notifications (
      user_id, 
      type,
      title, 
      message, 
      mission_id,
      is_read,
      created_at
    )
    VALUES (
      r.id,
      'mission_request',
      'Nouvelle mission disponible',
      'Une nouvelle mission "' || COALESCE(NEW.category, 'service') || 
      '" est disponible à ' || ROUND(r.distance::numeric, 1)::text || ' km de vous.',
      NEW.id,
      false,
      NOW()
    );
    
    v_notified_count := v_notified_count + 1;
  END LOOP;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

-- ========================================
-- ÉTAPE 7: Créer le trigger
-- ========================================

DROP TRIGGER IF EXISTS on_new_mission_notify ON public.missions;

CREATE TRIGGER on_new_mission_notify
AFTER INSERT ON public.missions
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION public.notify_nearby_artisans();

-- ========================================
-- ÉTAPE 8: Fonction pour récupérer les artisans proches
-- ========================================

CREATE OR REPLACE FUNCTION public.get_nearby_artisans(
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_category VARCHAR DEFAULT NULL,
  p_radius_km INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  category VARCHAR,
  distance DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  rating NUMERIC,
  completed_missions INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    u.name,
    a.category,
    public.calculate_distance_km(p_latitude, p_longitude, a.latitude, a.longitude) as distance,
    a.latitude,
    a.longitude,
    a.rating,
    a.completed_missions
  FROM public.artisans a
  JOIN public.users u ON u.id = a.id
  WHERE a.is_available = true
    AND a.is_suspended = false
    AND a.is_verified = true
    AND a.latitude IS NOT NULL
    AND a.longitude IS NOT NULL
    AND (p_category IS NULL OR a.category = p_category)
    AND public.calculate_distance_km(p_latitude, p_longitude, a.latitude, a.longitude) <= p_radius_km
  ORDER BY distance ASC;
END;
$$;

-- ========================================
-- VÉRIFICATION FINALE
-- ========================================

DO $$
DECLARE
  v_notifications_has_is_read BOOLEAN;
  v_users_has_location BOOLEAN;
  v_missions_has_location BOOLEAN;
  v_artisans_has_location BOOLEAN;
  v_function_exists BOOLEAN;
  v_trigger_exists BOOLEAN;
BEGIN
  -- Vérifier notifications
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'is_read'
  ) INTO v_notifications_has_is_read;
  
  -- Vérifier users
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'latitude'
  ) INTO v_users_has_location;
  
  -- Vérifier missions
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'missions' 
    AND column_name = 'latitude'
  ) INTO v_missions_has_location;
  
  -- Vérifier artisans
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'artisans' 
    AND column_name = 'latitude'
  ) INTO v_artisans_has_location;
  
  -- Vérifier fonction
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'notify_nearby_artisans'
  ) INTO v_function_exists;
  
  -- Vérifier trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_new_mission_notify'
  ) INTO v_trigger_exists;
  
  -- Afficher les résultats
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CONFIGURATION TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Colonne notifications.is_read: %', CASE WHEN v_notifications_has_is_read THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Colonnes users (lat/lon): %', CASE WHEN v_users_has_location THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Colonnes missions (lat/lon): %', CASE WHEN v_missions_has_location THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Colonnes artisans (lat/lon): %', CASE WHEN v_artisans_has_location THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Fonction notify_nearby_artisans: %', CASE WHEN v_function_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Trigger on_new_mission_notify: %', CASE WHEN v_trigger_exists THEN '✅' ELSE '❌' END;
  RAISE NOTICE '========================================';
  
  IF v_notifications_has_is_read AND v_users_has_location AND v_missions_has_location 
     AND v_artisans_has_location AND v_function_exists AND v_trigger_exists THEN
    RAISE NOTICE '🎉 Toutes les configurations sont OK !';
  ELSE
    RAISE EXCEPTION '❌ Certaines configurations ont échoué, vérifiez les logs ci-dessus';
  END IF;
END $$;
