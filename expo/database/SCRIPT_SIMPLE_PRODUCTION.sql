-- ========================================
-- ARTISAN CONNECT - SCRIPT PROPRE ET FONCTIONNEL
-- Version: 1.1.0 - Production Simplifiée
-- Date: 2025-01-30
-- ========================================

-- ⚠️ À EXÉCUTER DANS SUPABASE SQL EDITOR

-- -----------------------------
-- 0️⃣ EXTENSIONS
-- -----------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------
-- 1️⃣ TABLES PRINCIPALES
-- -----------------------------

-- USERS
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  photo TEXT,
  avatar_url TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('client','artisan','admin')),
  rating DECIMAL(3,2) DEFAULT 0.00 NOT NULL,
  review_count INTEGER DEFAULT 0 NOT NULL,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ARTISANS
CREATE TABLE IF NOT EXISTS public.artisans (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'Non spécifié',
  company_name TEXT,
  siret TEXT,
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  travel_fee DECIMAL(10,2) NOT NULL DEFAULT 25.00,
  intervention_radius INTEGER NOT NULL DEFAULT 20,
  is_available BOOLEAN DEFAULT true NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  completed_missions INTEGER DEFAULT 0 NOT NULL,
  specialties TEXT[] DEFAULT '{}',
  is_suspended BOOLEAN DEFAULT false NOT NULL,
  is_verified BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ADMINS
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'moderator' CHECK (role IN ('super_admin','moderator')),
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- PAYMENT_METHODS
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('card','paypal')),
  last4 TEXT,
  is_default BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- MISSIONS
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  artisan_id UUID REFERENCES public.artisans(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','in_progress','completed','cancelled')),
  estimated_price DECIMAL(10,2) NOT NULL,
  final_price DECIMAL(10,2),
  commission DECIMAL(10,4) NOT NULL DEFAULT 0.1000,
  eta INTEGER,
  artisan_latitude DECIMAL(10,8),
  artisan_longitude DECIMAL(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  commission DECIMAL(10,4) NOT NULL DEFAULT 0.1000,
  commission_amount DECIMAL(12,2) NOT NULL,
  artisan_payout DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','refunded')),
  payment_method_id UUID REFERENCES public.payment_methods(id),
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- WALLETS
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
  pending_balance DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
  total_earned DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
  total_withdrawn DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(artisan_id)
);

-- WITHDRAWALS
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  payment_method TEXT NOT NULL,
  payment_details JSONB,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  mission_id UUID REFERENCES public.missions(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- CHAT_MESSAGES
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- -----------------------------
-- 2️⃣ INDEX POUR PERFORMANCE
-- -----------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_artisans_category ON public.artisans(category);
CREATE INDEX IF NOT EXISTS idx_artisans_location ON public.artisans(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_missions_client ON public.missions(client_id);
CREATE INDEX IF NOT EXISTS idx_missions_artisan ON public.missions(artisan_id);
CREATE INDEX IF NOT EXISTS idx_missions_status ON public.missions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_mission ON public.transactions(mission_id);
CREATE INDEX IF NOT EXISTS idx_wallets_artisan ON public.wallets(artisan_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_mission ON public.chat_messages(mission_id);

-- -----------------------------
-- 3️⃣ FONCTIONS AUTOMATIQUES
-- -----------------------------

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_artisans_updated_at ON public.artisans;
CREATE TRIGGER update_artisans_updated_at BEFORE UPDATE ON public.artisans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_missions_updated_at ON public.missions;
CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON public.missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_wallets_updated_at ON public.wallets;
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-créer profil utilisateur après inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, user_type, rating, review_count)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'client'),
    0.00,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  IF (NEW.raw_user_meta_data->>'user_type' = 'client') OR (NEW.raw_user_meta_data->>'user_type' IS NULL) THEN
    INSERT INTO public.clients (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  ELSIF (NEW.raw_user_meta_data->>'user_type' = 'artisan') THEN
    INSERT INTO public.artisans (id, category) VALUES (NEW.id, 'Non spécifié') ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.wallets (artisan_id) VALUES (NEW.id) ON CONFLICT (artisan_id) DO NOTHING;
  ELSIF (NEW.raw_user_meta_data->>'user_type' = 'admin') THEN
    INSERT INTO public.admins (id, role) VALUES (NEW.id, 'moderator') ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Sync wallet lors d'une transaction
CREATE OR REPLACE FUNCTION sync_wallet_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.wallets
    SET 
      balance = balance + NEW.artisan_payout,
      total_earned = total_earned + NEW.artisan_payout,
      updated_at = NOW()
    WHERE artisan_id = NEW.artisan_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_wallet_trigger ON public.transactions;
CREATE TRIGGER sync_wallet_trigger
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION sync_wallet_on_transaction();

-- Sync wallet lors d'un retrait
CREATE OR REPLACE FUNCTION sync_wallet_on_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.wallets
    SET 
      balance = balance - NEW.amount,
      total_withdrawn = total_withdrawn + NEW.amount,
      updated_at = NOW()
    WHERE id = NEW.wallet_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_wallet_withdrawal_trigger ON public.withdrawals;
CREATE TRIGGER sync_wallet_withdrawal_trigger
  AFTER INSERT OR UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION sync_wallet_on_withdrawal();

-- -----------------------------
-- 4️⃣ ROW LEVEL SECURITY (RLS)
-- -----------------------------

-- Activer RLS sur toutes les tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- USERS - Tout le monde peut voir, seul l'utilisateur peut modifier
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
CREATE POLICY "Users are viewable by everyone" ON public.users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- ARTISANS - Publiquement visibles
DROP POLICY IF EXISTS "Artisans are viewable by everyone" ON public.artisans;
CREATE POLICY "Artisans are viewable by everyone" ON public.artisans
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Artisans can insert their own profile" ON public.artisans;
CREATE POLICY "Artisans can insert their own profile" ON public.artisans
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Artisans can update own profile" ON public.artisans;
CREATE POLICY "Artisans can update own profile" ON public.artisans
  FOR UPDATE USING (auth.uid() = id);

-- CLIENTS
DROP POLICY IF EXISTS "Clients can view own profile" ON public.clients;
CREATE POLICY "Clients can view own profile" ON public.clients
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Clients can insert their own profile" ON public.clients;
CREATE POLICY "Clients can insert their own profile" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = id);

-- MISSIONS - Visibles par client et artisan concernés
DROP POLICY IF EXISTS "Missions viewable by client and artisan" ON public.missions;
CREATE POLICY "Missions viewable by client and artisan" ON public.missions
  FOR SELECT USING (
    auth.uid() = client_id OR 
    auth.uid() = artisan_id OR
    status = 'pending'
  );

DROP POLICY IF EXISTS "Clients can create missions" ON public.missions;
CREATE POLICY "Clients can create missions" ON public.missions
  FOR INSERT WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Missions can be updated by involved parties" ON public.missions;
CREATE POLICY "Missions can be updated by involved parties" ON public.missions
  FOR UPDATE USING (
    auth.uid() = client_id OR 
    auth.uid() = artisan_id
  );

-- TRANSACTIONS
DROP POLICY IF EXISTS "Transactions viewable by involved parties" ON public.transactions;
CREATE POLICY "Transactions viewable by involved parties" ON public.transactions
  FOR SELECT USING (
    auth.uid() = client_id OR 
    auth.uid() = artisan_id
  );

-- WALLETS
DROP POLICY IF EXISTS "Wallets viewable by owner" ON public.wallets;
CREATE POLICY "Wallets viewable by owner" ON public.wallets
  FOR SELECT USING (auth.uid() = artisan_id);

-- WITHDRAWALS
DROP POLICY IF EXISTS "Withdrawals viewable by owner" ON public.withdrawals;
CREATE POLICY "Withdrawals viewable by owner" ON public.withdrawals
  FOR SELECT USING (auth.uid() = artisan_id);

DROP POLICY IF EXISTS "Artisans can create withdrawals" ON public.withdrawals;
CREATE POLICY "Artisans can create withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (auth.uid() = artisan_id);

-- REVIEWS
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;
CREATE POLICY "Users can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Notifications viewable by owner" ON public.notifications;
CREATE POLICY "Notifications viewable by owner" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- CHAT_MESSAGES
DROP POLICY IF EXISTS "Chat messages viewable by mission parties" ON public.chat_messages;
CREATE POLICY "Chat messages viewable by mission parties" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.missions
      WHERE missions.id = chat_messages.mission_id
      AND (missions.client_id = auth.uid() OR missions.artisan_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages" ON public.chat_messages;
CREATE POLICY "Users can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- PAYMENT_METHODS
DROP POLICY IF EXISTS "Payment methods viewable by owner" ON public.payment_methods;
CREATE POLICY "Payment methods viewable by owner" ON public.payment_methods
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients WHERE clients.id = payment_methods.client_id AND clients.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Clients can add payment methods" ON public.payment_methods;
CREATE POLICY "Clients can add payment methods" ON public.payment_methods
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients WHERE clients.id = payment_methods.client_id AND clients.id = auth.uid()
    )
  );

-- -----------------------------
-- ✅ TERMINÉ
-- -----------------------------

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Script exécuté avec succès!';
  RAISE NOTICE '📊 Tables créées et configurées';
  RAISE NOTICE '🔒 RLS activé sur toutes les tables';
  RAISE NOTICE '🚀 Application prête à fonctionner';
END$$;
