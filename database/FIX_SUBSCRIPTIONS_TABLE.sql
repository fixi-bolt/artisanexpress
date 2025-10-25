-- ========================================
-- 🚀 FIX ERREUR: relation "subscriptions" does not exist
-- ========================================
-- Date: 2025-10-25
-- À coller dans: Supabase → SQL Editor → New Query
-- ========================================

-- ========================================
-- ÉTAPE 1: Vérifier et créer la table subscriptions
-- ========================================

-- Supprimer la table si elle existe (pour repartir proprement)
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- Créer la table subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  commission DECIMAL(10, 2) NOT NULL DEFAULT 0.10,
  features TEXT[] DEFAULT '{}',
  monthly_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Créer les index pour la performance
CREATE INDEX idx_subscriptions_artisan ON public.subscriptions(artisan_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_tier ON public.subscriptions(tier);

-- ========================================
-- ÉTAPE 2: Créer le trigger updated_at
-- ========================================

-- S'assurer que la fonction existe
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON public.subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- ÉTAPE 3: Configurer les politiques RLS
-- ========================================

-- Activer RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS subscriptions_own ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_select_own ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_insert_own ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_update_own ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_delete_own ON public.subscriptions;

-- Créer les nouvelles politiques
CREATE POLICY subscriptions_select_own ON public.subscriptions
  FOR SELECT USING (auth.uid() = artisan_id);

CREATE POLICY subscriptions_insert_own ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = artisan_id);

CREATE POLICY subscriptions_update_own ON public.subscriptions
  FOR UPDATE USING (auth.uid() = artisan_id)
  WITH CHECK (auth.uid() = artisan_id);

CREATE POLICY subscriptions_delete_own ON public.subscriptions
  FOR DELETE USING (auth.uid() = artisan_id);

-- ========================================
-- ÉTAPE 4: Créer des subscriptions par défaut
-- ========================================

-- Créer une subscription 'free' pour tous les artisans qui n'en ont pas
INSERT INTO public.subscriptions (
  artisan_id,
  tier,
  status,
  start_date,
  commission,
  features,
  monthly_price,
  created_at,
  updated_at
)
SELECT 
  a.id,
  'free',
  'active',
  NOW(),
  0.10, -- 10% commission pour le tier free
  ARRAY['basic_profile', 'mission_notifications']::TEXT[],
  0.00,
  NOW(),
  NOW()
FROM public.artisans a
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.artisan_id = a.id
)
ON CONFLICT DO NOTHING;

-- ========================================
-- ÉTAPE 5: Vérification
-- ========================================

DO $$
DECLARE
  v_subscriptions_count INTEGER;
  v_artisans_count INTEGER;
  v_artisans_without_sub INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_subscriptions_count FROM public.subscriptions;
  SELECT COUNT(*) INTO v_artisans_count FROM public.artisans;
  SELECT COUNT(*) INTO v_artisans_without_sub 
  FROM public.artisans a
  WHERE NOT EXISTS (
    SELECT 1 FROM public.subscriptions s WHERE s.artisan_id = a.id
  );
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TABLE SUBSCRIPTIONS CRÉÉE !';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 Total subscriptions: %', v_subscriptions_count;
  RAISE NOTICE '🔧 Total artisans: %', v_artisans_count;
  RAISE NOTICE '⚠️  Artisans sans subscription: %', v_artisans_without_sub;
  RAISE NOTICE '========================================';
  
  IF v_artisans_without_sub > 0 THEN
    RAISE WARNING '⚠️  % artisans n''ont pas de subscription', v_artisans_without_sub;
    RAISE NOTICE '💡 Exécutez à nouveau le script pour les créer';
  ELSE
    RAISE NOTICE '🎉 Tous les artisans ont une subscription !';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🚀 VOUS POUVEZ MAINTENANT TESTER L''APPLICATION !';
  RAISE NOTICE '========================================';
END $$;
