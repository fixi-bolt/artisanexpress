-- =====================================================
-- 🔧 CORRECTION DE LA COLONNE user_type
-- =====================================================
-- Ce script va supprimer et recréer les tables avec la bonne structure

-- Étape 1: Désactiver temporairement RLS pour éviter les erreurs
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS artisans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients DISABLE ROW LEVEL SECURITY;

-- Étape 2: Supprimer toutes les tables (dans le bon ordre à cause des foreign keys)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS missions CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS artisans CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Étape 3: Supprimer les fonctions et triggers
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS update_user_rating CASCADE;
DROP FUNCTION IF EXISTS validate_artisan_assignment CASCADE;
DROP FUNCTION IF EXISTS validate_mission_status_transition CASCADE;
DROP FUNCTION IF EXISTS calculate_distance CASCADE;
DROP FUNCTION IF EXISTS find_nearby_artisans CASCADE;
DROP FUNCTION IF EXISTS get_artisan_stats CASCADE;

-- Étape 4: Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "earthdistance" CASCADE;

-- Étape 5: Créer la table users avec la bonne structure
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Étape 6: Créer les tables dépendantes
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
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_artisans_category ON artisans(category);
CREATE INDEX idx_artisans_available ON artisans(is_available);

CREATE TABLE clients (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'moderator')),
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('card', 'paypal')),
  last4 TEXT,
  is_default BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_missions_client ON missions(client_id);
CREATE INDEX idx_missions_artisan ON missions(artisan_id);
CREATE INDEX idx_missions_status ON missions(status);

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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

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

-- Étape 7: Créer les fonctions de base
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artisans_updated_at 
  BEFORE UPDATE ON artisans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at 
  BEFORE UPDATE ON clients 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_missions_updated_at 
  BEFORE UPDATE ON missions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Étape 8: Configurer RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies pour users
CREATE POLICY users_select_own ON users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_insert_own ON users 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY users_update_own ON users 
  FOR UPDATE USING (auth.uid() = id);

-- Policies pour artisans
CREATE POLICY artisans_select_all ON artisans 
  FOR SELECT USING (true);

CREATE POLICY artisans_insert_own ON artisans 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY artisans_update_own ON artisans 
  FOR UPDATE USING (auth.uid() = id);

-- Policies pour clients
CREATE POLICY clients_select_own ON clients 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY clients_insert_own ON clients 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY clients_update_own ON clients 
  FOR UPDATE USING (auth.uid() = id);

-- Policies pour missions
CREATE POLICY missions_select_related ON missions 
  FOR SELECT USING (
    auth.uid() = client_id OR 
    auth.uid() = artisan_id OR
    status = 'pending'
  );

CREATE POLICY missions_insert_client ON missions 
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY missions_update_related ON missions 
  FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = artisan_id);

-- Policies pour notifications
CREATE POLICY notifications_own ON notifications 
  FOR ALL USING (auth.uid() = user_id);

-- Policies pour chat
CREATE POLICY chat_messages_select_related ON chat_messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM missions 
      WHERE missions.id = chat_messages.mission_id 
      AND (missions.client_id = auth.uid() OR missions.artisan_id = auth.uid())
    )
  );

CREATE POLICY chat_messages_insert_own ON chat_messages 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Étape 9: Recharger le cache Supabase
NOTIFY pgrst, 'reload schema';

-- Étape 10: Afficher un message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Schema recréé avec succès!';
  RAISE NOTICE '✅ La colonne user_type existe maintenant dans la table users';
  RAISE NOTICE '✅ Cache Supabase rechargé';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Prochaine étape: Essayez de vous inscrire à nouveau dans votre application';
END $$;
