-- ===================================================
-- 🔧 FIX RAPIDE: Créer la fonction send_mission_accepted_notification
-- ===================================================
-- Copier-coller ce script dans l'éditeur SQL de Supabase
-- ===================================================

-- 1️⃣ Supprimer l'ancien trigger et fonctions s'ils existent
DROP TRIGGER IF EXISTS trigger_notify_client_on_acceptance ON public.missions;
DROP FUNCTION IF EXISTS notify_client_on_mission_acceptance() CASCADE;
DROP FUNCTION IF EXISTS send_mission_accepted_notification() CASCADE;

-- 2️⃣ Créer la fonction qui envoie la notification au client
CREATE OR REPLACE FUNCTION send_mission_accepted_notification()
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
  EXECUTE FUNCTION send_mission_accepted_notification();

-- 4️⃣ Message de confirmation
SELECT '🎉 Fonction créée avec succès !' as resultat;
SELECT '✅ Le trigger est maintenant actif' as status;
