-- ═══════════════════════════════════════════════════════════════
-- 🚀 SCRIPT FINAL - CORRECTION NOTIFICATIONS (CORRIGÉ)
-- ═══════════════════════════════════════════════════════════════

-- 1️⃣ S'assurer que la table notifications a la bonne structure
DO $$ 
BEGIN
  -- Vérifier si la colonne 'read' existe, sinon la créer
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'notifications' AND column_name = 'read') THEN
    ALTER TABLE notifications ADD COLUMN read BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Colonne "read" ajoutée';
  END IF;

  -- Si 'is_read' existe, migrer vers 'read'
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'notifications' AND column_name = 'is_read') THEN
    UPDATE notifications SET read = is_read WHERE read IS NULL;
    ALTER TABLE notifications DROP COLUMN is_read;
    RAISE NOTICE '✅ Colonne "is_read" migrée vers "read"';
  END IF;
END $$;

-- 2️⃣ Supprimer les anciens objets (triggers et fonction)
DROP TRIGGER IF EXISTS trg_notify_mission_accepted ON missions;
DROP TRIGGER IF EXISTS trigger_mission_accepted_notification ON missions;
DROP FUNCTION IF EXISTS notify_client_on_mission_accepted();

-- 3️⃣ Créer la fonction de notification pour acceptation de mission
CREATE OR REPLACE FUNCTION notify_client_on_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_client_user_id uuid;
  v_artisan_name text;
BEGIN
  -- Vérifier que c'est une acceptation de mission
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    -- ✅ CORRECTION : Utiliser directement NEW.client_id au lieu d'une requête
    v_client_user_id := NEW.client_id;
    
    -- Récupérer le nom de l'artisan
    -- ✅ CORRECTION : Utiliser 'type' au lieu de 'user_type'
    SELECT name INTO v_artisan_name
    FROM users
    WHERE id = NEW.artisan_id AND type = 'artisan';
    
    -- Créer la notification
    IF v_client_user_id IS NOT NULL THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        mission_id,
        read,
        created_at
      ) VALUES (
        v_client_user_id,
        'mission_accepted',
        'Mission acceptée',
        'Votre mission "' || NEW.title || '" a été acceptée par ' || COALESCE(v_artisan_name, 'un artisan'),
        NEW.id,
        false,
        NOW()
      );
      
      RAISE NOTICE '✅ Notification créée pour le client %', v_client_user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4️⃣ Créer le trigger
CREATE TRIGGER trigger_mission_accepted_notification
  AFTER UPDATE ON missions
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted'))
  EXECUTE FUNCTION notify_client_on_mission_accepted();

-- 5️⃣ Configurer Realtime (sans erreur si déjà configuré)
DO $$
BEGIN
  -- Vérifier si la table est déjà dans la publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    RAISE NOTICE '✅ Table notifications ajoutée à la publication realtime';
  ELSE
    RAISE NOTICE 'ℹ️ Table notifications déjà dans la publication realtime';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'missions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE missions;
    RAISE NOTICE '✅ Table missions ajoutée à la publication realtime';
  ELSE
    RAISE NOTICE 'ℹ️ Table missions déjà dans la publication realtime';
  END IF;
END $$;

-- 6️⃣ Activer RLS et créer les politiques
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;

-- Créer les nouvelles politiques
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ✅ CORRECTION : Politique sécurisée pour les insertions
-- Permet uniquement aux utilisateurs authentifiés d'insérer leurs propres notifications
-- OU au service role (pour les triggers/fonctions)
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    OR 
    auth.jwt()->>'role' = 'service_role'
  );

-- 7️⃣ Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ CONFIGURATION TERMINÉE AVEC SUCCÈS';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Table notifications configurée avec la colonne "read"';
  RAISE NOTICE '✅ Trigger d''acceptation de mission créé';
  RAISE NOTICE '✅ Realtime configuré pour notifications et missions';
  RAISE NOTICE '✅ Politiques RLS sécurisées configurées';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Prochaine étape: Tester l''acceptation d''une mission';
  RAISE NOTICE '';
END $$;
