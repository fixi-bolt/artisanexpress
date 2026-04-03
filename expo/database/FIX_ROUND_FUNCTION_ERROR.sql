-- ═══════════════════════════════════════════════════════════════════
-- 🔧 FIX: Erreur "function round(double precision, integer) does not exist"
-- ═══════════════════════════════════════════════════════════════════
-- COPIER-COLLER CE SCRIPT DANS L'ÉDITEUR SQL DE SUPABASE
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

-- Supprimer les anciens triggers
DROP TRIGGER IF EXISTS trigger_notify_nearby_artisans ON missions;
DROP FUNCTION IF EXISTS notify_nearby_artisans_on_mission_create() CASCADE;

-- ═══════════════════════════════════════════════════════════════════
-- Recréer la fonction SANS utiliser ROUND()
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
            -- CORRECTION: Utiliser CAST au lieu de ROUND
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
                'Mission "' || NEW.title || '" à ' || CAST(v_artisan.distance_km AS INTEGER) || ' km de vous',
                NEW.id,
                false,
                NOW()
            );
            
            RAISE NOTICE '✅ Notification envoyée à l''artisan % (distance: % km)', v_artisan.user_id, CAST(v_artisan.distance_km AS INTEGER);
        END LOOP;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger
CREATE TRIGGER trigger_notify_nearby_artisans
    AFTER INSERT ON missions
    FOR EACH ROW
    WHEN (NEW.status = 'pending')
    EXECUTE FUNCTION notify_nearby_artisans_on_mission_create();

COMMIT;

-- ═══════════════════════════════════════════════════════════════════
-- ✅ VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════

SELECT '✅ Trigger corrigé avec succès!' as status;

-- Vérifier que le trigger existe
SELECT 
    '✅ Trigger existe:' as info,
    EXISTS (
        SELECT 1 
        FROM pg_trigger
        WHERE tgname = 'trigger_notify_nearby_artisans'
    ) as existe;
