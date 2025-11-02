-- ========================================
-- 🔔 FIX: CRÉER LA TABLE PUSH_TOKENS
-- ========================================
-- Cette table stocke les tokens push pour les notifications
-- À coller dans l'éditeur SQL de Supabase

-- Créer la table push_tokens
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, token)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_push_tokens_updated_at ON push_tokens;
CREATE TRIGGER update_push_tokens_updated_at 
  BEFORE UPDATE ON push_tokens 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- RLS pour sécuriser la table
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS push_tokens_select_own ON push_tokens;
DROP POLICY IF EXISTS push_tokens_insert_own ON push_tokens;
DROP POLICY IF EXISTS push_tokens_update_own ON push_tokens;
DROP POLICY IF EXISTS push_tokens_delete_own ON push_tokens;

-- Politiques RLS : les utilisateurs peuvent gérer leurs propres tokens
CREATE POLICY push_tokens_select_own ON push_tokens 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY push_tokens_insert_own ON push_tokens 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY push_tokens_update_own ON push_tokens 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY push_tokens_delete_own ON push_tokens 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ========================================
-- 🔔 FONCTION POUR NOTIFIER LE CLIENT QUAND MISSION ACCEPTÉE
-- ========================================

-- Fonction pour créer une notification et envoyer le push
CREATE OR REPLACE FUNCTION notify_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
  v_artisan_name TEXT;
  v_push_token TEXT;
BEGIN
  -- Vérifier si le statut change à 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    -- Récupérer l'ID du client
    SELECT client_id INTO v_client_id FROM missions WHERE id = NEW.id;
    
    -- Récupérer le nom de l'artisan
    SELECT name INTO v_artisan_name FROM users WHERE id = NEW.artisan_id;
    
    -- Créer la notification dans la table notifications
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      mission_id,
      read
    ) VALUES (
      v_client_id,
      'mission_accepted',
      'Mission acceptée',
      v_artisan_name || ' a accepté votre demande',
      NEW.id,
      false
    );
    
    -- Log pour debugging
    RAISE NOTICE 'Notification créée pour client % - mission %', v_client_id, NEW.id;
    
    -- Note: L'envoi du push réel est géré par le backend via expo-server-sdk
    -- La table push_tokens est utilisée par le backend pour récupérer le token
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS trigger_notify_mission_accepted ON missions;

-- Créer le trigger
CREATE TRIGGER trigger_notify_mission_accepted
  AFTER UPDATE ON missions
  FOR EACH ROW
  EXECUTE FUNCTION notify_mission_accepted();

-- ========================================
-- 🧪 VÉRIFICATIONS
-- ========================================

-- Vérifier que la table existe
SELECT 'Table push_tokens créée avec succès' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'push_tokens'
);

-- Vérifier les politiques RLS
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  cmd
FROM pg_policies 
WHERE tablename = 'push_tokens';

-- Vérifier le trigger
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_notify_mission_accepted';

-- ========================================
-- 📝 INSTRUCTIONS
-- ========================================

/*
✅ CE SCRIPT VA :
1. Créer la table push_tokens pour stocker les tokens de notification
2. Ajouter les index nécessaires pour les performances
3. Configurer les politiques RLS pour la sécurité
4. Créer une fonction qui notifie automatiquement le client quand une mission est acceptée
5. Créer un trigger qui s'exécute automatiquement quand le statut d'une mission change

🔄 APRÈS AVOIR COLLÉ CE SCRIPT :
1. Les tokens push seront stockés correctement
2. Quand un artisan accepte une mission, une notification sera automatiquement créée
3. Le backend pourra récupérer le token push et envoyer la notification

🧪 POUR TESTER :
1. Connectez-vous en tant que client dans l'app
2. Vérifiez que le token est enregistré : SELECT * FROM push_tokens WHERE user_id = 'VOTRE_USER_ID';
3. Demandez à un artisan d'accepter une mission
4. Vérifiez la notification : SELECT * FROM notifications WHERE mission_id = 'MISSION_ID' ORDER BY created_at DESC;
5. Vous devriez recevoir une notification push sur votre téléphone

❌ SI LES NOTIFICATIONS NE FONCTIONNENT TOUJOURS PAS :
- Vérifiez que le token est bien enregistré dans push_tokens
- Vérifiez les logs backend pour voir les erreurs d'envoi push
- Vérifiez que vous avez autorisé les notifications dans les réglages de l'app
*/
