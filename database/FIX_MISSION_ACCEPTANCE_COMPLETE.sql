-- ═══════════════════════════════════════════════════════════════
-- 🔧 CORRECTION COMPLÈTE - ACCEPTATION MISSION
-- ═══════════════════════════════════════════════════════════════
-- Ce script diagnostique et corrige le système de notifications
-- pour que le client reçoive une notification quand un artisan
-- accepte sa mission
-- ═══════════════════════════════════════════════════════════════

-- 📊 SECTION 1: DIAGNOSTIC INITIAL
-- ═══════════════════════════════════════════════════════════════

DO $$ 
DECLARE
    v_trigger_count int;
    v_function_count int;
    v_realtime_notif boolean;
    v_realtime_missions boolean;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '📊 DIAGNOSTIC INITIAL';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
    
    -- Compter les triggers existants
    SELECT COUNT(*) INTO v_trigger_count
    FROM pg_trigger 
    WHERE tgname LIKE '%notify%mission%accept%';
    
    RAISE NOTICE '📌 Nombre de triggers existants: %', v_trigger_count;
    
    -- Compter les fonctions existantes
    SELECT COUNT(*) INTO v_function_count
    FROM pg_proc 
    WHERE proname LIKE '%notify%client%mission%';
    
    RAISE NOTICE '📌 Nombre de fonctions existantes: %', v_function_count;
    
    -- Vérifier Realtime
    SELECT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notifications'
    ) INTO v_realtime_notif;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'missions'
    ) INTO v_realtime_missions;
    
    RAISE NOTICE '📌 Realtime notifications: %', CASE WHEN v_realtime_notif THEN 'ACTIVÉ' ELSE 'DÉSACTIVÉ' END;
    RAISE NOTICE '📌 Realtime missions: %', CASE WHEN v_realtime_missions THEN 'ACTIVÉ' ELSE 'DÉSACTIVÉ' END;
    
    RAISE NOTICE '';
END $$;

-- 🧹 SECTION 2: NETTOYAGE COMPLET
-- ═══════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '🧹 NETTOYAGE DES ANCIENS TRIGGERS';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- Supprimer TOUS les triggers liés aux notifications d'acceptation
DROP TRIGGER IF EXISTS trg_notify_mission_accepted ON missions CASCADE;
DROP TRIGGER IF EXISTS trigger_mission_accepted_notification ON missions CASCADE;
DROP TRIGGER IF EXISTS trigger_notify_client_on_acceptance ON missions CASCADE;
DROP TRIGGER IF EXISTS notify_mission_accepted_trigger ON missions CASCADE;

-- Supprimer TOUTES les fonctions liées
DROP FUNCTION IF EXISTS notify_client_on_mission_accepted() CASCADE;
DROP FUNCTION IF EXISTS notify_client_on_mission_acceptance() CASCADE;
DROP FUNCTION IF EXISTS notify_mission_accepted() CASCADE;

DO $$
BEGIN
    RAISE NOTICE '✅ Nettoyage terminé';
    RAISE NOTICE '';
END $$;

-- 🔧 SECTION 3: CORRECTION DE LA COLONNE is_read
-- ═══════════════════════════════════════════════════════════════

DO $$ 
BEGIN
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '🔧 VÉRIFICATION COLONNE is_read';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
    
    -- Vérifier si la colonne 'read' existe encore
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
    
    RAISE NOTICE '';
END $$;

-- ⚙️ SECTION 4: CRÉATION DE LA FONCTION CORRIGÉE
-- ═══════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '⚙️  CRÉATION DE LA FONCTION TRIGGER';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

CREATE OR REPLACE FUNCTION notify_client_on_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
    v_artisan_name text;
    v_notification_id uuid;
BEGIN
    -- Vérifier que le statut passe à 'accepted' ET qu'un artisan est assigné
    IF NEW.status = 'accepted' AND NEW.artisan_id IS NOT NULL 
       AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        
        RAISE NOTICE '🎯 Trigger activé: Mission % acceptée par artisan %', NEW.id, NEW.artisan_id;
        
        -- Récupérer le nom de l'artisan
        SELECT u.name INTO v_artisan_name
        FROM users u
        WHERE u.id = NEW.artisan_id;
        
        RAISE NOTICE '📝 Nom artisan: %', COALESCE(v_artisan_name, 'Non trouvé');
        
        -- Créer la notification pour le client
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
            COALESCE(v_artisan_name, 'Un artisan') || ' a accepté votre mission "' || NEW.title || '" et arrive dans ' || COALESCE(NEW.eta::text, '15') || ' min',
            NEW.id,
            false,
            NOW()
        ) RETURNING id INTO v_notification_id;
        
        RAISE NOTICE '✅ Notification créée: %', v_notification_id;
        RAISE NOTICE '✅ Client ID: %', NEW.client_id;
        RAISE NOTICE '✅ Mission ID: %', NEW.id;
        RAISE NOTICE '';
    ELSE
        RAISE NOTICE '⏭️  Trigger ignoré (conditions non remplies)';
        RAISE NOTICE '   - Status: % → %', OLD.status, NEW.status;
        RAISE NOTICE '   - Artisan ID: %', NEW.artisan_id;
        RAISE NOTICE '';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    RAISE NOTICE '✅ Fonction créée avec succès';
    RAISE NOTICE '';
