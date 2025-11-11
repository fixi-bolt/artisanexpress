-- ═══════════════════════════════════════════════════════════════
-- 🎯 SCRIPT FINAL PROPRE - NOTIFICATIONS ET REALTIME
-- ═══════════════════════════════════════════════════════════════
-- À copier-coller dans l'éditeur SQL de Supabase
-- ═══════════════════════════════════════════════════════════════

-- 1️⃣ SUPPRIMER LES ANCIENS TRIGGERS (pour éviter les doublons)
-- ─────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trigger_mission_accepted_notification ON missions;
DROP TRIGGER IF EXISTS trigger_notify_nearby_artisans ON missions;
DROP FUNCTION IF EXISTS notify_mission_accepted() CASCADE;
DROP FUNCTION IF EXISTS notify_nearby_artisans_on_mission_create() CASCADE;

-- 2️⃣ VÉRIFIER ET CONFIGURER LA COLONNE is_read
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
    -- Vérifier si la colonne 'is_read' existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'is_read'
    ) THEN
        -- Si 'read' existe, la renommer
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'notifications' AND column_name = 'read'
        ) THEN
            ALTER TABLE notifications RENAME COLUMN "read" TO is_read;
            RAISE NOTICE '✅ Colonne "read" renommée en "is_read"';
        ELSE
            -- Sinon, créer la colonne
            ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
            RAISE NOTICE '✅ Colonne "is_read" créée';
        END IF;
    END IF;
END $$;

-- 3️⃣ CONFIGURER LA PUBLICATION REALTIME (avec vérification)
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
    -- Retirer d'abord de toutes les publications existantes
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE notifications;
        RAISE NOTICE '🔄 Table notifications retirée de la publication';
    END IF;
    
    -- Ajouter à la publication
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    RAISE NOTICE '✅ Table notifications ajoutée à la publication realtime';
    
    -- Faire de même pour missions
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'missions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE missions;
        RAISE NOTICE '✅ Table missions ajoutée à la publication realtime';
    END IF;
END $$;

-- 4️⃣ ACTIVER REPLICA IDENTITY
-- ─────────────────────────────────────────────────────────────
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE missions REPLICA IDENTITY FULL;

-- 5️⃣ CRÉER LA FONCTION DE NOTIFICATION POUR ACCEPTATION DE MISSION
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
    v_client_id UUID;
    v_mission_title TEXT;
    v_artisan_name TEXT;
BEGIN
    -- Vérifier que la mission passe à 'accepted' et qu'un artisan est assigné
    IF NEW.status = 'accepted' AND NEW.artisan_id IS NOT NULL 
       AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        
        -- Récupérer les infos nécessaires
        SELECT m.client_id, m.title INTO v_client_id, v_mission_title
        FROM missions m
        WHERE m.id = NEW.id;
        
        -- Récupérer le nom de l'artisan
        SELECT a.name INTO v_artisan_name
        FROM artisans a
        WHERE a.id = NEW.artisan_id;
        
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
            v_client_id,
            'mission_accepted',
            'Mission acceptée',
            'Votre mission "' || v_mission_title || '" a été acceptée par ' || COALESCE(v_artisan_name, 'un artisan'),
            NEW.id,
            false,
            NOW()
        );
        
        RAISE NOTICE '✅ Notification créée pour le client % (mission %)', v_client_id, NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6️⃣ CRÉER LE TRIGGER POUR LES ACCEPTATIONS DE MISSION
-- ─────────────────────────────────────────────────────────────
CREATE TRIGGER trigger_mission_accepted_notification
    AFTER UPDATE ON missions
    FOR EACH ROW
    WHEN (NEW.status = 'accepted' AND NEW.artisan_id IS NOT NULL)
    EXECUTE FUNCTION notify_mission_accepted();

-- 7️⃣ CRÉER LA FONCTION DE NOTIFICATION POUR NOUVELLES MISSIONS
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_nearby_artisans_on_mission_create()
RETURNS TRIGGER AS $$
DECLARE
    v_artisan RECORD;
BEGIN
    -- Notifier les artisans à proximité (dans un rayon de 50km)
    FOR v_artisan IN (
        SELECT 
            a.user_id as id,
            a.name,
            calculate_distance(
                a.latitude, a.longitude,
                NEW.latitude, NEW.longitude
            ) as distance_km
        FROM artisans a
        WHERE a.specialty = NEW.category
        AND a.is_available = true
        AND a.latitude IS NOT NULL
        AND a.longitude IS NOT NULL
        AND calculate_distance(
            a.latitude, a.longitude,
            NEW.latitude, NEW.longitude
        ) <= 50
        ORDER BY distance_km
        LIMIT 20
    ) LOOP
        -- Créer une notification pour chaque artisan
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            mission_id,
            is_read,
            created_at
        ) VALUES (
            v_artisan.id,
            'mission_request',
            'Nouvelle mission à proximité',
            'Mission "' || NEW.title || '" à ' || ROUND(v_artisan.distance_km, 1) || ' km de vous',
            NEW.id,
            false,
            NOW()
        );
        
        RAISE NOTICE '✅ Notification créée pour artisan % (distance: % km)', v_artisan.id, v_artisan.distance_km;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8️⃣ CRÉER LE TRIGGER POUR LES NOUVELLES MISSIONS
-- ─────────────────────────────────────────────────────────────
CREATE TRIGGER trigger_notify_nearby_artisans
    AFTER INSERT ON missions
    FOR EACH ROW
    WHEN (NEW.status = 'pending')
    EXECUTE FUNCTION notify_nearby_artisans_on_mission_create();

-- 9️⃣ VÉRIFIER QUE LA FONCTION calculate_distance EXISTE
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DOUBLE PRECISION,
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    earth_radius CONSTANT DOUBLE PRECISION := 6371.0;
    dlat DOUBLE PRECISION;
    dlon DOUBLE PRECISION;
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
BEGIN
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;

    dlat := radians(lat2 - lat1);
    dlon := radians(lon2 - lon1);
    
    a := sin(dlat/2) * sin(dlat/2) + 
         cos(radians(lat1)) * cos(radians(lat2)) * 
         sin(dlon/2) * sin(dlon/2);
    
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 🔟 RÉSUMÉ DE LA CONFIGURATION
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
    v_triggers_count INTEGER;
    v_realtime_tables TEXT[];
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '══════════════════════════════════════════════════════';
    RAISE NOTICE '✅ CONFIGURATION TERMINÉE';
    RAISE NOTICE '══════════════════════════════════════════════════════';
    RAISE NOTICE '';
    
    -- Compter les triggers
    SELECT COUNT(*) INTO v_triggers_count
    FROM pg_trigger
    WHERE tgname IN ('trigger_mission_accepted_notification', 'trigger_notify_nearby_artisans');
    
    RAISE NOTICE '📋 Triggers créés: %', v_triggers_count;
    
    -- Lister les tables en realtime
    SELECT array_agg(tablename) INTO v_realtime_tables
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename IN ('missions', 'notifications');
    
    RAISE NOTICE '🔔 Tables en realtime: %', v_realtime_tables;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Vous pouvez maintenant tester l''application';
    RAISE NOTICE '';
END $$;
