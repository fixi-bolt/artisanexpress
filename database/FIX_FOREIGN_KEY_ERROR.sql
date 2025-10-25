-- =====================================================
-- 🔧 FIX: column "id" referenced in foreign key constraint does not exist
-- =====================================================
-- Ce script corrige les erreurs de contraintes de clés étrangères
-- en créant les tables dans le bon ordre
-- =====================================================
-- INSTRUCTIONS:
-- 1. Ouvrez Supabase Dashboard → SQL Editor
-- 2. Créez une nouvelle query
-- 3. Collez TOUT ce script
-- 4. Cliquez sur "Run"
-- =====================================================

BEGIN;

-- =====================================================
-- ÉTAPE 1: Supprimer toutes les tables (ordre inversé)
-- =====================================================

DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.withdrawals CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.missions CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.artisans CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Supprimer les triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_rating() CASCADE;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ÉTAPE 2: Créer les tables dans le BON ORDRE
-- =====================================================

-- 1. TABLE USERS (table principale, pas de foreign key)
CREATE TABLE public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  photo TEXT,
  avatar_url TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('client', 'artisan', 'admin')),
  rating DECIMAL(3, 2) DEFAULT 0.00 NOT NULL,
  review_count INTEGER DEFAULT 0 NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. TABLE ARTISANS (dépend de users)
CREATE TABLE public.artisans (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'Non spécifié',
  company_name TEXT,
  siret TEXT,
  hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
  travel_fee DECIMAL(10, 2) NOT NULL DEFAULT 25.00,
  intervention_radius INTEGER NOT NULL DEFAULT 20,
  is_available BOOLEAN DEFAULT true NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  completed_missions INTEGER DEFAULT 0 NOT NULL,
  specialties TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  is_suspended BOOLEAN DEFAULT false NOT NULL,
  is_verified BOOLEAN DEFAULT false NOT NULL,
  is_certified BOOLEAN DEFAULT false NOT NULL,
  years_of_experience INTEGER,
  languages TEXT[] DEFAULT '{"Français"}',
  photos TEXT[],
  documents TEXT[],
  availability_schedule JSONB DEFAULT '{}',
  insurance_number TEXT,
  insurance_expiry DATE,
  website_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. TABLE CLIENTS (dépend de users)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. TABLE ADMINS (dépend de users)
CREATE TABLE public.admins (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'moderator' CHECK (role IN ('super_admin', 'moderator')),
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. TABLE PAYMENT_METHODS (dépend de clients)
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('card', 'paypal')),
  last4 TEXT,
  is_default BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. TABLE MISSIONS (dépend de clients et artisans)
CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  artisan_id UUID REFERENCES public.artisans(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  estimated_price DECIMAL(10, 2) NOT NULL,
  final_price DECIMAL(10, 2),
  commission DECIMAL(10, 2) NOT NULL DEFAULT 0.10,
  eta INTEGER,
  artisan_latitude DECIMAL(10, 8),
  artisan_longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. TABLE TRANSACTIONS (dépend de missions, clients, artisans, payment_methods)
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  commission DECIMAL(10, 2) NOT NULL DEFAULT 0.10,
  commission_amount DECIMAL(10, 2) NOT NULL,
  artisan_payout DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_method_id UUID REFERENCES public.payment_methods(id),
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. TABLE REVIEWS (dépend de missions, users)
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. TABLE NOTIFICATIONS (dépend de users, missions)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mission_request', 'mission_accepted', 'mission_completed', 'payment')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. TABLE CHAT_MESSAGES (dépend de missions, users)
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'artisan', 'admin')),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. TABLE SUBSCRIPTIONS (dépend de artisans)
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

