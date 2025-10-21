-- ========================================
-- 🗄️ ARTISANNOW - SETUP SUPABASE (NOUVEAU PROJET)
-- ========================================
-- Instructions: Copiez-collez ce code complet dans l'éditeur SQL de Supabase
-- Puis exécutez-le en une seule fois (cliquez sur RUN)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "earthdistance" CASCADE;

-- ========================================
-- 👥 USERS TABLE
-- ========================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  photo TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('client', 'artisan', 'admin')),
  rating DECIMAL(3, 2) DEFAULT 0.00 NOT NULL,
  review_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_rating ON users(rating DESC) WHERE user_type = 'artisan';

-- ========================================
-- 🔧 ARTISANS TABLE
-- ========================================
CREATE TABLE artisans (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  hourly_rate DECIMAL(10, 2) NOT NULL,
  travel_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  intervention_radius INTEGER NOT NULL DEFAULT 10,
  is_available BOOLEAN DEFAULT true NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  completed_missions INTEGER DEFAULT 0 NOT NULL,
  specialties TEXT[] DEFAULT '{}',
  is_suspended BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180)
);

CREATE INDEX idx_artisans_category ON artisans(category);
CREATE INDEX idx_artisans_available ON artisans(is_available);
CREATE INDEX idx_artisans_location ON artisans(latitude, longitude);
CREATE INDEX idx_artisans_specialties ON artisans USING gin(specialties);

-- ========================================
-- 👤 CLIENTS TABLE
-- ========================================
CREATE TABLE clients (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ========================================
-- 👨‍💼 ADMINS TABLE
-- ========================================
CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'moderator')),
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ========================================
-- 💳 PAYMENT METHODS TABLE
-- ========================================
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('card', 'paypal')),
  last4 TEXT,
  is_default BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_payment_methods_client ON payment_methods(client_id);

-- ========================================
-- 📋 MISSIONS TABLE
-- ========================================
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  artisan_id UUID REFERENCES artisans(id) ON DELETE SET NULL,
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

CREATE INDEX idx_missions_client ON missions(client_id);
CREATE INDEX idx_missions_artisan ON missions(artisan_id);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_category ON missions(category);
CREATE INDEX idx_missions_created ON missions(created_at DESC);
CREATE INDEX idx_missions_location ON missions USING gist (ll_to_earth(latitude, longitude));

-- ========================================
-- 💰 TRANSACTIONS TABLE
-- ========================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  commission DECIMAL(10, 2) NOT NULL DEFAULT 0.10,
  commission_amount DECIMAL(10, 2) NOT NULL,
  artisan_payout DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_method_id UUID REFERENCES payment_methods(id),
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_transactions_mission ON transactions(mission_id);
CREATE INDEX idx_transactions_client ON transactions(client_id);
CREATE INDEX idx_transactions_artisan ON transactions(artisan_id);
CREATE INDEX idx_transactions_status ON transactions(status);

-- ========================================
-- ⭐ REVIEWS TABLE
-- ========================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_reviews_mission ON reviews(mission_id);
CREATE INDEX idx_reviews_to_user ON reviews(to_user_id);
CREATE INDEX idx_reviews_from_user ON reviews(from_user_id);

