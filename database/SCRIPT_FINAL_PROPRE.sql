-- ========================================
-- 🚀 SCRIPT SQL COMPLET - ARTISAN CONNECT
-- ========================================
-- Date: 2025-10-25
-- À coller dans: Supabase → SQL Editor → New Query
-- 
-- ✅ Ce script contient:
-- 1. Nettoyage complet (drop tables)
-- 2. Création des tables avec toutes les colonnes nécessaires
-- 3. Triggers pour synchronisation auto Auth → Users
-- 4. Politiques RLS optimisées
-- 5. Index de performance
-- 6. Fonctions utilitaires
-- ========================================

-- ========================================
-- 🧹 ÉTAPE 1: NETTOYAGE COMPLET
-- ========================================

-- Désactiver RLS temporairement
ALTER TABLE IF EXISTS public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.artisans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;

-- Supprimer les triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_rating_after_review ON reviews;
DROP TRIGGER IF EXISTS validate_mission_artisan ON missions;
DROP TRIGGER IF EXISTS validate_mission_status ON missions;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_artisans_updated_at ON artisans;
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
DROP TRIGGER IF EXISTS update_missions_updated_at ON missions;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON withdrawals;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;

-- Supprimer les tables dans l'ordre (foreign keys)
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

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_rating() CASCADE;
DROP FUNCTION IF EXISTS public.validate_artisan_assignment() CASCADE;
DROP FUNCTION IF EXISTS public.validate_mission_status_transition() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_distance(DECIMAL, DECIMAL, DECIMAL, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS public.find_nearby_artisans(DECIMAL, DECIMAL, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.get_artisan_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "earthdistance" CASCADE;
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ========================================
-- 📊 ÉTAPE 2: CRÉATION DES TABLES
-- ========================================

-- Table USERS (principale)
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

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_type ON public.users(user_type);
CREATE INDEX idx_users_rating ON public.users(rating DESC) WHERE user_type = 'artisan';

-- Table ARTISANS
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
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180)
);

CREATE INDEX idx_artisans_category ON public.artisans(category);
CREATE INDEX idx_artisans_available ON public.artisans(is_available, is_suspended) WHERE is_available = true AND is_suspended = false;
CREATE INDEX idx_artisans_location ON public.artisans(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_artisans_specialties ON public.artisans USING gin(specialties);

-- Table CLIENTS
CREATE TABLE public.clients (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table ADMINS
CREATE TABLE public.admins (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'moderator' CHECK (role IN ('super_admin', 'moderator')),
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Table PAYMENT_METHODS
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('card', 'paypal')),
  last4 TEXT,
  is_default BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_payment_methods_client ON public.payment_methods(client_id);

-- Table MISSIONS
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
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_mission_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT valid_mission_longitude CHECK (longitude >= -180 AND longitude <= 180)
);

CREATE INDEX idx_missions_client ON public.missions(client_id);
CREATE INDEX idx_missions_artisan ON public.missions(artisan_id);
CREATE INDEX idx_missions_status ON public.missions(status);
CREATE INDEX idx_missions_category ON public.missions(category);
CREATE INDEX idx_missions_created ON public.missions(created_at DESC);

-- Table TRANSACTIONS
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

CREATE INDEX idx_transactions_mission ON public.transactions(mission_id);
CREATE INDEX idx_transactions_client ON public.transactions(client_id);
CREATE INDEX idx_transactions_artisan ON public.transactions(artisan_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);

-- Table REVIEWS
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_reviews_mission ON public.reviews(mission_id);
CREATE INDEX idx_reviews_to_user ON public.reviews(to_user_id);

-- Table NOTIFICATIONS
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

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- Table CHAT_MESSAGES
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

CREATE INDEX idx_chat_messages_mission ON public.chat_messages(mission_id);
CREATE INDEX idx_chat_messages_sender ON public.chat_messages(sender_id);

-- Table SUBSCRIPTIONS
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

CREATE INDEX idx_subscriptions_artisan ON public.subscriptions(artisan_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Table WALLETS
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

CREATE INDEX idx_wallets_artisan ON public.wallets(artisan_id);

-- Table WITHDRAWALS
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

CREATE INDEX idx_withdrawals_wallet ON public.withdrawals(wallet_id);
CREATE INDEX idx_withdrawals_artisan ON public.withdrawals(artisan_id);

-- Table INVOICES
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

CREATE INDEX idx_invoices_mission ON public.invoices(mission_id);

-- Table AUDIT_LOGS
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

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity, entity_id);

-- ========================================
-- 🔄 ÉTAPE 3: TRIGGERS
-- ========================================

-- Fonction pour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_artisans_updated_at BEFORE UPDATE ON public.artisans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON public.missions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON public.withdrawals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction synchronisation Auth → Users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type TEXT;
  v_name TEXT;
BEGIN
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'client');
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Utilisateur');

  -- Insérer dans users
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

  -- Créer profil spécifique
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
      COALESCE(
        CASE 
          WHEN NEW.raw_user_meta_data->>'specialties' IS NOT NULL THEN 
            string_to_array(NEW.raw_user_meta_data->>'specialties', ',')
          ELSE '{}'::TEXT[]
        END, '{}'
      ),
      NEW.raw_user_meta_data->>'siret',
      NEW.raw_user_meta_data->>'company_name',
      NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Créer wallet
    INSERT INTO public.wallets (artisan_id, balance, pending_balance, total_earnings, total_withdrawals, currency, created_at, updated_at)
    VALUES (NEW.id, 0.00, 0.00, 0.00, 0.00, 'EUR', NOW(), NOW())
    ON CONFLICT (artisan_id) DO NOTHING;
    
  ELSIF v_user_type = 'admin' THEN
    INSERT INTO public.admins (id, role, permissions, created_at, updated_at)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'role', 'moderator'),
      COALESCE(
        CASE 
          WHEN NEW.raw_user_meta_data->>'permissions' IS NOT NULL THEN 
            string_to_array(NEW.raw_user_meta_data->>'permissions', ',')
          ELSE '{}'::TEXT[]
        END, '{}'
      ),
      NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Fonction mise à jour rating
CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.to_user_id;
  ELSE
    v_user_id := NEW.to_user_id;
  END IF;
  
  UPDATE public.users 
  SET 
    rating = (SELECT COALESCE(AVG(rating), 0) FROM public.reviews WHERE to_user_id = v_user_id),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE to_user_id = v_user_id),
    updated_at = NOW()
  WHERE id = v_user_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_after_review
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_user_rating();

-- ========================================
-- 🔐 ÉTAPE 4: ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

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

-- Politiques ADMINS
CREATE POLICY admins_admin_only ON public.admins FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND user_type = 'admin')
);

-- Politiques PAYMENT_METHODS
CREATE POLICY payment_methods_own ON public.payment_methods FOR ALL USING (auth.uid() = client_id);

-- Politiques MISSIONS
CREATE POLICY missions_select_client ON public.missions FOR SELECT USING (
  auth.uid() = client_id 
  OR auth.uid() = artisan_id
  OR (status = 'pending' AND EXISTS (SELECT 1 FROM public.artisans WHERE id = auth.uid() AND artisans.category = missions.category))
);
CREATE POLICY missions_insert_client ON public.missions FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY missions_update_own ON public.missions FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = artisan_id);

-- Politiques TRANSACTIONS
CREATE POLICY transactions_select_own ON public.transactions FOR SELECT USING (auth.uid() = client_id OR auth.uid() = artisan_id);

-- Politiques REVIEWS
CREATE POLICY reviews_select_all ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY reviews_insert_own ON public.reviews FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Politiques NOTIFICATIONS
CREATE POLICY notifications_own ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Politiques CHAT_MESSAGES
CREATE POLICY chat_messages_select_own ON public.chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.missions WHERE missions.id = chat_messages.mission_id AND (missions.client_id = auth.uid() OR missions.artisan_id = auth.uid()))
);
CREATE POLICY chat_messages_insert_own ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Politiques SUBSCRIPTIONS
CREATE POLICY subscriptions_own ON public.subscriptions FOR ALL USING (auth.uid() = artisan_id);

-- Politiques WALLETS
CREATE POLICY wallets_select_own ON public.wallets FOR SELECT USING (auth.uid() = artisan_id);
CREATE POLICY wallets_update_own ON public.wallets FOR UPDATE USING (auth.uid() = artisan_id) WITH CHECK (auth.uid() = artisan_id);

-- Politiques WITHDRAWALS
CREATE POLICY withdrawals_own ON public.withdrawals FOR ALL USING (auth.uid() = artisan_id);

-- Politiques INVOICES
CREATE POLICY invoices_select_own ON public.invoices FOR SELECT USING (auth.uid() = client_id OR auth.uid() = artisan_id);

-- Politiques AUDIT_LOGS
CREATE POLICY audit_logs_admin_only ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
);

-- ========================================
-- ✅ ÉTAPE 5: VÉRIFICATION
-- ========================================

DO $$
DECLARE
  v_table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN (
      'users', 'artisans', 'clients', 'admins', 'payment_methods',
      'missions', 'transactions', 'reviews', 'notifications',
      'chat_messages', 'subscriptions', 'wallets', 'withdrawals',
      'invoices', 'audit_logs'
    );
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SCRIPT COMPLET TERMINÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 Tables créées: %/15', v_table_count;
  RAISE NOTICE '🔄 Triggers configurés: ✓';
  RAISE NOTICE '🔐 RLS activé: ✓';
  RAISE NOTICE '📈 Index créés: ✓';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 BASE DE DONNÉES PRÊTE !';
  RAISE NOTICE '========================================';
  
  IF v_table_count < 15 THEN
    RAISE WARNING '⚠️  Certaines tables n''ont pas été créées';
  END IF;
END $$;
