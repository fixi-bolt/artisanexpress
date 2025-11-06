-- ============================================================================
-- ✅ SOLUTION IMMÉDIATE : Créer le trigger et la fonction manquants
-- ============================================================================
-- Copiez-collez TOUT ce script dans l'éditeur SQL de Supabase
-- ============================================================================

-- 1️⃣ Créer la fonction qui envoie la notification
CREATE OR REPLACE FUNCTION notify_client_on_mission_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que la mission vient d'être acceptée
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    
    -- Insérer la notification pour le client
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      mission_id,
      is_read,
      created_at
    ) VALUES (
      NEW.client_id,
      'mission_accepted',
      'Mission acceptée !',
      'Votre mission "' || NEW.title || '" a été acceptée par un artisan.',
      NEW.id,
      false,
      NOW()
    );
    
    -- Log pour debug
    RAISE NOTICE '✅ Notification créée pour client % sur mission %', NEW.client_id, NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2️⃣ Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trg_notify_mission_accepted ON missions;

-- 3️⃣ Créer le nouveau trigger
CREATE TRIGGER trg_notify_mission_accepted
  AFTER UPDATE ON missions
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
  EXECUTE FUNCTION notify_client_on_mission_accepted();

-- 4️⃣ Vérifier que tout est créé
SELECT 
  '✅ VÉRIFICATION' as section,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'trg_notify_mission_accepted') as trigger_exists,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'notify_client_on_mission_accepted') as function_exists;

-- 5️⃣ Test manuel immédiat
DO $$
DECLARE
  test_mission record;
  notif_count_before integer;
  notif_count_after integer;
BEGIN
  -- Compter les notifications avant
  SELECT COUNT(*) INTO notif_count_before FROM public.notifications;
  
  -- Trouver une mission pending
  SELECT * INTO test_mission
  FROM public.missions
  WHERE status = 'pending'
  LIMIT 1;
  
  IF test_mission.id IS NOT NULL THEN
    RAISE NOTICE '🧪 Test avec mission: %', test_mission.id;
    
    -- Simuler une acceptation
    UPDATE public.missions
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = test_mission.id;
    
    -- Compter après
    SELECT COUNT(*) INTO notif_count_after FROM public.notifications;
    
    RAISE NOTICE '✅ Notifications avant: %, après: %', notif_count_before, notif_count_after;
    
    IF notif_count_after > notif_count_before THEN
      RAISE NOTICE '✅✅✅ LE TRIGGER FONCTIONNE !';
    ELSE
      RAISE WARNING '❌ Le trigger ne s''est pas déclenché';
    END IF;
    
    -- Remettre en pending pour ne pas gêner
    UPDATE public.missions
    SET status = 'pending', accepted_at = NULL
    WHERE id = test_mission.id;
    
  ELSE
    RAISE NOTICE '⚠️ Aucune mission pending pour tester';
  END IF;
END $$;

-- 6️⃣ Afficher le résumé
SELECT '🎯 RÉSUMÉ FINAL' as section;

DO $$
DECLARE
  has_trigger boolean;
  has_function boolean;
BEGIN
  -- Vérifier trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notify_mission_accepted'
  ) INTO has_trigger;
  
  -- Vérifier fonction
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'notify_client_on_mission_accepted'
  ) INTO has_function;
  
  IF has_trigger AND has_function THEN
    RAISE NOTICE '=================================================';
    RAISE NOTICE '✅✅✅ CONFIGURATION COMPLÈTE !';
    RAISE NOTICE '=================================================';
    RAISE NOTICE 'Trigger: ✅';
    RAISE NOTICE 'Fonction: ✅';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Testez maintenant dans l''app :';
    RAISE NOTICE '1. Un artisan accepte une mission';
    RAISE NOTICE '2. Le client devrait recevoir la notification instantanément';
    RAISE NOTICE '=================================================';
  ELSE
    RAISE WARNING '❌ Problème lors de la création';
  END IF;
END $$;