-- ========================================
-- 🔔 NOTIFICATIONS TABLE
-- ========================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mission_request', 'mission_accepted', 'mission_completed', 'payment')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ========================================
-- 💬 CHAT MESSAGES TABLE
-- ========================================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'artisan', 'admin')),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_chat_messages_mission ON chat_messages(mission_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_read ON chat_messages(read) WHERE NOT read;

-- ========================================
-- 💼 SUBSCRIPTIONS TABLE
-- ========================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
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

CREATE INDEX idx_subscriptions_artisan ON subscriptions(artisan_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_tier ON subscriptions(tier);

-- ========================================
-- 💵 WALLETS TABLE
-- ========================================
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artisan_id UUID NOT NULL UNIQUE REFERENCES artisans(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  pending_balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  total_earnings DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  total_withdrawals DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  currency TEXT DEFAULT 'EUR' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_wallets_artisan ON wallets(artisan_id);

-- ========================================
-- 💸 WITHDRAWALS TABLE
-- ========================================
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  method TEXT NOT NULL CHECK (method IN ('bank_transfer', 'paypal')),
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_withdrawals_wallet ON withdrawals(wallet_id);
CREATE INDEX idx_withdrawals_artisan ON withdrawals(artisan_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);

-- ========================================
-- 🧾 INVOICES TABLE
-- ========================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES artisans(id) ON DELETE CASCADE,
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

CREATE INDEX idx_invoices_mission ON invoices(mission_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_artisan ON invoices(artisan_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- ========================================
-- 📊 AUDIT LOGS TABLE
-- ========================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ========================================
-- 🔄 TRIGGERS FOR UPDATED_AT
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artisans_updated_at BEFORE UPDATE ON artisans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON missions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON withdrawals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 🔐 ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies pour USERS
CREATE POLICY users_select_own ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_update_own ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY users_insert_own ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies pour ARTISANS
CREATE POLICY artisans_select_all ON artisans FOR SELECT TO authenticated USING (true);
CREATE POLICY artisans_update_own ON artisans FOR UPDATE USING (auth.uid() = id);
CREATE POLICY artisans_insert_own ON artisans FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies pour CLIENTS
CREATE POLICY clients_select_own ON clients FOR SELECT USING (auth.uid() = id);
CREATE POLICY clients_update_own ON clients FOR UPDATE USING (auth.uid() = id);
CREATE POLICY clients_insert_own ON clients FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies pour ADMINS
CREATE POLICY admins_admin_only ON admins FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND user_type = 'admin')
);

-- Policies pour PAYMENT METHODS
CREATE POLICY payment_methods_own ON payment_methods FOR ALL USING (auth.uid() = client_id);

-- Policies pour MISSIONS
CREATE POLICY missions_select_client ON missions FOR SELECT USING (
  auth.uid() = client_id 
  OR auth.uid() = artisan_id
  OR (
    status = 'pending' 
    AND EXISTS (
      SELECT 1 FROM artisans WHERE id = auth.uid() AND artisans.category = missions.category
    )
  )
);
CREATE POLICY missions_insert_client ON missions FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY missions_update_own ON missions FOR UPDATE USING (
  auth.uid() = client_id OR auth.uid() = artisan_id
);

-- Policies pour TRANSACTIONS
CREATE POLICY transactions_select_own ON transactions FOR SELECT USING (
  auth.uid() = client_id OR auth.uid() = artisan_id
);

-- Policies pour REVIEWS
CREATE POLICY reviews_select_all ON reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY reviews_insert_own ON reviews FOR INSERT WITH CHECK (auth.uid() = from_user_id);

-- Policies pour NOTIFICATIONS
CREATE POLICY notifications_own ON notifications FOR ALL USING (auth.uid() = user_id);

-- Policies pour CHAT MESSAGES
CREATE POLICY chat_messages_select_own ON chat_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM missions 
    WHERE missions.id = chat_messages.mission_id 
    AND (missions.client_id = auth.uid() OR missions.artisan_id = auth.uid())
  )
);
CREATE POLICY chat_messages_insert_own ON chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Policies pour SUBSCRIPTIONS
CREATE POLICY subscriptions_own ON subscriptions FOR ALL USING (auth.uid() = artisan_id);

-- Policies pour WALLETS
CREATE POLICY wallets_own ON wallets FOR ALL USING (auth.uid() = artisan_id);

-- Policies pour WITHDRAWALS
CREATE POLICY withdrawals_own ON withdrawals FOR ALL USING (auth.uid() = artisan_id);

-- Policies pour INVOICES
CREATE POLICY invoices_select_own ON invoices FOR SELECT USING (
  auth.uid() = client_id OR auth.uid() = artisan_id
);

-- Policies pour AUDIT LOGS
CREATE POLICY audit_logs_admin_only ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
);

-- ========================================
-- ✅ SETUP COMPLETE!
-- ========================================
