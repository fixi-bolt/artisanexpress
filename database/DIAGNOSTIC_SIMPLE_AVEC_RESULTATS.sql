-- ========================================
-- 🔧 FIX COMPLET - NOTIFICATIONS D'ACCEPTATION
-- ========================================
-- Ce script corrige le problème de notifications manquantes
-- quand un artisan accepte une mission

-- ========================================
-- 1️⃣ FONCTION DE NOTIFICATION
-- ========================================

-- Supprime l'ancienne version si elle existe
DROP FUNCTION IF EXISTS notify_client_mission_accepted() CASCADE;

-- Crée la fonction corrigée
CREATE OR REPLACE FUNCTION notify_client_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_mission_title TEXT;
  v_artisan_name TEXT;
  v_client_id UUID;
BEGIN
  -- Vérifie si c'est une acceptation de mission
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    
    -- Récupère les infos nécessaires
    SELECT title, client_id INTO v_mission_title, v_client_id
    FROM missions
    WHERE id = NEW.id;
    
    -- Récupère le nom de l'artisan
    SELECT name INTO v_artisan_name
    FROM users
    WHERE id = NEW.artisan_id;
    
    -- Crée la notification pour le client
    INSERT INTO notifications (
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
      'Mission acceptée',
      CONCAT(COALESCE(v_artisan_name, 'Un artisan'), ' a accepté votre mission "', COALESCE(v_mission_title, 'Sans titre'), '"'),
      NEW.id,
      false,
      NOW()
    );
    
    RAISE NOTICE '✅ Notification créée pour le client %', v_client_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 2️⃣ TRIGGER
-- ========================================

-- Supprime l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_notify_mission_accepted ON missions;

-- Crée le nouveau trigger
CREATE TRIGGER trigger_notify_mission_accepted
  AFTER UPDATE OF status, artisan_id ON missions
  FOR EACH ROW
  EXECUTE FUNCTION notify_client_mission_accepted();

-- ========================================
-- 3️⃣ VÉRIFICATION
-- ========================================

-- Teste la fonction
DO $$
BEGIN
  RAISE NOTICE '==================================';
  RAISE NOTICE '✅ CONFIGURATION TERMINÉE';
  RAISE NOTICE '==================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Fonction créée: notify_client_mission_accepted()';
  RAISE NOTICE '📋 Trigger créé: trigger_notify_mission_accepted';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TEST:';
  RAISE NOTICE '1. Artisan accepte une mission';
  RAISE NOTICE '2. Trigger s''active automatiquement';
  RAISE NOTICE '3. Notification créée pour le client';
  RAISE NOTICE '4. Realtime notifie le frontend';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Prêt à tester !';
END $$;
