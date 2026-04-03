-- ============================================================================
-- 🔔 CORRECTION FINALE : Notifications client pour missions acceptées
-- ============================================================================
-- Ce script garantit que le client reçoit une notification quand
-- un artisan accepte sa mission
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Vérifier et créer la table notifications si manquante
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  mission_id uuid REFERENCES public.missions(id) ON DELETE CASCADE,
  read boolean DEFAULT false,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_mission_id ON public.notifications(mission_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- RLS pour notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- ÉTAPE 2 : Fonction trigger pour créer notification automatiquement
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_client_mission_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_id uuid;
  v_mission_title text;
  v_artisan_name text;
  v_notification_id uuid;
BEGIN
  -- Vérifier que c'est un changement vers 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    -- Récupérer les informations
    SELECT 
      m.client_id, 
      m.title, 
      COALESCE(u.name, 'Un artisan')
    INTO 
      v_client_id, 
      v_mission_title, 
      v_artisan_name
    FROM public.missions m
    LEFT JOIN public.users u ON m.artisan_id = u.id
    WHERE m.id = NEW.id;
    
    -- Sécurité
    IF v_client_id IS NULL THEN
      RAISE WARNING '[notify_client_mission_accepted] client_id NULL pour mission %', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Insérer la notification
    BEGIN
      INSERT INTO public.notifications (
        id,
        user_id,
        type,
        title,
        message,
        mission_id,
        read,
        is_read,
        created_at
      ) VALUES (
        gen_random_uuid(),
        v_client_id,
        'mission_accepted',
        'Mission acceptée !',
        v_artisan_name || ' arrive bientôt pour "' || COALESCE(v_mission_title, 'votre mission') || '"',
        NEW.id,
        false,
        false,
        NOW()
      ) RETURNING id INTO v_notification_id;
      
      RAISE NOTICE '[notify_client_mission_accepted] ✅ Notification créée (ID: %) pour client % (mission %)', 
        v_notification_id, v_client_id, NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[notify_client_mission_accepted] ❌ Erreur insertion notification: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- ÉTAPE 3 : Créer/recréer le trigger
-- ============================================================================

-- Supprimer tous les triggers existants avec des noms similaires
DROP TRIGGER IF EXISTS trg_notify_mission_accepted ON public.missions;
DROP TRIGGER IF EXISTS notify_client_on_mission_accepted ON public.missions;
DROP TRIGGER IF EXISTS trg_notify_client_mission_accepted ON public.missions;

-- Créer le nouveau trigger
CREATE TRIGGER trg_notify_client_mission_accepted
  AFTER UPDATE ON public.missions
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted'))
  EXECUTE FUNCTION public.notify_client_mission_accepted();

-- ============================================================================
-- ÉTAPE 4 : Activer REALTIME sur la table notifications
-- ============================================================================

-- Supprimer la publication existante si elle existe
DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;

-- Créer la publication pour realtime
CREATE PUBLICATION supabase_realtime FOR TABLE public.notifications, public.missions;

-- Activer replica identity FULL pour avoir toutes les colonnes dans les events
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.missions REPLICA IDENTITY FULL;

-- ============================================================================
-- ÉTAPE 5 : Test du trigger
-- ============================================================================

DO $$
DECLARE
  test_client_id uuid;
  test_artisan_id uuid;
  test_mission_id uuid;
  notification_count integer;
BEGIN
  -- Récupérer un client de test
  SELECT id INTO test_client_id 
  FROM public.users 
  WHERE user_type = 'client' 
  LIMIT 1;
  
  -- Récupérer un artisan de test
  SELECT id INTO test_artisan_id 
  FROM public.users 
  WHERE user_type = 'artisan' 
  LIMIT 1;
  
  IF test_client_id IS NULL OR test_artisan_id IS NULL THEN
    RAISE NOTICE '⚠️ Pas de données de test disponibles';
    RETURN;
  END IF;
  
  -- Créer une mission de test
  INSERT INTO public.missions (
    client_id,
    category,
    title,
    description,
    latitude,
    longitude,
    status,
    estimated_price
  ) VALUES (
    test_client_id,
    'plombier',
    'TEST: Mission pour notification',
    'Test automatique du trigger',
    48.8566,
    2.3522,
    'pending',
    100.00
  ) RETURNING id INTO test_mission_id;
  
  RAISE NOTICE '📝 Mission de test créée : %', test_mission_id;
  
  -- Accepter la mission (doit déclencher le trigger)
  UPDATE public.missions
  SET 
    status = 'accepted',
    artisan_id = test_artisan_id,
    accepted_at = NOW()
  WHERE id = test_mission_id;
  
  -- Attendre un peu pour que le trigger s'exécute
  PERFORM pg_sleep(0.5);
  
  -- Vérifier qu'une notification a été créée
  SELECT COUNT(*) INTO notification_count
  FROM public.notifications
  WHERE mission_id = test_mission_id
    AND type = 'mission_accepted'
    AND user_id = test_client_id;
  
  IF notification_count >= 1 THEN
    RAISE NOTICE '✅ TEST RÉUSSI : Notification créée automatiquement (% notifications)', notification_count;
  ELSE
    RAISE WARNING '❌ TEST ÉCHOUÉ : Aucune notification trouvée';
  END IF;
  
  -- Nettoyer les données de test
  DELETE FROM public.notifications WHERE mission_id = test_mission_id;
  DELETE FROM public.missions WHERE id = test_mission_id;
  
  RAISE NOTICE '🧹 Données de test nettoyées';
END $$;

-- ============================================================================
-- ÉTAPE 6 : Vérifications finales
-- ============================================================================

DO $$
DECLARE
  trigger_exists boolean;
  function_exists boolean;
  realtime_enabled boolean;
BEGIN
  -- Vérifier le trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_notify_client_mission_accepted'
  ) INTO trigger_exists;
  
  -- Vérifier la fonction
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'notify_client_mission_accepted'
  ) INTO function_exists;
  
  -- Vérifier realtime
  SELECT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) INTO realtime_enabled;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ VÉRIFICATIONS FINALES';
  RAISE NOTICE '========================================';
  
  IF trigger_exists THEN
    RAISE NOTICE '✅ Trigger actif';
  ELSE
    RAISE WARNING '❌ Trigger MANQUANT';
  END IF;
  
  IF function_exists THEN
    RAISE NOTICE '✅ Fonction créée';
  ELSE
    RAISE WARNING '❌ Fonction MANQUANTE';
  END IF;
  
  IF realtime_enabled THEN
    RAISE NOTICE '✅ Realtime activé';
  ELSE
    RAISE WARNING '❌ Realtime DÉSACTIVÉ';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- ÉTAPE 7 : Requête de diagnostic
