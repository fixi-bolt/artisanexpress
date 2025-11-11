-- ═══════════════════════════════════════════════════════════════
-- 🔧 SCRIPT FINAL COMPLET - CORRECTIONS NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════
-- Copiez-collez ce script ENTIER dans l'éditeur SQL de Supabase
-- ═══════════════════════════════════════════════════════════════

-- 1️⃣ SUPPRESSION PROPRE (triggers d'abord, puis fonctions)
-- ═══════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_notify_mission_accepted ON missions CASCADE;
DROP TRIGGER IF EXISTS trigger_mission_accepted_notification ON missions CASCADE;
DROP TRIGGER IF EXISTS trg_notify_nearby_artisans ON missions CASCADE;

DROP FUNCTION IF EXISTS notify_client_on_mission_accepted() CASCADE;
DROP FUNCTION IF EXISTS notify_nearby_artisans_on_mission_create() CASCADE;

-- 2️⃣ VÉRIFICATION ET CORRECTION DE LA TABLE NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════

-- Renommer 'read' en 'is_read' si nécessaire
DO $$ 
BEGIN
    -- Vérifier si la colonne 'read' existe
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'read'
    ) THEN
        -- Renommer 'read' en 'is_read'
        ALTER TABLE notifications RENAME COLUMN "read" TO is_read;
        RAISE NOTICE '✅ Colonne "read" renommée en "is_read"';
    END IF;
    
    -- S'assurer que is_read existe avec une valeur par défaut
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'is_read'
    ) THEN
        ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT false NOT NULL;
        RAISE NOTICE '✅ Colonne "is_read" créée';
    ELSE
        RAISE NOTICE '✅ Colonne "is_read" existe déjà';
    END IF;
END $$;

-- 3️⃣ FONCTION : Notifier le client quand sa mission est acceptée
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION notify_client_on_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
    v_client_user_id uuid;
    v_artisan_name text;
BEGIN
    -- Vérifier que le statut passe à 'accepted' et qu'un artisan est assigné
    IF NEW.status = 'accepted' AND NEW.artisan_id IS NOT NULL 
       AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        
        -- Récupérer l'ID utilisateur du client
        SELECT user_id INTO v_client_user_id
        FROM clients
        WHERE id = NEW.client_id;
        
        -- Récupérer le nom de l'artisan
        SELECT name INTO v_artisan_name
        FROM artisans
        WHERE id = NEW.artisan_id;
        
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
            v_client_user_id,
            'mission_accepted',
            'Mission acceptée !',
            v_artisan_name || ' a accepté votre mission "' || NEW.title || '"',
            NEW.id,
            false,
            NOW()
        );
        
        RAISE NOTICE '✅ Notification créée pour client % - Mission % acceptée', v_client_user_id, NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4️⃣ FONCTION : Notifier les artisans proches d'une nouvelle mission
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION notify_nearby_artisans_on_mission_create()
RETURNS TRIGGER AS $$
DECLARE
    v_artisan RECORD;
    v_search_radius_km numeric := 50;
BEGIN
    -- Notifier les artisans disponibles dans un rayon de 50km
    FOR v_artisan IN (
        SELECT 
            a.id as artisan_id,
            u.id as user_id,
            a.name,
            calculate_distance(
                NEW.latitude, 
                NEW.longitude, 
                a.latitude, 
                a.longitude
            ) as distance_km
        FROM artisans a
        JOIN users u ON u.id = a.user_id
        WHERE a.specialty = NEW.category
          AND a.is_available = true
          AND a.latitude IS NOT NULL
          AND a.longitude IS NOT NULL
          AND calculate_distance(
                NEW.latitude, 
                NEW.longitude, 
                a.latitude, 
                a.longitude
              ) <= v_search_radius_km
        ORDER BY distance_km
        LIMIT 10
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
            'Nouvelle mission à proximité',
            'Mission "' || NEW.title || '" à ' || ROUND(v_artisan.distance_km, 1) || ' km de vous',
            NEW.id,
            false,
            NOW()
        );
        
        RAISE NOTICE '✅ Notification créée pour artisan % à %.1 km', v_artisan.user_id, v_artisan.distance_km;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5️⃣ CRÉER LES TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- Trigger pour notifier le client quand la mission est acceptée
CREATE TRIGGER trg_notify_mission_accepted
    AFTER UPDATE ON missions
    FOR EACH ROW
    EXECUTE FUNCTION notify_client_on_mission_accepted();

-- Trigger pour notifier les artisans proches quand une mission est créée
CREATE TRIGGER trg_notify_nearby_artisans
    AFTER INSERT ON missions
    FOR EACH ROW
    EXECUTE FUNCTION notify_nearby_artisans_on_mission_create();

-- 6️⃣ CONFIGURATION REALTIME
-- ═══════════════════════════════════════════════════════════════

-- Retirer d'abord pour éviter les doublons
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS missions;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS notifications;

-- Ajouter les tables
ALTER PUBLICATION supabase_realtime ADD TABLE missions;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 7️⃣ VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════

DO $$ 
DECLARE
    v_trigger_count integer;
    v_function_count integer;
    v_column_exists boolean;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '✅ VÉRIFICATION DE L''INSTALLATION';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
    
    -- Vérifier les triggers
    SELECT COUNT(*) INTO v_trigger_count
    FROM pg_trigger
    WHERE tgname IN ('trg_notify_mission_accepted', 'trg_notify_nearby_artisans');
    
    RAISE NOTICE '✓ Triggers créés: %/2', v_trigger_count;
    
    -- Vérifier les fonctions
    SELECT COUNT(*) INTO v_function_count
    FROM pg_proc
    WHERE proname IN ('notify_client_on_mission_accepted', 'notify_nearby_artisans_on_mission_create');
    
    RAISE NOTICE '✓ Fonctions créées: %/2', v_function_count;
    
    -- Vérifier la colonne is_read
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'is_read'
    ) INTO v_column_exists;
    
    IF v_column_exists THEN
        RAISE NOTICE '✓ Colonne notifications.is_read existe';
    ELSE
        RAISE NOTICE '✗ Colonne notifications.is_read MANQUANTE';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    
    IF v_trigger_count = 2 AND v_function_count = 2 AND v_column_exists THEN
        RAISE NOTICE '✅ INSTALLATION RÉUSSIE !';
    ELSE
        RAISE NOTICE '⚠️  INSTALLATION INCOMPLÈTE';
    END IF;
    
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 🎉 TERMINÉ !
-- ═══════════════════════════════════════════════════════════════
-- Les notifications fonctionnent maintenant correctement.
-- Testez en créant une mission ou en acceptant une mission existante.
-- ═══════════════════════════════════════════════════════════════