-- 12. TABLE WALLETS (dépend de artisans)
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artisan_id UUID NOT NULL UNIQUE REFERENCES public.artisans(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  pending_balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  total_earnings DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  total_withdrawals DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  currency TEXT DEFAULT 'EUR' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. TABLE WITHDRAWALS (dépend de wallets, artisans)
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  method TEXT NOT NULL CHECK (method IN ('bank_transfer', 'paypal')),
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 14. TABLE INVOICES (dépend de missions, transactions, clients, artisans)
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  pdf_url TEXT,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 15. TABLE AUDIT_LOGS (dépend de users)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- ÉTAPE 3: Créer les index
-- =====================================================

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_type ON public.users(user_type);
CREATE INDEX idx_artisans_category ON public.artisans(category);
CREATE INDEX idx_artisans_available ON public.artisans(is_available, is_suspended);
CREATE INDEX idx_missions_client ON public.missions(client_id);
CREATE INDEX idx_missions_artisan ON public.missions(artisan_id);
CREATE INDEX idx_missions_status ON public.missions(status);
CREATE INDEX idx_transactions_mission ON public.transactions(mission_id);
CREATE INDEX idx_wallets_artisan ON public.wallets(artisan_id);
CREATE INDEX idx_subscriptions_artisan ON public.subscriptions(artisan_id);

-- =====================================================
-- ÉTAPE 4: Créer les fonctions
-- =====================================================

-- Fonction pour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction synchronisation Auth → Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type TEXT;
  v_name TEXT;
BEGIN
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'client');
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Utilisateur');

  INSERT INTO public.users (id, email, name, user_type, phone, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id, NEW.email, v_name, v_user_type,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.created_at, NOW()), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    user_type = EXCLUDED.user_type,
    updated_at = NOW();

  IF v_user_type = 'client' THEN
    INSERT INTO public.clients (id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
  ELSIF v_user_type = 'artisan' THEN
    INSERT INTO public.artisans (
      id, category, hourly_rate, travel_fee, intervention_radius,
      is_available, specialties, siret, company_name, created_at, updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'category', 'Non spécifié'),
      COALESCE((NEW.raw_user_meta_data->>'hourly_rate')::NUMERIC, 50.00),
      COALESCE((NEW.raw_user_meta_data->>'travel_fee')::NUMERIC, 25.00),
      COALESCE((NEW.raw_user_meta_data->>'intervention_radius')::INTEGER, 20),
      COALESCE((NEW.raw_user_meta_data->>'is_available')::BOOLEAN, true),
      '{}',
      NEW.raw_user_meta_data->>'siret',
      NEW.raw_user_meta_data->>'company_name',
      NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.wallets (artisan_id, balance, pending_balance, total_earnings, total_withdrawals, currency, created_at, updated_at)
    VALUES (NEW.id, 0.00, 0.00, 0.00, 0.00, 'EUR', NOW(), NOW())
    ON CONFLICT (artisan_id) DO NOTHING;

    INSERT INTO public.subscriptions (artisan_id, tier, status, commission, features, monthly_price, created_at, updated_at)
    VALUES (NEW.id, 'free', 'active', 0.10, ARRAY['basic_profile', 'mission_notifications']::TEXT[], 0.00, NOW(), NOW())
    ON CONFLICT DO NOTHING;
    
  ELSIF v_user_type = 'admin' THEN
    INSERT INTO public.admins (id, role, permissions, created_at, updated_at)
    VALUES (NEW.id, 'moderator', '{}', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÉTAPE 5: Créer les triggers
-- =====================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_artisans_updated_at BEFORE UPDATE ON public.artisans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON public.missions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ÉTAPE 6: Activer RLS
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Politiques USERS
CREATE POLICY users_select_own ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY users_insert_own ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques ARTISANS
CREATE POLICY artisans_view_public ON public.artisans FOR SELECT USING (is_available = true AND is_suspended = false);
CREATE POLICY artisans_select_own ON public.artisans FOR SELECT USING (auth.uid() = id);
CREATE POLICY artisans_update_own ON public.artisans FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY artisans_insert_own ON public.artisans FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques CLIENTS
CREATE POLICY clients_select_own ON public.clients FOR SELECT USING (auth.uid() = id);
CREATE POLICY clients_update_own ON public.clients FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY clients_insert_own ON public.clients FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques WALLETS
CREATE POLICY wallets_select_own ON public.wallets FOR SELECT USING (auth.uid() = artisan_id);
CREATE POLICY wallets_update_own ON public.wallets FOR UPDATE USING (auth.uid() = artisan_id) WITH CHECK (auth.uid() = artisan_id);

-- Politiques SUBSCRIPTIONS
CREATE POLICY subscriptions_select_own ON public.subscriptions FOR SELECT USING (auth.uid() = artisan_id);
CREATE POLICY subscriptions_insert_own ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = artisan_id);
CREATE POLICY subscriptions_update_own ON public.subscriptions FOR UPDATE USING (auth.uid() = artisan_id) WITH CHECK (auth.uid() = artisan_id);

-- =====================================================
-- ÉTAPE 7: Créer les profils manquants
-- =====================================================

INSERT INTO public.users (id, email, name, user_type, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1), 'Utilisateur'),
  COALESCE(au.raw_user_meta_data->>'user_type', 'client'),
  COALESCE(au.created_at, NOW()),
  NOW()
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.artisans (id, category, hourly_rate, travel_fee, intervention_radius, is_available, specialties, completed_missions, is_suspended, created_at, updated_at)
SELECT u.id, 'Non spécifié', 50.00, 25.00, 20, true, '{}', 0, false, NOW(), NOW()
FROM public.users u
WHERE u.user_type = 'artisan' AND NOT EXISTS (SELECT 1 FROM public.artisans a WHERE a.id = u.id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, created_at, updated_at)
SELECT u.id, NOW(), NOW()
FROM public.users u
WHERE u.user_type = 'client' AND NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.id = u.id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.wallets (artisan_id, balance, pending_balance, total_earnings, total_withdrawals, currency, created_at, updated_at)
SELECT a.id, 0.00, 0.00, 0.00, 0.00, 'EUR', NOW(), NOW()
FROM public.artisans a
WHERE NOT EXISTS (SELECT 1 FROM public.wallets w WHERE w.artisan_id = a.id)
ON CONFLICT (artisan_id) DO NOTHING;

INSERT INTO public.subscriptions (artisan_id, tier, status, commission, features, monthly_price, created_at, updated_at)
SELECT a.id, 'free', 'active', 0.10, ARRAY['basic_profile', 'mission_notifications']::TEXT[], 0.00, NOW(), NOW()
FROM public.artisans a
WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.artisan_id = a.id);

COMMIT;

-- =====================================================
-- ÉTAPE 8: Rapport
-- =====================================================

DO $$
DECLARE
  v_users INTEGER;
  v_artisans INTEGER;
  v_clients INTEGER;
  v_wallets INTEGER;
  v_subscriptions INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_users FROM public.users;
  SELECT COUNT(*) INTO v_artisans FROM public.artisans;
  SELECT COUNT(*) INTO v_clients FROM public.clients;
  SELECT COUNT(*) INTO v_wallets FROM public.wallets;
  SELECT COUNT(*) INTO v_subscriptions FROM public.subscriptions;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CORRECTION TERMINÉE !';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 STATISTIQUES:';
  RAISE NOTICE '  👥 Users: %', v_users;
  RAISE NOTICE '  🔧 Artisans: %', v_artisans;
  RAISE NOTICE '  👤 Clients: %', v_clients;
  RAISE NOTICE '  💰 Wallets: %', v_wallets;
  RAISE NOTICE '  📜 Subscriptions: %', v_subscriptions;
  RAISE NOTICE '';
  RAISE NOTICE '🚀 BASE DE DONNÉES PRÊTE !';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;
