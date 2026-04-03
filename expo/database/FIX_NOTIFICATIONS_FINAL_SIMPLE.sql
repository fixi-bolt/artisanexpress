-- ============================================================================
-- ✅ SOLUTION SIMPLE : Créer le trigger pour les notifications
-- ============================================================================
-- Copiez-collez ce script dans Supabase → SQL Editor
-- ============================================================================

-- 1️⃣ Créer la fonction qui envoie la notification au client
CREATE OR REPLACE FUNCTION public.notify_client_on_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id uuid;
  v_mission_title text;
  v_artisan_name text;
BEGIN
  -- Trigger uniquement quand status passe à 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    -- Récupère les infos de la mission et de l'artisan
    SELECT m.client_id, m.title, u.name
    INTO v_client_id, v_mission_title, v_artisan_name
    FROM public.missions m
    LEFT JOIN public.users u ON m.artisan_id = u.id
    WHERE m.id = NEW.id;
    
    -- Vérification de sécurité
    IF v_client_id IS NULL THEN
      RAISE WARNING '❌ client_id NULL pour mission %', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Insertion de la notification
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      mission_id,
      is_read,
      created_at
    ) VALUES (
      v_client_id,
      'mission_accepted',
      '🎉 Mission acceptée !',
      COALESCE(v_artisan_name, 'Un artisan') || ' a accepté votre mission "' || COALESCE(v_mission_title, 'votre demande') || '"',
      NEW.id,
      false,
      NOW()
    );
    
    RAISE NOTICE '✅ Notification envoyée au client %', v_client_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2️⃣ Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trg_notify_mission_accepted ON public.missions;

-- 3️⃣ Créer le nouveau trigger
CREATE TRIGGER trg_notify_mission_accepted
  AFTER UPDATE ON public.missions
  FOR EACH ROW
  WHEN (NEW.status = 'accepted')
  EXECUTE FUNCTION public.notify_client_on_mission_accepted();

-- 4️⃣ Vérification
DO $$
BEGIN
  RAISE NOTICE '✅✅✅ Trigger créé avec succès !';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Testez maintenant :';
  RAISE NOTICE '1. Acceptez une mission depuis l''app artisan';
  RAISE NOTICE '2. Le client devrait recevoir la notification instantanément';
END $$;
