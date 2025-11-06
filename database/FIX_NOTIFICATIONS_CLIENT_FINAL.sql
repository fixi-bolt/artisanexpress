-- ===================================================
-- CORRECTION FINALE: NOTIFICATIONS CLIENT
-- ===================================================
-- Copier-coller ce script dans l'éditeur SQL de Supabase
-- ===================================================

-- 1️⃣ Supprimer l'ancien trigger et fonction s'ils existent
DROP TRIGGER IF EXISTS trigger_notify_client_on_acceptance ON public.missions;
DROP FUNCTION IF EXISTS notify_client_on_mission_acceptance();

-- 2️⃣ Créer la fonction qui envoie la notification au client
CREATE OR REPLACE FUNCTION notify_client_on_mission_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que le statut passe à "accepted"
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Insérer une notification pour le client
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
      'Un artisan a accepté votre demande et arrive dans ' || COALESCE(NEW.eta::text, '15') || ' min',
      NEW.id,
      false,
      NOW()
    );
    
    RAISE NOTICE '✅ Notification créée pour client % (mission %)', NEW.client_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3️⃣ Créer le trigger qui appelle la fonction
CREATE TRIGGER trigger_notify_client_on_acceptance
  AFTER UPDATE OF status ON public.missions
  FOR EACH ROW
  EXECUTE FUNCTION notify_client_on_mission_acceptance();

-- 4️⃣ Activer Realtime sur la table notifications (important pour les notifications en temps réel)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 5️⃣ Vérification finale
DO $$
BEGIN
  RAISE NOTICE '🎯 VÉRIFICATION';
  RAISE NOTICE '================';
END $$;

-- Afficher le trigger créé
SELECT 
  '✅ Trigger trouvé' as status,
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'missions'
  AND trigger_name = 'trigger_notify_client_on_acceptance';

-- Afficher la fonction créée
SELECT 
  '✅ Fonction trouvée' as status,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'notify_client_on_mission_acceptance'
  AND routine_schema = 'public';

-- Vérifier que Realtime est activé
SELECT 
  '✅ Realtime vérifié' as status,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'notifications';

-- Message final
SELECT '🎉 CONFIGURATION TERMINÉE - Testez maintenant !' as resultat;
