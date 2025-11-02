-- Table pour stocker les push tokens des utilisateurs
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

-- RLS policies
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

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

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_push_tokens_updated_at();

COMMENT ON TABLE public.push_tokens IS 'Stocke les tokens de notifications push des utilisateurs pour Expo/FCM';
