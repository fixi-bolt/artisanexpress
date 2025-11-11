-- ═══════════════════════════════════════════════════════════════
-- 🔧 CORRECTION FINALE - NOTIFICATIONS LORS DE L'ACCEPTATION
-- ═══════════════════════════════════════════════════════════════
-- Ce script corrige le système de notifications pour que le client
-- reçoive bien une notification quand un artisan accepte sa mission
-- ═══════════════════════════════════════════════════════════════

-- 1️⃣ CORRECTION DE LA TABLE NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════

-- Renommer 'read' en 'is_read' si nécessaire
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'read'
    ) THEN
        ALTER TABLE notifications RENAME COLUMN "read" TO is_read;
        RAISE NOTICE '✅ Colonne "read" renommée en "is_read"';
    ELSE
        RAISE NOTICE '✅ Colonne "is_read" existe déjà';
    END IF;
END $$;

-- 2️⃣ SUPPRESSION DES ANCIENS TRIGGERS ET FONCTIONS
-- ═══════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_notify_mission_accepted ON missions CASCADE;
DROP TRIGGER IF EXISTS trigger_mission_accepted_notification ON missions CASCADE;
DROP TRIGGER IF EXISTS trigger_notify_client_on_acceptance ON missions CASCADE;

DROP FUNCTION IF EXISTS notify_client_on_mission_accepted() CASCADE;
DROP FUNCTION IF EXISTS notify_client_on_mission_acceptance() CASCADE;

-- 3️⃣ CRÉATION DE LA FONCTION CORRIGÉE
-- ═══════════════════════════════════════════════════════════════
-- CORRECTION IMPORTANTE: clients.id = user_id directement
-- Il n'y a PAS de colonne user_id dans la table clients

CREATE OR REPLACE FUNCTION notify_client_on_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
    v_artisan_name text;
BEGIN
    -- Vérifier que le statut passe à 'accepted' ET qu'un artisan est assigné
    IF NEW.status = 'accepted' AND NEW.artisan_id IS NOT NULL 
       AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        
        -- Récupérer le nom de l'artisan (pour le message)
        SELECT u.name INTO v_artisan_name
        FROM users u
        WHERE u.id = NEW.artisan_id;
        
        -- Créer la notification pour le client
        -- IMPORTANT: client_id dans missions EST DÉJÀ le user_id du client
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            mission_id,
            is_read,
            created_at
        ) VALUES (
            NEW.client_id,  -- client_id est déjà le user_id
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

-- 4️⃣ CRÉATION DU TRIGGER
-- ═══════════════════════════════════════════════════════════════

CREATE TRIGGER trg_notify_mission_accepted
    AFTER UPDATE ON missions
    FOR EACH ROW
    EXECUTE FUNCTION notify_client_on_mission_accepted();

-- 5️⃣ CONFIGURATION REALTIME
-- ═══════════════════════════════════════════════════════════════

-- S'assurer que Realtime est activé pour les notifications
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- S'assurer que Realtime est activé pour les missions
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS missions;
ALTER PUBLICATION supabase_realtime ADD TABLE missions;

-- 6️⃣ VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════

DO $$ 
DECLARE
    v_trigger_exists boolean;
    v_function_exists boolean;
    v_column_correct boolean;
    v_realtime_active boolean;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '✅ VÉRIFICATION DE L''INSTALLATION';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
    
    -- Vérifier le trigger
    SELECT EXISTS (
        SELECT 1 
        FROM pg_trigger 
        WHERE tgname = 'trg_notify_mission_accepted'
    ) INTO v_trigger_exists;
    
    IF v_trigger_exists THEN
        RAISE NOTICE '✓ Trigger "trg_notify_mission_accepted" existe';
    ELSE
        RAISE NOTICE '✗ Trigger "trg_notify_mission_accepted" MANQUANT';
    END IF;
    
    -- Vérifier la fonction
    SELECT EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'notify_client_on_mission_accepted'
    ) INTO v_function_exists;
    
    IF v_function_exists THEN
        RAISE NOTICE '✓ Fonction "notify_client_on_mission_accepted" existe';
    ELSE
        RAISE NOTICE '✗ Fonction "notify_client_on_mission_accepted" MANQUANTE';
    END IF;
    
    -- Vérifier la colonne is_read
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'is_read'
    ) INTO v_column_correct;
    
    IF v_column_correct THEN
        RAISE NOTICE '✓ Colonne "notifications.is_read" existe';
    ELSE
        RAISE NOTICE '✗ Colonne "notifications.is_read" MANQUANTE';
    END IF;
    
    -- Vérifier Realtime
    SELECT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notifications'
    ) INTO v_realtime_active;
    
    IF v_realtime_active THEN
        RAISE NOTICE '✓ Realtime activé pour "notifications"';
    ELSE
        RAISE NOTICE '✗ Realtime NON activé pour "notifications"';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    
    IF v_trigger_exists AND v_function_exists AND v_column_correct AND v_realtime_active THEN
        RAISE NOTICE '✅ INSTALLATION RÉUSSIE !';
        RAISE NOTICE '';
        RAISE NOTICE 'Test: Acceptez une mission, le client devrait recevoir une notification.';
    ELSE
        RAISE NOTICE '⚠️  INSTALLATION INCOMPLÈTE';
    END IF;
    
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 🎉 SCRIPT TERMINÉ !
-- ═══════════════════════════════════════════════════════════════
-- Copiez-collez ce script COMPLET dans l'éditeur SQL de Supabase
-- Puis testez en acceptant une mission depuis un compte artisan
-- ═══════════════════════════════════════════════════════════════
