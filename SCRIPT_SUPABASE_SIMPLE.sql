-- ═══════════════════════════════════════════════════════════════
-- 🚀 CORRECTION RAPIDE - ACCEPTATION MISSION
-- ═══════════════════════════════════════════════════════════════
-- COPIEZ-COLLEZ CE CODE DANS L'ÉDITEUR SQL DE SUPABASE
-- Temps: 30 secondes | Difficulté: Copier-coller
-- ═══════════════════════════════════════════════════════════════

-- 1️⃣ Nettoyage des anciens triggers
DROP TRIGGER IF EXISTS trg_notify_mission_accepted ON missions CASCADE;
DROP TRIGGER IF EXISTS trigger_mission_accepted_notification ON missions CASCADE;
DROP TRIGGER IF EXISTS trigger_notify_client_on_acceptance ON missions CASCADE;
DROP FUNCTION IF EXISTS notify_client_on_mission_accepted() CASCADE;
DROP FUNCTION IF EXISTS notify_client_on_mission_acceptance() CASCADE;

-- 2️⃣ Correction colonne is_read (si nécessaire)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'read'
    ) THEN
        ALTER TABLE notifications RENAME COLUMN "read" TO is_read;
    END IF;
END $$;

-- 3️⃣ Fonction de notification
CREATE OR REPLACE FUNCTION notify_client_on_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
    v_artisan_name text;
BEGIN
    IF NEW.status = 'accepted' AND NEW.artisan_id IS NOT NULL 
       AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        
        SELECT u.name INTO v_artisan_name FROM users u WHERE u.id = NEW.artisan_id;
        
        INSERT INTO notifications (user_id, type, title, message, mission_id, is_read, created_at)
        VALUES (
            NEW.client_id,
            'mission_accepted',
            'Mission acceptée !',
            COALESCE(v_artisan_name, 'Un artisan') || ' a accepté votre mission "' || NEW.title || '"',
            NEW.id,
            false,
            NOW()
        );
        
        RAISE NOTICE '✅ Notification créée pour client %', NEW.client_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4️⃣ Trigger
CREATE TRIGGER trg_notify_mission_accepted
    AFTER UPDATE ON missions
    FOR EACH ROW
    EXECUTE FUNCTION notify_client_on_mission_accepted();

-- 5️⃣ Realtime
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS missions;
ALTER PUBLICATION supabase_realtime ADD TABLE missions;

-- 6️⃣ Confirmation
DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '✅ INSTALLATION TERMINÉE !';
    RAISE NOTICE '';
    RAISE NOTICE 'Test:';
    RAISE NOTICE '1. Acceptez une mission (compte ARTISAN)';
    RAISE NOTICE '2. Vérifiez la notification (compte CLIENT)';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- ═══════════════════════════════════════════════════════════════
-- ✅ C'EST TOUT ! Testez maintenant en acceptant une mission
-- ═══════════════════════════════════════════════════════════════
