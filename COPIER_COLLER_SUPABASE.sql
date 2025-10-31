-- ========================================
-- 🚀 SCRIPT À COPIER-COLLER DANS SUPABASE
-- ========================================
-- Ce fichier contient UNIQUEMENT le script SQL final
-- à copier-coller dans Supabase SQL Editor
-- 
-- ⚠️ INSTRUCTIONS:
-- 1. Ouvrir Supabase Dashboard
-- 2. Aller dans "SQL Editor"
-- 3. Cliquer "New Query"
-- 4. Copier-coller TOUT le contenu ci-dessous
-- 5. Cliquer "Run"
-- 6. Vérifier les messages de succès
-- ========================================

-- Copier depuis cette ligne jusqu'à la fin du fichier ↓

-- ========================================
-- 🔔 FIX NOTIFICATIONS ARTISANS - SCRIPT FINAL
-- ========================================
-- Objectif: Corriger le système de notification des artisans
-- Problème: Les artisans ne reçoivent pas de notification lors de nouvelles demandes
-- Date: 2025-10-31
-- ========================================

-- Étape 1: Vérifier que la colonne is_read existe
-- ========================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications'
    AND column_name = 'is_read'
  ) THEN
    ALTER TABLE public.notifications RENAME COLUMN is_read TO read;
    RAISE NOTICE '✅ Colonne is_read renommée en read';
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications'
    AND column_name = 'read'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN read BOOLEAN DEFAULT false NOT NULL;
    RAISE NOTICE '✅ Colonne read créée';
  ELSE
    RAISE NOTICE '✅ Colonne read existe déjà';
  END IF;
END$$;

-- Étape 2: Ajouter la colonne read_at si elle n'existe pas
-- ========================================
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Étape 3: Vérifier que la colonne is_verified existe dans artisans
-- ========================================
ALTER TABLE public.artisans
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT true NOT NULL;

-- Étape 4: Créer la fonction de calcul de distance si elle n'existe pas
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

-- Étape 5: Créer ou remplacer la fonction de notification des artisans
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

-- Étape 6: Supprimer et recréer le trigger
-- ========================================
DROP TRIGGER IF EXISTS on_new_mission_notify ON public.missions;

CREATE TRIGGER on_new_mission_notify
AFTER INSERT ON public.missions
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION public.notify_nearby_artisans();

COMMENT ON TRIGGER on_new_mission_notify ON public.missions IS 'Déclenche la notification des artisans lors de la création d''une mission en statut pending';

-- Étape 7: Créer une fonction RPC pour marquer les notifications comme lues
-- ========================================
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications
  SET 
    read = true,
    read_at = NOW()
  WHERE 
    id = p_notification_id
    AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_notification_as_read TO authenticated;
COMMENT ON FUNCTION public.mark_notification_as_read IS 'Marque une notification comme lue pour l''utilisateur connecté';

-- Étape 8: Vérifications et diagnostics
-- ========================================
DO $$
DECLARE
  v_total_artisans INTEGER;
  v_available_artisans INTEGER;
  v_verified_artisans INTEGER;
  v_artisans_with_gps INTEGER;
  v_recent_missions INTEGER;
  v_recent_notifications INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_artisans FROM public.artisans;
  
  SELECT COUNT(*) INTO v_available_artisans 
  FROM public.artisans 
  WHERE is_available = true AND is_suspended = false;
  
  SELECT COUNT(*) INTO v_verified_artisans 
  FROM public.artisans 
  WHERE is_available = true 
    AND is_suspended = false 
    AND COALESCE(is_verified, true) = true;
  
  SELECT COUNT(*) INTO v_artisans_with_gps 
  FROM public.artisans 
  WHERE is_available = true 
    AND is_suspended = false 
    AND latitude IS NOT NULL 
    AND longitude IS NOT NULL;
  
  SELECT COUNT(*) INTO v_recent_missions 
  FROM public.missions 
  WHERE created_at > NOW() - INTERVAL '1 day';
  
  SELECT COUNT(*) INTO v_recent_notifications 
  FROM public.notifications 
  WHERE created_at > NOW() - INTERVAL '1 day'
    AND type = 'mission_request';

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SYSTÈME DE NOTIFICATIONS CONFIGURÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 STATISTIQUES:';
  RAISE NOTICE '  • Total artisans: %', v_total_artisans;
  RAISE NOTICE '  • Artisans disponibles: %', v_available_artisans;
  RAISE NOTICE '  • Artisans vérifiés: %', v_verified_artisans;
  RAISE NOTICE '  • Artisans avec GPS: %', v_artisans_with_gps;
  RAISE NOTICE '  • Missions 24h: %', v_recent_missions;
  RAISE NOTICE '  • Notifications 24h: %', v_recent_notifications;
  RAISE NOTICE '';
  RAISE NOTICE '✅ COMPOSANTS ACTIVÉS:';
  RAISE NOTICE '  • Fonction: notify_nearby_artisans()';
  RAISE NOTICE '  • Trigger: on_new_mission_notify';
  RAISE NOTICE '  • Fonction: calculate_distance_km()';
  RAISE NOTICE '  • Fonction: mark_notification_as_read()';
  RAISE NOTICE '';
  
  IF v_artisans_with_gps = 0 THEN
    RAISE WARNING '⚠️ Aucun artisan n''a de coordonnées GPS configurées';
    RAISE WARNING '   Les artisans doivent activer la géolocalisation pour recevoir des notifications';
  END IF;
  
  IF v_available_artisans = 0 THEN
    RAISE WARNING '⚠️ Aucun artisan disponible actuellement';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📝 ÉTAPES DE TEST RECOMMANDÉES:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Vérifier qu''un artisan a:';
  RAISE NOTICE '   - is_available = true';
  RAISE NOTICE '   - is_suspended = false';
  RAISE NOTICE '   - is_verified = true';
  RAISE NOTICE '   - latitude et longitude renseignés';
  RAISE NOTICE '   - category définie (ex: "plumber")';
  RAISE NOTICE '';
  RAISE NOTICE '2. Créer une mission avec:';
  RAISE NOTICE '   - category identique à l''artisan';
  RAISE NOTICE '   - latitude/longitude dans le rayon d''intervention';
  RAISE NOTICE '   - status = ''pending''';
  RAISE NOTICE '';
  RAISE NOTICE '3. Vérifier la notification:';
  RAISE NOTICE '   SELECT * FROM notifications ';
  RAISE NOTICE '   WHERE user_id = ''<artisan_id>'' ';
  RAISE NOTICE '   ORDER BY created_at DESC LIMIT 5;';
  RAISE NOTICE '';
  RAISE NOTICE '4. Debug en temps réel:';
  RAISE NOTICE '   Les NOTICE logs apparaîtront dans l''onglet Logs';
  RAISE NOTICE '   de Supabase après la création d''une mission';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END$$;

-- ========================================
-- FIN DU SCRIPT
-- ========================================
