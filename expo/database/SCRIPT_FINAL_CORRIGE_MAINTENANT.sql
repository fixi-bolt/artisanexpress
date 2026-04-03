-- ============================================
-- SCRIPT FINAL CORRIGÉ - COPIER-COLLER DANS SUPABASE
-- ============================================

-- 1. Nettoyer les objets existants
DROP TRIGGER IF EXISTS trg_notify_mission_accepted ON missions CASCADE;
DROP FUNCTION IF EXISTS notify_client_on_mission_accepted() CASCADE;
DROP FUNCTION IF EXISTS notify_nearby_artisans_on_mission_create() CASCADE;
DROP TRIGGER IF EXISTS trg_notify_nearby_artisans ON missions CASCADE;

-- 2. Retirer les tables de la publication realtime (sans IF EXISTS)
DO $$ 
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE missions;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE notifications;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- 3. S'assurer que la colonne is_read existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
  END IF;
  
  -- Supprimer l'ancienne colonne "read" si elle existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'read'
  ) THEN
    ALTER TABLE notifications DROP COLUMN "read";
  END IF;
END $$;

-- 4. Créer la fonction de notification pour les artisans à proximité
CREATE OR REPLACE FUNCTION notify_nearby_artisans_on_mission_create()
RETURNS TRIGGER AS $$
DECLARE
  v_artisan RECORD;
BEGIN
  -- Chercher les artisans dans un rayon de 50km
  FOR v_artisan IN 
    SELECT 
      a.id,
      calculate_distance(
        NEW.latitude, NEW.longitude,
        a.latitude, a.longitude
      ) AS distance_km
    FROM artisans a
    WHERE a.category = NEW.category
      AND a.is_available = true
      AND calculate_distance(
        NEW.latitude, NEW.longitude,
        a.latitude, a.longitude
      ) <= 50
    ORDER BY distance_km
    LIMIT 10
  LOOP
    -- Insérer notification (utiliser is_read au lieu de read)
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
    
    RAISE NOTICE 'Notification envoyée à artisan % (distance: % km)', v_artisan.id, v_artisan.distance_km;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Créer la fonction de notification pour le client lors de l'acceptation
CREATE OR REPLACE FUNCTION notify_client_on_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_mission RECORD;
  v_artisan RECORD;
BEGIN
  -- Vérifier que le statut est passé à "accepted"
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Récupérer les infos de la mission
    SELECT * INTO v_mission FROM missions WHERE id = NEW.id;
    
    -- Récupérer les infos de l'artisan
    SELECT * INTO v_artisan FROM artisans WHERE id = NEW.artisan_id;
    
    -- Notifier le client
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      mission_id,
      is_read,
      created_at
    ) VALUES (
      v_mission.client_id,
      'mission_accepted',
      'Mission acceptée',
      'Votre mission "' || v_mission.title || '" a été acceptée par un artisan',
      NEW.id,
      false,
      NOW()
    );
    
    RAISE NOTICE 'Notification envoyée au client % pour mission %', v_mission.client_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Créer les triggers
CREATE TRIGGER trg_notify_nearby_artisans
  AFTER INSERT ON missions
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_nearby_artisans_on_mission_create();

CREATE TRIGGER trg_notify_mission_accepted
  AFTER UPDATE ON missions
  FOR EACH ROW
  WHEN (NEW.status = 'accepted')
  EXECUTE FUNCTION notify_client_on_mission_accepted();

-- 7. Ajouter les tables à la publication realtime
ALTER PUBLICATION supabase_realtime ADD TABLE missions;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 8. Mettre à jour les données existantes
UPDATE notifications SET is_read = false WHERE is_read IS NULL;

-- 9. Vérification finale
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM pg_publication_tables 
  WHERE pubname = 'supabase_realtime' AND tablename IN ('missions', 'notifications');
  
  RAISE NOTICE '✅ Tables dans publication realtime: %', v_count;
  
  SELECT COUNT(*) INTO v_count FROM pg_trigger 
  WHERE tgname IN ('trg_notify_nearby_artisans', 'trg_notify_mission_accepted');
  
  RAISE NOTICE '✅ Triggers créés: %', v_count;
END $$;

-- ============================================
-- FIN DU SCRIPT
-- ============================================
