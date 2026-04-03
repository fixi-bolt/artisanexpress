-- ================================================================
-- CRÉATION DE LA TABLE push_tokens POUR LES NOTIFICATIONS PUSH
-- ================================================================
-- À copier-coller dans l'éditeur SQL de Supabase
-- ================================================================

-- 1. Créer la table push_tokens si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_info jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Un utilisateur peut avoir plusieurs tokens (plusieurs appareils)
  -- mais chaque token doit être unique
  UNIQUE(token)
);

-- 2. Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON public.push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON public.push_tokens(is_active) WHERE is_active = true;

-- 3. Activer RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS
-- Les utilisateurs peuvent lire uniquement leurs propres tokens
DROP POLICY IF EXISTS "Users can view their own push tokens" ON public.push_tokens;
CREATE POLICY "Users can view their own push tokens" 
  ON public.push_tokens 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Les utilisateurs peuvent insérer leurs propres tokens
DROP POLICY IF EXISTS "Users can insert their own push tokens" ON public.push_tokens;
CREATE POLICY "Users can insert their own push tokens" 
  ON public.push_tokens 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres tokens
DROP POLICY IF EXISTS "Users can update their own push tokens" ON public.push_tokens;
CREATE POLICY "Users can update their own push tokens" 
  ON public.push_tokens 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres tokens
DROP POLICY IF EXISTS "Users can delete their own push tokens" ON public.push_tokens;
CREATE POLICY "Users can delete their own push tokens" 
  ON public.push_tokens 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Service role peut tout faire (pour les triggers et fonctions backend)
DROP POLICY IF EXISTS "Service role can manage all push tokens" ON public.push_tokens;
CREATE POLICY "Service role can manage all push tokens" 
  ON public.push_tokens 
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger pour updated_at
DROP TRIGGER IF EXISTS update_push_tokens_updated_at ON public.push_tokens;
CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_push_tokens_updated_at();

-- 7. Fonction utilitaire pour enregistrer/mettre à jour un token
CREATE OR REPLACE FUNCTION public.upsert_push_token(
  p_user_id uuid,
  p_token text,
  p_platform text,
  p_device_info jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_token_id uuid;
BEGIN
  -- Désactiver les anciens tokens de cet utilisateur sur cette plateforme
  UPDATE public.push_tokens
  SET is_active = false
  WHERE user_id = p_user_id 
    AND platform = p_platform 
    AND token != p_token;

  -- Insérer ou mettre à jour le token
  INSERT INTO public.push_tokens (user_id, token, platform, device_info, is_active)
  VALUES (p_user_id, p_token, p_platform, p_device_info, true)
  ON CONFLICT (token) 
  DO UPDATE SET
    is_active = true,
    device_info = EXCLUDED.device_info,
    updated_at = now()
  RETURNING id INTO v_token_id;

  RETURN v_token_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Fonction pour récupérer les tokens actifs d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_active_push_tokens(p_user_id uuid)
RETURNS TABLE (
  token text,
  platform text,
  device_info jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT pt.token, pt.platform, pt.device_info
  FROM public.push_tokens pt
  WHERE pt.user_id = p_user_id
    AND pt.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Fonction pour désactiver un token (lors de la déconnexion)
CREATE OR REPLACE FUNCTION public.deactivate_push_token(p_token text)
RETURNS void AS $$
BEGIN
  UPDATE public.push_tokens
  SET is_active = false
  WHERE token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- VÉRIFICATION
-- ================================================================

-- Vérifier que la table existe
SELECT 'Table push_tokens créée avec succès' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'push_tokens'
);

-- Afficher les colonnes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'push_tokens'
ORDER BY ordinal_position;

-- Afficher les politiques RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'push_tokens';