-- ============================================================================

-- Afficher les dernières notifications
DO $$
DECLARE
  notif_record record;
  notif_count integer;
BEGIN
  SELECT COUNT(*) INTO notif_count FROM public.notifications;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Total notifications : %', notif_count;
  RAISE NOTICE '';
  RAISE NOTICE '📋 Dernières notifications :';
  
  FOR notif_record IN 
    SELECT 
      n.id,
      n.type,
      n.title,
      n.created_at,
      u.name as client_name,
      m.title as mission_title
    FROM public.notifications n
    LEFT JOIN public.users u ON n.user_id = u.id
    LEFT JOIN public.missions m ON n.mission_id = m.id
    ORDER BY n.created_at DESC
    LIMIT 5
  LOOP
    RAISE NOTICE '  - [%] % - % (%)', 
      notif_record.type, 
      notif_record.title, 
      COALESCE(notif_record.client_name, 'unknown'),
      notif_record.created_at;
  END LOOP;
  
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- MESSAGE FINAL
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅✅✅ SCRIPT EXÉCUTÉ AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔔 Le système de notification est maintenant actif';
  RAISE NOTICE '';
  RAISE NOTICE '📋 TEST À FAIRE :';
  RAISE NOTICE '1. Connectez-vous comme artisan';
  RAISE NOTICE '2. Acceptez une mission';
  RAISE NOTICE '3. Le client doit recevoir une notification';
  RAISE NOTICE '4. Vérifiez avec cette requête :';
  RAISE NOTICE '   SELECT * FROM notifications';
  RAISE NOTICE '   WHERE type = ''mission_accepted''';
  RAISE NOTICE '   ORDER BY created_at DESC LIMIT 5;';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