END $$;

-- 🔗 SECTION 5: CRÉATION DU TRIGGER
-- ═══════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '🔗 CRÉATION DU TRIGGER';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

CREATE TRIGGER trg_notify_mission_accepted
    AFTER UPDATE ON missions
    FOR EACH ROW
    EXECUTE FUNCTION notify_client_on_mission_accepted();

DO $$
BEGIN
    RAISE NOTICE '✅ Trigger créé avec succès';
    RAISE NOTICE '';
END $$;

-- 📡 SECTION 6: CONFIGURATION REALTIME
-- ═══════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '📡 CONFIGURATION REALTIME';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- Réinitialiser la publication Realtime pour notifications
DO $$ 
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS notifications;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    RAISE NOTICE '✅ Realtime activé pour notifications';
END $$;

-- Réinitialiser la publication Realtime pour missions
DO $$ 
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS missions;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    ALTER PUBLICATION supabase_realtime ADD TABLE missions;
    RAISE NOTICE '✅ Realtime activé pour missions';
    RAISE NOTICE '';
END $$;

-- 🔍 SECTION 7: VÉRIFICATION FINALE
-- ═══════════════════════════════════════════════════════════════

DO $$ 
DECLARE
    v_trigger_exists boolean;
    v_function_exists boolean;
    v_column_correct boolean;
    v_realtime_notif boolean;
    v_realtime_missions boolean;
    v_all_ok boolean;
BEGIN
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '🔍 VÉRIFICATION FINALE';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
    
    -- Vérifier le trigger
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trg_notify_mission_accepted'
    ) INTO v_trigger_exists;
    
    IF v_trigger_exists THEN
        RAISE NOTICE '✓ Trigger "trg_notify_mission_accepted" existe';
    ELSE
        RAISE NOTICE '✗ Trigger "trg_notify_mission_accepted" MANQUANT !';
    END IF;
    
    -- Vérifier la fonction
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'notify_client_on_mission_accepted'
    ) INTO v_function_exists;
    
    IF v_function_exists THEN
        RAISE NOTICE '✓ Fonction "notify_client_on_mission_accepted" existe';
    ELSE
        RAISE NOTICE '✗ Fonction "notify_client_on_mission_accepted" MANQUANTE !';
    END IF;
    
    -- Vérifier la colonne is_read
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'is_read'
    ) INTO v_column_correct;
    
    IF v_column_correct THEN
        RAISE NOTICE '✓ Colonne "notifications.is_read" existe';
    ELSE
        RAISE NOTICE '✗ Colonne "notifications.is_read" MANQUANTE !';
    END IF;
    
    -- Vérifier Realtime notifications
    SELECT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notifications'
    ) INTO v_realtime_notif;
    
    IF v_realtime_notif THEN
        RAISE NOTICE '✓ Realtime activé pour "notifications"';
    ELSE
        RAISE NOTICE '✗ Realtime NON activé pour "notifications" !';
    END IF;
    
    -- Vérifier Realtime missions
    SELECT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'missions'
    ) INTO v_realtime_missions;
    
    IF v_realtime_missions THEN
        RAISE NOTICE '✓ Realtime activé pour "missions"';
    ELSE
        RAISE NOTICE '✗ Realtime NON activé pour "missions" !';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    
    v_all_ok := v_trigger_exists AND v_function_exists AND v_column_correct AND v_realtime_notif AND v_realtime_missions;
    
    IF v_all_ok THEN
        RAISE NOTICE '✅ INSTALLATION RÉUSSIE !';
        RAISE NOTICE '';
        RAISE NOTICE '📋 Configuration complète:';
        RAISE NOTICE '   1. ✅ Trigger SQL actif';
        RAISE NOTICE '   2. ✅ Fonction de notification opérationnelle';
        RAISE NOTICE '   3. ✅ Colonne is_read correcte';
        RAISE NOTICE '   4. ✅ Realtime activé pour notifications';
        RAISE NOTICE '   5. ✅ Realtime activé pour missions';
        RAISE NOTICE '';
        RAISE NOTICE '🧪 TEST:';
        RAISE NOTICE '   1. Créez une mission en tant que CLIENT';
        RAISE NOTICE '   2. Acceptez-la en tant qu''ARTISAN';
        RAISE NOTICE '   3. Vérifiez que le CLIENT reçoit la notification';
        RAISE NOTICE '';
        RAISE NOTICE '📝 Logs à vérifier dans la console:';
        RAISE NOTICE '   - Côté ARTISAN: "✅ Mission accepted successfully"';
        RAISE NOTICE '   - Côté CLIENT: "🔔 Realtime: New notification received!"';
    ELSE
        RAISE NOTICE '⚠️  INSTALLATION INCOMPLÈTE !';
        RAISE NOTICE '';
        RAISE NOTICE 'Certaines vérifications ont échoué.';
        RAISE NOTICE 'Relancez ce script ou contactez le support.';
    END IF;
    
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 🎉 SCRIPT TERMINÉ !
-- ═══════════════════════════════════════════════════════════════
-- Copiez-collez ce script COMPLET dans l'éditeur SQL de Supabase
-- et exécutez-le pour corriger le problème d'acceptation de mission
-- ═══════════════════════════════════════════════════════════════
