-- ========================================
-- 🔔 CORRECTION RAPIDE : Notifications d'acceptation automatiques
-- ========================================
-- ⏱️  Temps d'exécution : ~2 secondes
-- 📋 Instructions : Copier TOUT ce fichier et coller dans Supabase SQL Editor
-- ========================================

-- 1️⃣ Créer la fonction trigger
CREATE OR REPLACE FUNCTION notify_client_on_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
  v_client_name TEXT;
  v_artisan_name TEXT;
  v_mission_title TEXT;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    SELECT 
      m.client_id,
      c_user.name as client_name,
      m.title,
      a_user.name as artisan_name
    INTO 
      v_client_id,
      v_client_name,
      v_mission_title,
      v_artisan_name
    FROM missions m
    JOIN users c_user ON m.client_id = c_user.id
    LEFT JOIN users a_user ON m.artisan_id = a_user.id
    WHERE m.id = NEW.id;

    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      mission_id,
      read,
      created_at
    ) VALUES (
      v_client_id,
      'mission_accepted',
      'Mission acceptée !',
      CASE 
        WHEN v_artisan_name IS NOT NULL THEN 
          v_artisan_name || ' arrive bientôt pour "' || v_mission_title || '"'
        ELSE 
          'Un artisan arrive bientôt pour "' || v_mission_title || '"'
      END,
      NEW.id,
      false,
      NOW()
    );

    RAISE NOTICE '✅ Notification créée pour client % (mission %)', v_client_id, NEW.id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2️⃣ Créer le trigger
DROP TRIGGER IF EXISTS notify_client_on_mission_accepted ON missions;

CREATE TRIGGER notify_client_on_mission_accepted
  AFTER UPDATE ON missions
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted'))
  EXECUTE FUNCTION notify_client_on_mission_accepted();

-- 3️⃣ Vérifications automatiques
DO $$
DECLARE
  trigger_count INTEGER;
  function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgname = 'notify_client_on_mission_accepted';
  
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE proname = 'notify_client_on_mission_accepted';
  
  IF trigger_count > 0 AND function_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ CORRECTION APPLIQUÉE AVEC SUCCÈS !';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '🔔 Le trigger de notification est maintenant actif';
    RAISE NOTICE '📋 Testez : Acceptez une mission dans l''app';
    RAISE NOTICE '';
    RAISE NOTICE '🔍 Vérifiez avec cette requête :';
    RAISE NOTICE '    SELECT * FROM notifications';
    RAISE NOTICE '    WHERE type = ''mission_accepted''';
    RAISE NOTICE '    ORDER BY created_at DESC LIMIT 5;';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
  ELSE
    RAISE EXCEPTION '❌ Échec : Trigger count=%, Function count=%', trigger_count, function_count;
  END IF;
END $$;
