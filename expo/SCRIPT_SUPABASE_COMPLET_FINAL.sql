-- ========================================
-- 🔥 SCRIPT SQL COMPLET - COPIER/COLLER DANS SUPABASE
-- ========================================
-- Ce script règle TOUS les problèmes:
-- 1. Table push_tokens (tokens de notification)
-- 2. Trigger notifications automatiques
-- 3. Fonction d'envoi de notifications push
-- ========================================

-- ========================================
-- 1. CRÉER LA TABLE PUSH_TOKENS
-- ========================================

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text CHECK (platform IN ('ios', 'android', 'web')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Index pour recherche rapide par user_id
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);

-- ========================================
-- 2. RLS POLICIES POUR PUSH_TOKENS
-- ========================================

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies si elles existent
DROP POLICY IF EXISTS "Users can view own push tokens" ON public.push_tokens;
DROP POLICY IF EXISTS "Users can insert own push tokens" ON public.push_tokens;
DROP POLICY IF EXISTS "Users can update own push tokens" ON public.push_tokens;
DROP POLICY IF EXISTS "Users can delete own push tokens" ON public.push_tokens;
DROP POLICY IF EXISTS "Service role can read all tokens" ON public.push_tokens;

-- Permettre aux utilisateurs de lire leurs propres tokens
CREATE POLICY "Users can view own push tokens" ON public.push_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Permettre aux utilisateurs d'insérer leurs propres tokens
CREATE POLICY "Users can insert own push tokens" ON public.push_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Permettre aux utilisateurs de mettre à jour leurs propres tokens
CREATE POLICY "Users can update own push tokens" ON public.push_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Permettre aux utilisateurs de supprimer leurs propres tokens
CREATE POLICY "Users can delete own push tokens" ON public.push_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Permettre au service_role de lire tous les tokens (pour envoyer les notifications)
CREATE POLICY "Service role can read all tokens" ON public.push_tokens
  FOR SELECT
  TO service_role
  USING (true);

-- ========================================
-- 3. TRIGGER POUR UPDATED_AT
-- ========================================

CREATE OR REPLACE FUNCTION public.update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_push_tokens_updated_at ON public.push_tokens;

CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_push_tokens_updated_at();

-- ========================================
-- 4. FONCTION : NOTIFICATION AUTOMATIQUE À L'ACCEPTATION
-- ========================================

CREATE OR REPLACE FUNCTION notify_client_on_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
  v_client_name TEXT;
  v_artisan_name TEXT;
  v_mission_title TEXT;
BEGIN
  -- Vérifier que c'est bien un changement vers 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    -- Récupérer les infos nécessaires
    SELECT 
      m.client_id,
      c_user.name as client_name,
      m.title,
      a_user.name as artisan_name
    INTO 
      v_client_id,
      v_client_name,
      v_mission_title,
      v_artisan_name
    FROM missions m
    JOIN users c_user ON m.client_id = c_user.id
    LEFT JOIN users a_user ON NEW.artisan_id = a_user.id
    WHERE m.id = NEW.id;

    -- Insérer la notification pour le client
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
      'Mission acceptée !',
      CASE 
        WHEN v_artisan_name IS NOT NULL THEN 
          v_artisan_name || ' arrive bientôt pour "' || v_mission_title || '"'
        ELSE 
          'Un artisan arrive bientôt pour "' || v_mission_title || '"'
      END,
      NEW.id,
      false,
      NOW()
    );

    -- Log pour debug
    RAISE NOTICE '✅ Notification créée pour client % (mission %)', v_client_id, NEW.id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 5. TRIGGER : ACTIVER SUR UPDATE MISSIONS
-- ========================================

DROP TRIGGER IF EXISTS notify_client_on_mission_accepted ON missions;

CREATE TRIGGER notify_client_on_mission_accepted
  AFTER UPDATE ON missions
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted'))
  EXECUTE FUNCTION notify_client_on_mission_accepted();

-- ========================================
-- 6. FONCTION : RÉCUPÉRER PUSH TOKEN D'UN USER
-- ========================================

CREATE OR REPLACE FUNCTION public.get_user_push_token(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Récupérer le token le plus récent de l'utilisateur
  SELECT token INTO v_token
  FROM public.push_tokens
  WHERE user_id = p_user_id
  ORDER BY updated_at DESC
  LIMIT 1;
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 7. VÉRIFICATIONS
-- ========================================

DO $$
DECLARE
  table_count INTEGER;
  trigger_count INTEGER;
  function_count INTEGER;
BEGIN
  -- Vérifier la table push_tokens
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'push_tokens';
  
  IF table_count > 0 THEN
    RAISE NOTICE '✅ Table push_tokens créée';
  ELSE
    RAISE EXCEPTION '❌ Table push_tokens manquante';
  END IF;

  -- Vérifier le trigger
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgname = 'notify_client_on_mission_accepted';
  
  IF trigger_count > 0 THEN
    RAISE NOTICE '✅ Trigger notify_client_on_mission_accepted créé';
  ELSE
    RAISE EXCEPTION '❌ Trigger manquant';
  END IF;

  -- Vérifier la fonction
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE proname = 'notify_client_on_mission_accepted';
  
  IF function_count > 0 THEN
    RAISE NOTICE '✅ Fonction notify_client_on_mission_accepted créée';
  ELSE
    RAISE EXCEPTION '❌ Fonction manquante';
  END IF;
END $$;

-- ========================================
-- 8. COMMENTAIRES
-- ========================================

COMMENT ON TABLE public.push_tokens IS 
  'Stocke les tokens de notifications push des utilisateurs pour Expo/FCM';

COMMENT ON FUNCTION notify_client_on_mission_accepted() IS 
  'Trigger function: Crée automatiquement une notification pour le client quand un artisan accepte sa mission';

COMMENT ON FUNCTION public.get_user_push_token(UUID) IS 
  'Récupère le push token le plus récent d''un utilisateur pour l''envoi de notifications';

-- ========================================
-- 9. MESSAGE DE SUCCÈS
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SCRIPT EXÉCUTÉ AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Table push_tokens créée';
  RAISE NOTICE '✅ Trigger de notification activé';
  RAISE NOTICE '✅ Fonction get_user_push_token créée';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PROCHAINES ÉTAPES:';
  RAISE NOTICE '1. Testez en acceptant une mission';
  RAISE NOTICE '2. Vérifiez: SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;';
  RAISE NOTICE '3. Vérifiez: SELECT * FROM push_tokens;';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
