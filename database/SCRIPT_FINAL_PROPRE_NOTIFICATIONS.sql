-- ═══════════════════════════════════════════════════════════════════
-- 🎯 SCRIPT FINAL - CORRECTIONS NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════════
-- À copier-coller dans Supabase SQL Editor
-- Ce script corrige tous les problèmes identifiés

BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- 1️⃣ NETTOYAGE DES ANCIENS TRIGGERS
-- ═══════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trigger_mission_accepted_notification ON missions;
DROP TRIGGER IF EXISTS trigger_notify_nearby_artisans ON missions;
DROP FUNCTION IF EXISTS notify_client_mission_accepted() CASCADE;
DROP FUNCTION IF EXISTS notify_nearby_artisans_on_mission_create() CASCADE;

-- ═══════════════════════════════════════════════════════════════════
-- 2️⃣ VÉRIFIER ET CORRIGER LA COLONNE IS_READ
-- ═══════════════════════════════════════════════════════════════════

DO $$
BEGIN
    -- Vérifier si la colonne 'read' existe et la renommer en 'is_read'
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'read'
    ) THEN
        ALTER TABLE notifications RENAME COLUMN "read" TO is_read;
        RAISE NOTICE '✅ Colonne "read" renommée en "is_read"';
    END IF;

    -- Créer la colonne is_read si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'is_read'
    ) THEN
        ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Colonne "is_read" créée';
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- 3️⃣ FONCTION : NOTIFIER LE CLIENT QUAND MISSION ACCEPTÉE
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION notify_client_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
    v_client_user_id uuid;
    v_artisan_name text;
BEGIN
    -- Vérifier que le statut est passé à 'accepted'
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        
        -- Récupérer l'user_id du client via la table clients
        SELECT c.user_id INTO v_client_user_id
        FROM clients c
        WHERE c.id = NEW.client_id;
        
        -- Récupérer le nom de l'artisan
        SELECT a.name INTO v_artisan_name
        FROM artisans a
        WHERE a.id = NEW.artisan_id;
        
        -- Si on a trouvé le client, créer la notification
        IF v_client_user_id IS NOT NULL THEN
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                mission_id,
                is_read,
                created_at
            ) VALUES (
                v_client_user_id,
                'mission_accepted',
                'Mission acceptée ! 🎉',
                COALESCE(v_artisan_name, 'Un artisan') || ' a accepté votre mission "' || NEW.title || '"',
                NEW.id,
                false,
                NOW()
            );
            
            RAISE NOTICE '✅ Notification envoyée au client % pour mission %', v_client_user_id, NEW.id;
        ELSE
            RAISE NOTICE '⚠️ Client user_id non trouvé pour client_id %', NEW.client_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════
-- 4️⃣ FONCTION : NOTIFIER LES ARTISANS PROCHES QUAND MISSION CRÉÉE
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION notify_nearby_artisans_on_mission_create()
RETURNS TRIGGER AS $$
DECLARE
    v_artisan RECORD;
    v_max_distance_km numeric := 50;
BEGIN
    -- Vérifier que c'est une nouvelle mission 'pending'
    IF NEW.status = 'pending' AND NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        
        -- Trouver les artisans proches et disponibles
        FOR v_artisan IN (
            SELECT 
                a.user_id,
                a.name,
                calculate_distance(
                    NEW.latitude, NEW.longitude,
                    a.latitude, a.longitude
                ) as distance_km
            FROM artisans a
            WHERE a.specialty = NEW.category
            AND a.is_available = true
            AND a.latitude IS NOT NULL
            AND a.longitude IS NOT NULL
            AND calculate_distance(
                NEW.latitude, NEW.longitude,
                a.latitude, a.longitude
            ) <= v_max_distance_km
            ORDER BY distance_km ASC
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
                v_artisan.user_id,
                'mission_request',
                'Nouvelle mission à proximité 📍',
                'Mission "' || NEW.title || '" à ' || ROUND(v_artisan.distance_km, 1) || ' km de vous',
                NEW.id,
                false,
                NOW()
            );
            
            RAISE NOTICE '✅ Notification envoyée à l''artisan % (distance: % km)', v_artisan.user_id, ROUND(v_artisan.distance_km, 1);
        END LOOP;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════
-- 5️⃣ CRÉER LES TRIGGERS
-- ═══════════════════════════════════════════════════════════════════

CREATE TRIGGER trigger_mission_accepted_notification
    AFTER UPDATE ON missions
    FOR EACH ROW
    WHEN (NEW.status = 'accepted')
    EXECUTE FUNCTION notify_client_mission_accepted();

CREATE TRIGGER trigger_notify_nearby_artisans
    AFTER INSERT ON missions
    FOR EACH ROW
    WHEN (NEW.status = 'pending')
    EXECUTE FUNCTION notify_nearby_artisans_on_mission_create();

-- ═══════════════════════════════════════════════════════════════════
-- 6️⃣ VÉRIFIER QUE LA FONCTION CALCULATE_DISTANCE EXISTE
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 double precision,
    lon1 double precision,
    lat2 double precision,
    lon2 double precision
) RETURNS double precision AS $$
DECLARE
    R double precision := 6371; -- Rayon de la Terre en km
    dLat double precision;
    dLon double precision;
    a double precision;
    c double precision;
BEGIN
    -- Convertir les degrés en radians
    dLat := radians(lat2 - lat1);
    dLon := radians(lon2 - lon1);
    
    -- Formule de Haversine
    a := sin(dLat/2) * sin(dLat/2) +
         cos(radians(lat1)) * cos(radians(lat2)) *
         sin(dLon/2) * sin(dLon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ═══════════════════════════════════════════════════════════════════
-- 7️⃣ ACTIVER REALTIME SUR LA TABLE NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- ✅ SCRIPT TERMINÉ
-- ═══════════════════════════════════════════════════════════════════

SELECT '✅ Configuration terminée avec succès!' as status;

-- Vérifier que tout est en place
SELECT 
    '📋 Triggers créés:' as info,
    COUNT(*) as count
FROM pg_trigger
WHERE tgname IN ('trigger_mission_accepted_notification', 'trigger_notify_nearby_artisans');

SELECT 
    '📬 Colonne is_read existe:' as info,
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'is_read'
    ) as existe;
