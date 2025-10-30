-- ============================================
-- SCRIPT SQL FINAL CORRIGÉ - GÉOLOCALISATION + NOTIFICATIONS
-- ============================================
-- ✅ Prêt à coller dans l'éditeur SQL de Supabase
-- ============================================

-- ÉTAPE 1 : Ajouter les colonnes de géolocalisation
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Créer des index pour optimiser les requêtes de proximité
CREATE INDEX IF NOT EXISTS idx_users_location 
ON public.users (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_artisans_location 
ON public.artisans (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================
-- ÉTAPE 2 : Créer la table des notifications
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'mission' CHECK (type IN ('mission', 'payment', 'chat', 'system', 'admin', 'mission_request')),
  mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_mission_id ON public.notifications(mission_id);

-- RLS pour les notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- ============================================
-- ÉTAPE 3 : Fonction pour calculer la distance GPS
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
  RETURN 6371 * acos(
    cos(radians(lat1)) *
    cos(radians(lat2)) *
    cos(radians(lon2) - radians(lon1)) +
    sin(radians(lat1)) *
    sin(radians(lat2))
  );
END;
$$;

-- Alias pour compatibilité
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
  RETURN public.calculate_distance(lat1, lon1, lat2, lon2);
END;
$$;

-- ============================================
-- ÉTAPE 4 : Fonction pour notifier les artisans proches
-- ============================================
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
  SELECT u.name, u.latitude, u.longitude
  INTO client_name, client_lat, client_lon
  FROM public.users u
  WHERE u.id = NEW.client_id;

  IF client_lat IS NULL OR client_lon IS NULL THEN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
      client_lat := NEW.latitude;
      client_lon := NEW.longitude;
    ELSE
      client_lat := 48.8566;
      client_lon := 2.3522;
    END IF;
  END IF;

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
    distance_km := public.calculate_distance(
      client_lat,
      client_lon,
      artisan_record.latitude,
      artisan_record.longitude
    );

    IF distance_km <= COALESCE(artisan_record.intervention_radius, 10) THEN
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
        'mission_request',
        NEW.id,
        jsonb_build_object(
          'distance_km', distance_km,
          'category', NEW.category,
          'mission_id', NEW.id,
          'client_name', client_name
        )
      );

      notified_count := notified_count + 1;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- ============================================
-- ÉTAPE 5 : Créer le trigger sur les missions
-- ============================================
DROP TRIGGER IF EXISTS on_mission_created_notify_artisans ON public.missions;

CREATE TRIGGER on_mission_created_notify_artisans
AFTER INSERT ON public.missions
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION public.notify_nearby_artisans();

-- ============================================
-- ÉTAPE 6 : Fonction pour marquer comme lu
-- ============================================
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications
  SET 
    is_read = true,
    read_at = now()
  WHERE 
    id = notification_id
    AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$;

-- ============================================
-- ÉTAPE 7 : Fonction pour récupérer les artisans proches
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
-- ÉTAPE 8 : Ajouter latitude/longitude aux missions
-- ============================================
ALTER TABLE public.missions
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- ============================================
-- ✅ SCRIPT TERMINÉ
-- ============================================
