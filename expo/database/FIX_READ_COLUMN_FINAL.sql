-- ============================================
-- FIX: Corriger toutes les références à n.read
-- ============================================

-- 1. Drop toutes les fonctions qui pourraient avoir le problème
DROP FUNCTION IF EXISTS notify_nearby_artisans CASCADE;
DROP FUNCTION IF EXISTS notify_mission_accepted CASCADE;
DROP FUNCTION IF EXISTS get_user_notifications CASCADE;

-- 2. Recréer la fonction notify_nearby_artisans avec is_read
CREATE OR REPLACE FUNCTION notify_nearby_artisans()
RETURNS TRIGGER AS $$
DECLARE
  artisan RECORD;
  notification_count INTEGER := 0;
BEGIN
  IF NEW.status = 'pending' AND NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    FOR artisan IN 
      SELECT DISTINCT u.id, u.email, u.full_name,
             calculate_distance(
               NEW.latitude, 
               NEW.longitude, 
               COALESCE(ap.latitude, 0), 
               COALESCE(ap.longitude, 0)
             ) as distance
      FROM users u
      LEFT JOIN artisan_profiles ap ON u.id = ap.user_id
      WHERE u.user_type = 'artisan'
        AND u.id != NEW.client_id
        AND ap.is_available = true
        AND ap.is_profile_complete = true
        AND NEW.category = ANY(ap.specialties)
        AND calculate_distance(
          NEW.latitude, 
          NEW.longitude, 
          COALESCE(ap.latitude, 0), 
          COALESCE(ap.longitude, 0)
        ) <= COALESCE(ap.intervention_radius, 50)
      ORDER BY distance
      LIMIT 10
    LOOP
      BEGIN
        INSERT INTO notifications (
          user_id,
          title,
          message,
          type,
          mission_id,
          is_read,
          created_at
        ) VALUES (
          artisan.id,
          'Nouvelle mission disponible',
          'Une nouvelle mission de ' || NEW.category || ' est disponible près de vous (à ' || ROUND(artisan.distance::numeric, 1) || ' km)',
          'new_mission',
          NEW.id,
          false,
          NOW()
        );
        
        notification_count := notification_count + 1;
        
        RAISE NOTICE 'Notification envoyée à artisan % (distance: % km)', artisan.id, artisan.distance;
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Erreur lors de création notification pour artisan %: %', artisan.id, SQLERRM;
      END;
    END LOOP;
    
    RAISE NOTICE 'Total notifications envoyées: %', notification_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recréer la fonction notify_mission_accepted avec is_read
CREATE OR REPLACE FUNCTION notify_mission_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    BEGIN
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        mission_id,
        is_read,
        created_at
      )
      VALUES (
        NEW.client_id,
        'Mission acceptée',
        'Votre mission a été acceptée par un artisan',
        'mission_accepted',
        NEW.id,
        false,
        NOW()
      );
      
      RAISE NOTICE 'Notification envoyée au client % pour mission acceptée %', NEW.client_id, NEW.id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Erreur création notification pour client %: %', NEW.client_id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recréer les triggers
DROP TRIGGER IF EXISTS trigger_notify_nearby_artisans ON missions;
CREATE TRIGGER trigger_notify_nearby_artisans
  AFTER INSERT ON missions
  FOR EACH ROW
  EXECUTE FUNCTION notify_nearby_artisans();

DROP TRIGGER IF EXISTS trigger_notify_mission_accepted ON missions;
CREATE TRIGGER trigger_notify_mission_accepted
  AFTER UPDATE ON missions
  FOR EACH ROW
  EXECUTE FUNCTION notify_mission_accepted();

-- 5. Vérifier que la colonne is_read existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 6. Supprimer l'ancienne colonne 'read' si elle existe encore
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'read'
  ) THEN
    ALTER TABLE notifications DROP COLUMN "read";
  END IF;
END $$;

-- Confirmation
SELECT 'Correction appliquée avec succès! Toutes les fonctions utilisent maintenant is_read' as status;
