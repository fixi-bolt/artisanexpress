-- ═══════════════════════════════════════════════════════════════
-- 🔧 CORRECTION FINALE - NOTIFICATIONS ACCEPTATION MISSION
-- ═══════════════════════════════════════════════════════════════
-- Ce script corrige le système de notifications pour l'acceptation
-- Il supprime les doublons et configure correctement le trigger SQL
-- ═══════════════════════════════════════════════════════════════

-- 1️⃣ NETTOYAGE - Suppression des anciens triggers
-- ═══════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_notify_mission_accepted ON missions CASCADE;
DROP TRIGGER IF EXISTS trigger_mission_accepted_notification ON missions CASCADE;
DROP TRIGGER IF EXISTS trigger_notify_client_on_acceptance ON missions CASCADE;

DROP FUNCTION IF EXISTS notify_client_on_mission_accepted() CASCADE;
DROP FUNCTION IF EXISTS notify_client_on_mission_acceptance() CASCADE;

-- 2️⃣ CRÉATION DE LA FONCTION TRIGGER CORRIGÉE
-- ═══════════════════════════════════════════════════════════════
-- Cette fonction crée UNE SEULE notification pour le client
-- quand un artisan accepte la mission

CREATE OR REPLACE FUNCTION notify_client_on_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
    v_artisan_name text;
BEGIN
    -- Vérifie que le statut passe à 'accepted' ET qu'un artisan est assigné
    IF NEW.status = 'accepted' AND NEW.artisan_id IS NOT NULL 
       AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        
        -- Récupère le nom de l'artisan
        SELECT u.name INTO v_artisan_name
        FROM users u
        WHERE u.id = NEW.artisan_id;
        
        -- Crée UNE SEULE notification pour le client
        -- client_id dans missions EST le user_id du client
        INSERT INTO notifications (
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
            COALESCE(v_artisan_name, 'Un artisan') || ' a accepté votre mission "' || NEW.title || '"',
            NEW.id,
            false,
            NOW()
        );
        
        RAISE NOTICE '✅ Notification créée pour client % - Mission % acceptée par artisan %', 
                     NEW.client_id, NEW.id, NEW.artisan_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3️⃣ CRÉATION DU TRIGGER
-- ═══════════════════════════════════════════════════════════════

CREATE TRIGGER trg_notify_mission_accepted
    AFTER UPDATE ON missions
    FOR EACH ROW
    EXECUTE FUNCTION notify_client_on_mission_accepted();

-- 4️⃣ CONFIGURATION REALTIME
-- ═══════════════════════════════════════════════════════════════

-- Active Realtime pour les notifications
DO $$ 
BEGIN
    -- Supprime et rajoute la table pour forcer le refresh
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS notifications;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    RAISE NOTICE '✅ Realtime activé pour notifications';
END $$;

-- Active Realtime pour les missions
DO $$ 
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS missions;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    ALTER PUBLICATION supabase_realtime ADD TABLE missions;
    RAISE NOTICE '✅ Realtime activé pour missions';
END $$;

-- 5️⃣ VÉRIFICATION FINALE
-- ═══════════════════════════════════════════════════════════════

DO $$ 
DECLARE
    v_trigger_exists boolean;
    v_function_exists boolean;
    v_realtime_notif boolean;
    v_realtime_missions boolean;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '✅ VÉRIFICATION DE L''INSTALLATION';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
    
    -- Vérifie le trigger
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trg_notify_mission_accepted'
    ) INTO v_trigger_exists;
    
    IF v_trigger_exists THEN
        RAISE NOTICE '✓ Trigger "trg_notify_mission_accepted" existe';
    ELSE
        RAISE NOTICE '✗ Trigger "trg_notify_mission_accepted" MANQUANT';
    END IF;
    
    -- Vérifie la fonction
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'notify_client_on_mission_accepted'
    ) INTO v_function_exists;
    
    IF v_function_exists THEN
        RAISE NOTICE '✓ Fonction "notify_client_on_mission_accepted" existe';
    ELSE
        RAISE NOTICE '✗ Fonction "notify_client_on_mission_accepted" MANQUANTE';
    END IF;
    
    -- Vérifie Realtime notifications
    SELECT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notifications'
    ) INTO v_realtime_notif;
    
    IF v_realtime_notif THEN
        RAISE NOTICE '✓ Realtime activé pour "notifications"';
    ELSE
        RAISE NOTICE '✗ Realtime NON activé pour "notifications"';
    END IF;
    
    -- Vérifie Realtime missions
    SELECT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'missions'
    ) INTO v_realtime_missions;
    
    IF v_realtime_missions THEN
        RAISE NOTICE '✓ Realtime activé pour "missions"';
    ELSE
        RAISE NOTICE '✗ Realtime NON activé pour "missions"';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    
    IF v_trigger_exists AND v_function_exists AND v_realtime_notif AND v_realtime_missions THEN
        RAISE NOTICE '✅ INSTALLATION RÉUSSIE !';
        RAISE NOTICE '';
        RAISE NOTICE '📋 Résumé des corrections:';
        RAISE NOTICE '  1. Dashboard: attend la fin de acceptMission';
        RAISE NOTICE '  2. MissionContext: suppression du doublon de notification';
        RAISE NOTICE '  3. Trigger SQL: crée UNE SEULE notification';
        RAISE NOTICE '  4. Realtime: activé pour notifications et missions';
        RAISE NOTICE '';
        RAISE NOTICE '🧪 Test: Acceptez une mission depuis le dashboard artisan';
        RAISE NOTICE '   → Le client devrait recevoir UNE notification';
    ELSE
        RAISE NOTICE '⚠️  INSTALLATION INCOMPLÈTE';
    END IF;
    
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 🎉 CORRECTIONS TERMINÉES !
-- ═══════════════════════════════════════════════════════════════
