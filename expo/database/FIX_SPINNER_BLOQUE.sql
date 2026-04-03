-- =====================================================
-- 🚨 FIX URGENT: Spinner bloqué à l'infini
-- =====================================================
-- Ce script corrige tous les problèmes qui empêchent
-- l'application de se charger correctement
-- =====================================================
-- INSTRUCTIONS:
-- 1. Ouvrez Supabase Dashboard
-- 2. Allez dans SQL Editor
-- 3. Créez une nouvelle query
-- 4. Collez TOUT ce script
-- 5. Cliquez sur "Run"
-- =====================================================

BEGIN;

-- =====================================================
-- ÉTAPE 1: Vérifier et créer la table subscriptions
-- =====================================================

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

-- =====================================================
-- ÉTAPE 2: Créer le trigger updated_at
-- =====================================================

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

-- =====================================================
-- ÉTAPE 3: Configurer les politiques RLS
-- =====================================================

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

-- =====================================================
-- ÉTAPE 4: Vérifier que les artisans existent bien
-- =====================================================

-- Lister tous les utilisateurs de type 'artisan' qui n'ont pas de profil artisan
DO $$
DECLARE
  v_missing_artisans INTEGER;
  v_user_id UUID;
BEGIN
  -- Compter les artisans manquants
  SELECT COUNT(*) INTO v_missing_artisans
  FROM public.users u
  WHERE u.user_type = 'artisan'
  AND NOT EXISTS (
    SELECT 1 FROM public.artisans a WHERE a.id = u.id
  );

  IF v_missing_artisans > 0 THEN
    RAISE NOTICE '⚠️  % utilisateurs artisans sans profil artisan trouvés', v_missing_artisans;
    
    -- Créer les profils artisans manquants
    FOR v_user_id IN 
      SELECT u.id
      FROM public.users u
      WHERE u.user_type = 'artisan'
      AND NOT EXISTS (
        SELECT 1 FROM public.artisans a WHERE a.id = u.id
      )
    LOOP
      INSERT INTO public.artisans (
        id,
        category,
        hourly_rate,
        travel_fee,
        intervention_radius,
        is_available,
        completed_missions,
        specialties,
        is_suspended
      ) VALUES (
        v_user_id,
        'Non spécifié',
        50,
        25,
        20,
        true,
        0,
        ARRAY[]::TEXT[],
        false
      )
      ON CONFLICT (id) DO NOTHING;
      
      RAISE NOTICE '✅ Profil artisan créé pour: %', v_user_id;
    END LOOP;
  ELSE
    RAISE NOTICE '✅ Tous les artisans ont un profil';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 5: Créer des subscriptions pour tous les artisans
-- =====================================================

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
  0.10,
  ARRAY['basic_profile', 'mission_notifications']::TEXT[],
  0.00,
  NOW(),
  NOW()
FROM public.artisans a
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.artisan_id = a.id
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ÉTAPE 6: Vérifier que les wallets existent
-- =====================================================

-- Créer les wallets manquants
INSERT INTO public.wallets (
  artisan_id,
  balance,
  pending_balance,
  total_earnings,
  total_withdrawals,
  currency,
  created_at,
  updated_at
)
SELECT 
  a.id,
  0,
  0,
  0,
  0,
  'EUR',
  NOW(),
  NOW()
FROM public.artisans a
WHERE NOT EXISTS (
  SELECT 1 FROM public.wallets w WHERE w.artisan_id = a.id
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ÉTAPE 7: Vérifier la table clients
-- =====================================================

-- Créer les profils clients manquants
INSERT INTO public.clients (
  id,
  created_at,
  updated_at
)
SELECT 
  u.id,
  NOW(),
  NOW()
FROM public.users u
WHERE u.user_type = 'client'
AND NOT EXISTS (
  SELECT 1 FROM public.clients c WHERE c.id = u.id
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ÉTAPE 8: Rapport final
-- =====================================================

DO $$
DECLARE
  v_total_users INTEGER;
  v_total_artisans INTEGER;
  v_total_clients INTEGER;
  v_total_subscriptions INTEGER;
  v_total_wallets INTEGER;
  v_artisans_without_sub INTEGER;
  v_artisans_without_wallet INTEGER;
  v_clients_without_profile INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM public.users;
  SELECT COUNT(*) INTO v_total_artisans FROM public.artisans;
  SELECT COUNT(*) INTO v_total_clients FROM public.clients;
  SELECT COUNT(*) INTO v_total_subscriptions FROM public.subscriptions;
  SELECT COUNT(*) INTO v_total_wallets FROM public.wallets;
  
  SELECT COUNT(*) INTO v_artisans_without_sub 
  FROM public.artisans a
  WHERE NOT EXISTS (
    SELECT 1 FROM public.subscriptions s WHERE s.artisan_id = a.id
  );
  
  SELECT COUNT(*) INTO v_artisans_without_wallet
  FROM public.artisans a
  WHERE NOT EXISTS (
    SELECT 1 FROM public.wallets w WHERE w.artisan_id = a.id
  );
  
  SELECT COUNT(*) INTO v_clients_without_profile
  FROM public.users u
  WHERE u.user_type = 'client'
  AND NOT EXISTS (
    SELECT 1 FROM public.clients c WHERE c.id = u.id
  );
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CORRECTION TERMINÉE !';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 STATISTIQUES:';
  RAISE NOTICE '  👥 Total utilisateurs: %', v_total_users;
  RAISE NOTICE '  🔧 Total artisans: %', v_total_artisans;
  RAISE NOTICE '  👤 Total clients: %', v_total_clients;
  RAISE NOTICE '  📜 Total subscriptions: %', v_total_subscriptions;
  RAISE NOTICE '  💰 Total wallets: %', v_total_wallets;
  RAISE NOTICE '';
  
  IF v_artisans_without_sub > 0 THEN
    RAISE WARNING '⚠️  % artisans sans subscription', v_artisans_without_sub;
  ELSE
    RAISE NOTICE '✅ Tous les artisans ont une subscription';
  END IF;
  
  IF v_artisans_without_wallet > 0 THEN
    RAISE WARNING '⚠️  % artisans sans wallet', v_artisans_without_wallet;
  ELSE
    RAISE NOTICE '✅ Tous les artisans ont un wallet';
  END IF;
  
  IF v_clients_without_profile > 0 THEN
    RAISE WARNING '⚠️  % clients sans profil', v_clients_without_profile;
  ELSE
    RAISE NOTICE '✅ Tous les clients ont un profil';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🚀 VOUS POUVEZ MAINTENANT TESTER !';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Si le spinner reste bloqué:';
  RAISE NOTICE '1. Vérifiez vos credentials Supabase dans .env';
  RAISE NOTICE '2. Rechargez l''application (R dans le terminal)';
  RAISE NOTICE '3. Vérifiez la console pour les erreurs';
  RAISE NOTICE '';
END $$;

COMMIT;
