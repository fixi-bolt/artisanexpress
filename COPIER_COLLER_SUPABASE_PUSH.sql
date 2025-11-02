-- =====================================================
-- 🔔 FIX NOTIFICATIONS PUSH - Script Supabase
-- =====================================================
-- À copier-coller dans l'éditeur SQL de Supabase
-- =====================================================

-- 1. Créer la table push_tokens
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text CHECK (platform IN ('ios', 'android', 'web')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
);

-- 2. Index pour performance
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);

-- 3. Activer RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- 4. Politique : les utilisateurs voient leurs propres tokens
DROP POLICY IF EXISTS "Users can view own push tokens" ON public.push_tokens;
CREATE POLICY "Users can view own push tokens" ON public.push_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Politique : les utilisateurs insèrent leurs propres tokens
DROP POLICY IF EXISTS "Users can insert own push tokens" ON public.push_tokens;
CREATE POLICY "Users can insert own push tokens" ON public.push_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. Politique : les utilisateurs mettent à jour leurs propres tokens
DROP POLICY IF EXISTS "Users can update own push tokens" ON public.push_tokens;
CREATE POLICY "Users can update own push tokens" ON public.push_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Politique : les utilisateurs suppriment leurs propres tokens
DROP POLICY IF EXISTS "Users can delete own push tokens" ON public.push_tokens;
CREATE POLICY "Users can delete own push tokens" ON public.push_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Politique : service_role lit tous les tokens (pour envoi notifications)
DROP POLICY IF EXISTS "Service role can read all tokens" ON public.push_tokens;
CREATE POLICY "Service role can read all tokens" ON public.push_tokens
  FOR SELECT
  TO service_role
  USING (true);

-- 9. Fonction trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_push_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Créer le trigger
DROP TRIGGER IF EXISTS update_push_tokens_updated_at ON public.push_tokens;
CREATE TRIGGER update_push_tokens_updated_at
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_push_tokens_updated_at();

-- 11. Ajouter commentaire
COMMENT ON TABLE public.push_tokens IS 'Stocke les tokens de notifications push des utilisateurs pour Expo/FCM';

-- =====================================================
-- ✅ SCRIPT TERMINÉ
-- =====================================================
-- Pour vérifier que tout fonctionne :
-- SELECT * FROM public.push_tokens;
-- =====================================================
