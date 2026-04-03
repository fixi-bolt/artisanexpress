-- ========================================
-- 🔧 SCRIPT DE CORRECTION IMMÉDIAT
-- ========================================
-- À COLLER DANS L'ÉDITEUR SQL SUPABASE
-- Corrige: fonctions dupliquées + synchronisation disponibilité
-- Date: 2025-10-31
-- ========================================

-- ========================================
-- PARTIE 1: NETTOYAGE DES FONCTIONS DUPLIQUÉES
-- ========================================

-- Supprimer toutes les versions de calculate_distance
DROP FUNCTION IF EXISTS public.calculate_distance(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_distance(DECIMAL, DECIMAL, DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_distance_km(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_distance_km(DECIMAL, DECIMAL, DECIMAL, DECIMAL) CASCADE;

-- Supprimer toutes les versions de find_nearby_missions
DROP FUNCTION IF EXISTS public.find_nearby_missions(UUID, DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;
DROP FUNCTION IF EXISTS public.find_nearby_missions(UUID, DECIMAL, DECIMAL) CASCADE;

-- Supprimer toutes les versions de get_nearby_artisans
DROP FUNCTION IF EXISTS public.get_nearby_artisans(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_nearby_artisans(DECIMAL, DECIMAL, DECIMAL, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_nearby_artisans(DOUBLE PRECISION, DOUBLE PRECISION) CASCADE;
DROP FUNCTION IF EXISTS public.get_nearby_artisans(DECIMAL, DECIMAL) CASCADE;

-- ========================================
-- PARTIE 2: RECRÉER LES FONCTIONS (VERSION UNIQUE)
-- ========================================

-- Fonction de calcul de distance
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

-- Fonction de recherche de missions à proximité
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

-- Fonction de recherche d'artisans à proximité
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

-- ========================================
-- PARTIE 3: SYSTÈME DE NOTIFICATIONS
-- ========================================

-- Fonction de notification des artisans à proximité
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

  RAISE NOTICE '🔔 Nouvelle mission: % (cat: %, lat: %, lon: %)',
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
      
      RAISE NOTICE '✅ Notification à % (distance: %.1f km)', 
        r.artisan_name, r.distance;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '❌ Erreur notification pour %: %', 
        r.artisan_name, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '📊 Total artisans notifiés: %', v_notified_count;
  
  IF v_notified_count = 0 THEN
    RAISE WARNING '⚠️ Aucun artisan notifié pour mission % (cat: %)', 
      NEW.id, NEW.category;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Erreur globale notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recréer le trigger
DROP TRIGGER IF EXISTS on_new_mission_notify ON public.missions;

CREATE TRIGGER on_new_mission_notify
AFTER INSERT ON public.missions
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION public.notify_nearby_artisans();

-- ========================================
-- PARTIE 4: COLONNES DE DISPONIBILITÉ
-- ========================================

-- Ajouter is_profile_visible si elle n'existe pas
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_profile_visible BOOLEAN DEFAULT true;

-- Ajouter is_available dans users si elle n'existe pas (pour synchronisation)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;

-- ========================================
-- PARTIE 5: TRIGGER DE SYNCHRONISATION
-- ========================================

-- Fonction de synchronisation is_available entre users et artisans
CREATE OR REPLACE FUNCTION sync_artisan_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand artisans.is_available change, mettre à jour users.is_available
  IF TG_TABLE_NAME = 'artisans' THEN
    UPDATE users 
    SET is_available = NEW.is_available
    WHERE id = NEW.id;
  END IF;

  -- Quand users.is_available change, mettre à jour artisans.is_available
  IF TG_TABLE_NAME = 'users' THEN
    UPDATE artisans 
    SET is_available = NEW.is_available
    WHERE id = NEW.id AND EXISTS (
      SELECT 1 FROM users WHERE id = NEW.id AND user_type = 'artisan'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur artisans
DROP TRIGGER IF EXISTS sync_availability_from_artisans ON artisans;
CREATE TRIGGER sync_availability_from_artisans
AFTER UPDATE OF is_available ON artisans
FOR EACH ROW
WHEN (OLD.is_available IS DISTINCT FROM NEW.is_available)
EXECUTE FUNCTION sync_artisan_availability();

-- Trigger sur users
DROP TRIGGER IF EXISTS sync_availability_from_users ON users;
CREATE TRIGGER sync_availability_from_users
AFTER UPDATE OF is_available ON users
FOR EACH ROW
WHEN (OLD.is_available IS DISTINCT FROM NEW.is_available)
EXECUTE FUNCTION sync_artisan_availability();

-- ========================================
-- PARTIE 6: POLITIQUES RLS
-- ========================================

-- Activer RLS sur users si pas déjà fait
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre aux artisans de mettre à jour leur disponibilité et visibilité
DROP POLICY IF EXISTS "Artisans can update their profile" ON public.users;
CREATE POLICY "Artisans can update their profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id AND user_type = 'artisan')
WITH CHECK (auth.uid() = id AND user_type = 'artisan');

-- Index partiel pour recherche optimisée
CREATE INDEX IF NOT EXISTS idx_users_visible_artisans
ON public.users (user_type, is_profile_visible, is_available)
WHERE user_type = 'artisan' AND is_profile_visible = true;

-- ========================================
-- VÉRIFICATIONS FINALES
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CORRECTIONS APPLIQUÉES AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📦 Fonctions corrigées:';
  RAISE NOTICE '  • calculate_distance_km';
  RAISE NOTICE '  • find_nearby_missions';
  RAISE NOTICE '  • get_nearby_artisans';
  RAISE NOTICE '  • notify_nearby_artisans';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Synchronisation:';
  RAISE NOTICE '  • Triggers de synchro is_available ajoutés';
  RAISE NOTICE '  • Colonne is_profile_visible ajoutée';
  RAISE NOTICE '';
  RAISE NOTICE '🔔 Notifications:';
  RAISE NOTICE '  • Trigger on_new_mission_notify activé';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Sécurité:';
  RAISE NOTICE '  • Politiques RLS mises à jour';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END$$;

-- FIN DU SCRIPT
