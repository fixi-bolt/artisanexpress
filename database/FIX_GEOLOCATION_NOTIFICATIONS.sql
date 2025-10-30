-- ============================================
-- Script SQL : Géolocalisation + Notifications
-- ============================================
-- À coller dans l'éditeur SQL de Supabase
-- ============================================

-- ÉTAPE 1 : Ajouter les colonnes de géolocalisation
-- ============================================
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
-- ÉTAPE 2 : Créer la table des notifications si elle n'existe pas
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'mission' CHECK (type IN ('mission', 'payment', 'chat', 'system', 'admin')),
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
-- ÉTAPE 3 : Fonction pour calculer la distance entre deux points GPS
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
  -- Formule de Haversine pour calculer la distance en km
  RETURN 6371 * acos(
    cos(radians(lat1)) *
    cos(radians(lat2)) *
    cos(radians(lon2) - radians(lon1)) +
    sin(radians(lat1)) *
    sin(radians(lat2))
  );
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
  -- Récupérer les infos du client qui a créé la mission
  SELECT u.name, u.latitude, u.longitude
  INTO client_name, client_lat, client_lon
  FROM public.users u
  WHERE u.id = NEW.client_id;

  -- Si le client n'a pas de position GPS, utiliser une position par défaut (Paris)
  IF client_lat IS NULL OR client_lon IS NULL THEN
    -- Récupérer la position depuis l'adresse de la mission si disponible
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
      client_lat := NEW.latitude;
      client_lon := NEW.longitude;
    ELSE
      -- Position par défaut : Paris centre
      client_lat := 48.8566;
      client_lon := 2.3522;
    END IF;
  END IF;

  -- Log pour debug
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
    distance_km := public.calculate_distance(
      client_lat,
      client_lon,
      artisan_record.latitude,
      artisan_record.longitude
    );

    -- Log pour debug
    RAISE NOTICE 'Artisan % à % km', artisan_record.name, distance_km;

    -- Si l'artisan est dans le rayon d'intervention (ou dans un rayon de 10km par défaut)
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
-- ÉTAPE 6 : Fonction RPC pour marquer les notifications comme lues
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
-- ÉTAPE 7 : Fonction RPC pour récupérer les artisans à proximité
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
-- ÉTAPE 8 : Ajouter latitude/longitude à la table missions si besoin
-- ============================================
ALTER TABLE public.missions
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- ============================================
-- VÉRIFICATIONS FINALES
-- ============================================

-- Vérifier que les colonnes existent
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('latitude', 'longitude');

-- Vérifier que la table notifications existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'notifications'
);

-- Vérifier que le trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_mission_created_notify_artisans';

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- Ce script configure:
-- ✅ Colonnes de géolocalisation (latitude, longitude)
-- ✅ Table des notifications avec RLS
-- ✅ Fonction de calcul de distance GPS
-- ✅ Trigger automatique pour notifier les artisans
-- ✅ Fonction RPC pour trouver les artisans proches
-- ============================================
