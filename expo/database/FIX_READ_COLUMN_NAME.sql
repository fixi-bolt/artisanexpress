-- FIX: Corriger le nom de colonne "read" en "is_read" dans le trigger
-- Le trigger utilise "read" mais la colonne s'appelle "is_read"

-- Supprimer l'ancien trigger
DROP TRIGGER IF EXISTS trigger_notify_nearby_artisans ON missions;

-- Recréer la fonction avec le bon nom de colonne
CREATE OR REPLACE FUNCTION notify_nearby_artisans_on_mission_create()
RETURNS TRIGGER AS $$
DECLARE
    v_artisan RECORD;
BEGIN
    -- Notifier les artisans disponibles à proximité (dans un rayon de 50 km)
    FOR v_artisan IN (
        SELECT 
            a.user_id,
            calculate_distance(
                NEW.latitude, 
                NEW.longitude, 
                a.latitude, 
                a.longitude
            ) as distance_km
        FROM artisans a
        WHERE a.is_available = true
        AND a.specialty = NEW.category
        AND a.latitude IS NOT NULL
        AND a.longitude IS NOT NULL
        AND calculate_distance(
            NEW.latitude, 
            NEW.longitude, 
            a.latitude, 
            a.longitude
        ) <= 50
        ORDER BY distance_km ASC
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
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recréer le trigger
CREATE TRIGGER trigger_notify_nearby_artisans
AFTER INSERT ON missions
FOR EACH ROW
EXECUTE FUNCTION notify_nearby_artisans_on_mission_create();

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Trigger corrigé: utilise maintenant is_read au lieu de read';
END $$;
