-- ========================================
-- 🔧 CORRECTION FINALE: Notifications + Géolocalisation
-- ========================================
-- À copier-coller dans Supabase SQL Editor
-- ========================================

-- ÉTAPE 1: Renommer la colonne "read" en "is_read"
-- ========================================

ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'read'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'is_read'
  ) THEN
    ALTER TABLE public.notifications RENAME COLUMN "read" TO is_read;
    RAISE NOTICE '✅ Colonne "read" renommée en "is_read"';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'is_read'
  ) THEN
    RAISE NOTICE '✅ Colonne "is_read" existe déjà';
  ELSE
    ALTER TABLE public.notifications ADD COLUMN is_read BOOLEAN DEFAULT false NOT NULL;
    RAISE NOTICE '✅ Colonne "is_read" créée';
  END IF;
END $$;

-- ÉTAPE 2: Mettre à jour les index
-- ========================================

DROP INDEX IF EXISTS public.idx_notifications_user_unread;
DROP INDEX IF EXISTS public.idx_notifications_user;

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) 
  WHERE is_read = false;

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

RAISE NOTICE '✅ Index mis à jour';

-- ÉTAPE 3: Réactiver RLS
-- ========================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 4: Fonction de notification des artisans à proximité
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
  RAISE NOTICE '🔔 Recherche artisans à proximité pour mission % (catégorie: %, lat: %, lon: %)',
    NEW.id, NEW.category, NEW.latitude, NEW.longitude;

  FOR r IN
    SELECT 
      a.id, 
      u.name, 
      a.latitude, 
      a.longitude,
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
      ) <= a.intervention_radius
    ORDER BY distance ASC
    LIMIT 20
  LOOP
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
      format('Une nouvelle mission "%s" est disponible à %.1f km de vous.', 
        NEW.category, r.distance),
      NEW.id,
      false,
      NOW()
    );
    
    v_notified_count := v_notified_count + 1;
    
    RAISE NOTICE '✅ Notification envoyée à artisan % (distance: %.1f km)', 
      r.name, r.distance;
  END LOOP;

  RAISE NOTICE '📊 Total artisans notifiés: %', v_notified_count;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Erreur lors de la notification des artisans: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- ÉTAPE 5: Créer le trigger
-- ========================================

DROP TRIGGER IF EXISTS on_new_mission_notify ON public.missions;

CREATE TRIGGER on_new_mission_notify
AFTER INSERT ON public.missions
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION public.notify_nearby_artisans();

-- ÉTAPE 6: Ajouter les colonnes de localisation aux users si elles n'existent pas
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
    RAISE NOTICE '✅ Colonne latitude ajoutée à users';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'longitude'
  ) THEN
    ALTER TABLE public.users ADD COLUMN longitude DOUBLE PRECISION;
    RAISE NOTICE '✅ Colonne longitude ajoutée à users';
  END IF;
END $$;

-- ÉTAPE 7: Vérification finale
-- ========================================

DO $$
DECLARE
  v_has_is_read BOOLEAN;
  v_has_trigger BOOLEAN;
  v_has_function BOOLEAN;
  v_has_user_lat BOOLEAN;
  v_has_user_lon BOOLEAN;
BEGIN
  -- Vérifier la colonne is_read
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'is_read'
  ) INTO v_has_is_read;
  
  -- Vérifier le trigger
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    AND trigger_name = 'on_new_mission_notify'
  ) INTO v_has_trigger;
  
  -- Vérifier la fonction
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'notify_nearby_artisans'
  ) INTO v_has_function;

  -- Vérifier les colonnes de localisation users
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'latitude'
  ) INTO v_has_user_lat;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'longitude'
  ) INTO v_has_user_lon;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎯 VÉRIFICATION FINALE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Colonne is_read: %', CASE WHEN v_has_is_read THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Trigger notifications: %', CASE WHEN v_has_trigger THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Fonction notify_nearby_artisans: %', CASE WHEN v_has_function THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Colonne users.latitude: %', CASE WHEN v_has_user_lat THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Colonne users.longitude: %', CASE WHEN v_has_user_lon THEN '✅' ELSE '❌' END;
  RAISE NOTICE '========================================';
  
  IF v_has_is_read AND v_has_trigger AND v_has_function AND v_has_user_lat AND v_has_user_lon THEN
    RAISE NOTICE '✅ TOUTES LES CORRECTIONS SONT APPLIQUÉES';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Prochaines étapes:';
    RAISE NOTICE '1. Les notifications utiliseront maintenant la colonne "is_read"';
    RAISE NOTICE '2. Les artisans recevront des notifications pour les missions proches';
    RAISE NOTICE '3. La localisation GPS des utilisateurs sera enregistrée';
  ELSE
    RAISE WARNING '⚠️ Certaines corrections n''ont pas été appliquées';
  END IF;
END $$;

-- ========================================
-- ✅ FIN DU SCRIPT
-- ========================================
