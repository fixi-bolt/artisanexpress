-- ============================================
-- FIX ACCEPTATION MISSION - SCRIPT CORRIGÉ
-- Copier-coller ce script dans Supabase SQL Editor
-- ============================================

-- 1. Nettoyer les anciennes publications realtime
DO $$
BEGIN
    -- Retirer la table notifications de la publication si elle y est
    BEGIN
        ALTER PUBLICATION supabase_realtime DROP TABLE notifications;
    EXCEPTION
        WHEN undefined_object THEN NULL;
        WHEN others THEN NULL;
    END;
END $$;

-- 2. Recréer la publication realtime correctement
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 3. Activer realtime sur la table notifications
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- 4. Vérifier que les colonnes existent
DO $$
BEGIN
    -- Ajouter is_read si elle n'existe pas
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'is_read') THEN
        ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 5. Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS notify_mission_status_change ON missions;
DROP FUNCTION IF EXISTS notify_mission_status_change() CASCADE;

-- 6. Créer la fonction de notification
CREATE OR REPLACE FUNCTION notify_mission_status_change()
RETURNS TRIGGER AS $$
DECLARE
    client_id UUID;
    artisan_name TEXT;
    mission_title TEXT;
BEGIN
    -- Uniquement si le statut passe à 'accepted'
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        
        -- Récupérer les infos nécessaires
        SELECT NEW.client_id, NEW.title INTO client_id, mission_title;
        
        -- Récupérer le nom de l'artisan
        SELECT COALESCE(full_name, email) 
        INTO artisan_name
        FROM user_profiles 
        WHERE user_id = NEW.artisan_id;
        
        -- Créer la notification pour le client
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            related_mission_id,
            is_read,
            created_at
        ) VALUES (
            client_id,
            'Mission acceptée',
            artisan_name || ' a accepté votre mission "' || mission_title || '"',
            'mission_accepted',
            NEW.id,
            FALSE,
            NOW()
        );
        
        RAISE NOTICE 'Notification créée pour client % - Mission %', client_id, NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Créer le trigger
CREATE TRIGGER notify_mission_status_change
    AFTER UPDATE OF status ON missions
    FOR EACH ROW
    EXECUTE FUNCTION notify_mission_status_change();

-- 8. Vérification finale
DO $$
DECLARE
    pub_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Vérifier la publication
    SELECT COUNT(*) INTO pub_count
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notifications';
    
    -- Vérifier le trigger
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname = 'notify_mission_status_change';
    
    RAISE NOTICE 'Publication realtime: % table(s)', pub_count;
    RAISE NOTICE 'Trigger configuré: %', trigger_count;
    
    IF pub_count = 0 THEN
        RAISE WARNING 'La table notifications n''est pas dans la publication realtime!';
    END IF;
    
    IF trigger_count = 0 THEN
        RAISE WARNING 'Le trigger notify_mission_status_change n''est pas configuré!';
    END IF;
END $$;

-- Succès!
SELECT 'Configuration des notifications terminée avec succès!' as status;
