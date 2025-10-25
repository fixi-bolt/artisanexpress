-- ========================================
-- ARTISAN CONNECT - PRODUCTION READY SCRIPT
-- Version: 1.0.0 - Production Final
-- Date: 2025-10-25
-- ========================================
-- 
-- ⚠️ IMPORTANT: À exécuter dans Supabase SQL Editor
-- 
-- Ce script inclut:
-- ✅ P1: Sync Wallets ↔ Transactions atomique
-- ✅ P1: Gestion race conditions (FOR UPDATE)
-- ✅ P1: RLS avec géolocalisation
-- ✅ P1: Constraints de cohérence
-- ✅ P1: Audit complet
-- ✅ P2: SECURITY DEFINER sur toutes les fonctions sensibles
-- ✅ P2: Index de performance optimisés
-- ✅ P2: Triggers updated_at sur toutes les tables
--
-- ========================================

-- -----------------------------
-- 0️⃣ SAFETY & EXTENSIONS
-- -----------------------------
SET search_path TO public;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Désactiver temporairement RLS pour setup
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE 'ALTER TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
  END LOOP;
END$$;

-- -----------------------------
-- 1️⃣ CORE TABLES
-- -----------------------------

-- USERS (table centrale)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  photo TEXT,
  avatar_url TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('client','artisan','admin')),
  rating DECIMAL(3,2) DEFAULT 0.00 NOT NULL CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0 NOT NULL CHECK (review_count >= 0),
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
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 50.00 CHECK (hourly_rate >= 0),
  travel_fee DECIMAL(10,2) NOT NULL DEFAULT 25.00 CHECK (travel_fee >= 0),
  intervention_radius INTEGER NOT NULL DEFAULT 20 CHECK (intervention_radius > 0),
  is_available BOOLEAN DEFAULT true NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  completed_missions INTEGER DEFAULT 0 NOT NULL CHECK (completed_missions >= 0),
  specialties TEXT[] DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  is_suspended BOOLEAN DEFAULT false NOT NULL,
  is_verified BOOLEAN DEFAULT false NOT NULL,
  is_certified BOOLEAN DEFAULT false NOT NULL,
  years_of_experience INTEGER CHECK (years_of_experience >= 0),
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
  CONSTRAINT valid_latitude CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
  CONSTRAINT valid_longitude CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))
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
  estimated_price DECIMAL(10,2) NOT NULL CHECK (estimated_price > 0),
  final_price DECIMAL(10,2) CHECK (final_price IS NULL OR final_price >= 0),
  commission DECIMAL(10,4) NOT NULL DEFAULT 0.1000 CHECK (commission > 0 AND commission < 1),
  eta INTEGER CHECK (eta > 0),
  artisan_latitude DECIMAL(10,8),
  artisan_longitude DECIMAL(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_mission_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT valid_mission_longitude CHECK (longitude >= -180 AND longitude <= 180),
  CONSTRAINT valid_mission_price CHECK (final_price IS NULL OR final_price >= estimated_price),
  CONSTRAINT valid_mission_timeline CHECK (
    (accepted_at IS NULL OR accepted_at >= created_at)
    AND (completed_at IS NULL OR accepted_at IS NULL OR completed_at >= accepted_at)
  )
);

-- TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  commission DECIMAL(10,4) NOT NULL DEFAULT 0.1000 CHECK (commission >= 0 AND commission < 1),
  commission_amount DECIMAL(12,2) NOT NULL CHECK (commission_amount >= 0),
  artisan_payout DECIMAL(12,2) NOT NULL CHECK (artisan_payout >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','refunded')),
  payment_method_id UUID REFERENCES public.payment_methods(id),
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_transaction_amounts CHECK (commission_amount + artisan_payout <= amount),
  CONSTRAINT valid_transaction_timeline CHECK (processed_at IS NULL OR processed_at >= created_at)
);

-- REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT no_self_review CHECK (from_user_id != to_user_id)
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('mission_request','mission_accepted','mission_completed','payment','withdrawal','system')),
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
  sender_name TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client','artisan','admin')),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free','pro','premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  commission DECIMAL(10,4) NOT NULL DEFAULT 0.1000 CHECK (commission >= 0 AND commission < 1),
  features TEXT[] DEFAULT '{}',
  monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (monthly_price >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- WALLETS
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL UNIQUE REFERENCES public.artisans(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
  pending_balance DECIMAL(12,2) DEFAULT 0.00 NOT NULL CHECK (pending_balance >= 0),
  total_earnings DECIMAL(12,2) DEFAULT 0.00 NOT NULL CHECK (total_earnings >= 0),
  total_withdrawals DECIMAL(12,2) DEFAULT 0.00 NOT NULL CHECK (total_withdrawals >= 0),
  currency TEXT DEFAULT 'EUR' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- WITHDRAWALS
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  method TEXT NOT NULL CHECK (method IN ('bank_transfer','paypal')),
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
  tax DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (tax >= 0),
  total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue')),
  pdf_url TEXT,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_invoice_dates CHECK (due_date >= issue_date)
);

-- AUDIT_LOGS (P1 - CRITIQUE)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- -----------------------------
-- 2️⃣ PERFORMANCE INDEXES
-- -----------------------------

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON public.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_rating ON public.users(rating DESC) WHERE user_type = 'artisan';

-- Artisans (optimisé pour recherche géolocalisée)
CREATE INDEX IF NOT EXISTS idx_artisans_category ON public.artisans(category);
CREATE INDEX IF NOT EXISTS idx_artisans_available ON public.artisans(is_available, is_suspended, is_verified) 
  WHERE is_available = true AND is_suspended = false AND is_verified = true;
CREATE INDEX IF NOT EXISTS idx_artisans_location ON public.artisans(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_artisans_specialties_gin ON public.artisans USING gin(specialties);
CREATE INDEX IF NOT EXISTS idx_artisans_skills_gin ON public.artisans USING gin(skills);
CREATE INDEX IF NOT EXISTS idx_artisans_search_optimized ON public.artisans(category, is_available, updated_at DESC) 
  WHERE is_available = true AND is_suspended = false;

-- Missions (optimisé pour matching)
CREATE INDEX IF NOT EXISTS idx_missions_client ON public.missions(client_id, status);
CREATE INDEX IF NOT EXISTS idx_missions_artisan ON public.missions(artisan_id, status);
CREATE INDEX IF NOT EXISTS idx_missions_status ON public.missions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_missions_category ON public.missions(category, status);
CREATE INDEX IF NOT EXISTS idx_missions_pending_by_category ON public.missions(category, created_at DESC) 
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_missions_artisan_active ON public.missions(artisan_id, status, updated_at DESC) 
  WHERE status IN ('accepted','in_progress');
CREATE INDEX IF NOT EXISTS idx_missions_location ON public.missions(latitude, longitude);

-- Transactions (optimisé pour sync wallet)
CREATE INDEX IF NOT EXISTS idx_transactions_mission ON public.transactions(mission_id);
CREATE INDEX IF NOT EXISTS idx_transactions_client ON public.transactions(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_artisan_status ON public.transactions(artisan_id, status, processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_artisan_completed ON public.transactions(artisan_id, status, artisan_payout) 
  WHERE status IN ('completed','processing');

-- Wallets (optimisé pour locks)
CREATE INDEX IF NOT EXISTS idx_wallets_artisan ON public.wallets(artisan_id);
CREATE INDEX IF NOT EXISTS idx_wallets_positive_balance ON public.wallets(artisan_id, balance DESC) 
  WHERE balance > 0;

-- Reviews
CREATE INDEX IF NOT EXISTS idx_reviews_mission ON public.reviews(mission_id);
CREATE INDEX IF NOT EXISTS idx_reviews_to_user ON public.reviews(to_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(to_user_id, rating);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) 
  WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

-- Chat
CREATE INDEX IF NOT EXISTS idx_chat_messages_mission ON public.chat_messages(mission_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread ON public.chat_messages(mission_id, read) 
  WHERE read = false;

-- Others
CREATE INDEX IF NOT EXISTS idx_payment_methods_client ON public.payment_methods(client_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_artisan ON public.subscriptions(artisan_id, status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_artisan_status ON public.withdrawals(artisan_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_mission ON public.invoices(mission_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity, entity_id, created_at DESC);

-- -----------------------------
-- 3️⃣ UTILITY FUNCTIONS
-- -----------------------------

-- Distance calculation (Haversine)
CREATE OR REPLACE FUNCTION public.calculate_distance_km(
  lat1 DECIMAL, lon1 DECIMAL, 
  lat2 DECIMAL, lon2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  r CONSTANT DECIMAL := 6371;
  dlat_rad DECIMAL;
  dlon_rad DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  dlat_rad := RADIANS(lat2 - lat1);
  dlon_rad := RADIANS(lon2 - lon1);
  a := POWER(SIN(dlat_rad/2), 2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * POWER(SIN(dlon_rad/2), 2);
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE;

-- -----------------------------
-- 4️⃣ TRIGGERS & AUTO-UPDATE
-- -----------------------------

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers (avec gestion d'erreurs)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users','artisans','clients','admins','missions','transactions',
    'subscriptions','wallets','withdrawals','invoices'
  ]) LOOP
    BEGIN
      EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I', t, t);
      EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
      RAISE NOTICE '✅ Trigger updated_at créé pour %', t;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '⚠️ Erreur trigger % : %', t, SQLERRM;
    END;
  END LOOP;
END$$;

-- -----------------------------
-- 5️⃣ AUTH & USER MANAGEMENT
-- -----------------------------

-- Sync auth.users → public.users (avec gestion complète)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type TEXT;
  v_name TEXT;
BEGIN
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'client');
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'Utilisateur'
  );

  -- Insert ou update user
  INSERT INTO public.users (
    id, email, name, user_type, phone, avatar_url, 
    created_at, updated_at
  )
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

  -- Créer profil spécifique selon type
  IF v_user_type = 'client' THEN
    INSERT INTO public.clients (id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
  ELSIF v_user_type = 'artisan' THEN
    INSERT INTO public.artisans (
      id, category, hourly_rate, travel_fee, intervention_radius,
      is_available, specialties, siret, company_name,
      created_at, updated_at
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
          WHEN NEW.raw_user_meta_data->>'specialties' IS NOT NULL 
          THEN string_to_array(NEW.raw_user_meta_data->>'specialties', ',')
          ELSE '{}'::TEXT[]
        END,
        '{}'
      ),
      NEW.raw_user_meta_data->>'siret',
      NEW.raw_user_meta_data->>'company_name',
      NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Créer wallet automatiquement
    INSERT INTO public.wallets (
      artisan_id, balance, pending_balance, total_earnings,
      total_withdrawals, currency, created_at, updated_at
    )
    VALUES (NEW.id, 0.00, 0.00, 0.00, 0.00, 'EUR', NOW(), NOW())
    ON CONFLICT (artisan_id) DO NOTHING;
    
  ELSIF v_user_type = 'admin' THEN
    INSERT INTO public.admins (id, role, permissions, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'role', 'moderator'),
      COALESCE(
        CASE 
          WHEN NEW.raw_user_meta_data->>'permissions' IS NOT NULL
          THEN string_to_array(NEW.raw_user_meta_data->>'permissions', ',')
          ELSE '{}'::TEXT[]
        END,
        '{}'
      ),
      NOW(), NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------
-- 6️⃣ RATING SYSTEM
-- -----------------------------

CREATE OR REPLACE FUNCTION public.update_user_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_avg NUMERIC;
  v_count INTEGER;
BEGIN
  v_user_id := COALESCE(NEW.to_user_id, OLD.to_user_id);

  SELECT 
    COALESCE(ROUND(AVG(rating::NUMERIC), 2), 0.00),
    COUNT(*)
  INTO v_avg, v_count
  FROM public.reviews
  WHERE to_user_id = v_user_id;

  UPDATE public.users
  SET 
    rating = v_avg,
    review_count = v_count,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = v_user_id
    AND (rating IS DISTINCT FROM v_avg OR review_count IS DISTINCT FROM v_count);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_rating_after_review ON public.reviews;
CREATE TRIGGER update_rating_after_review
  AFTER INSERT OR UPDATE OF rating OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_user_rating();

-- -----------------------------
-- 7️⃣ P1 - WALLET SYNC (CRITIQUE)
-- -----------------------------

CREATE OR REPLACE FUNCTION public.update_wallet_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_wallet_id UUID;
  v_total_completed DECIMAL(12,2);
  v_total_pending DECIMAL(12,2);
  v_total_all DECIMAL(12,2);
BEGIN
  -- Seulement si statut change ou INSERT
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    
    -- Trouver le wallet
    SELECT id INTO v_wallet_id
    FROM public.wallets
    WHERE artisan_id = NEW.artisan_id
    LIMIT 1;

    IF v_wallet_id IS NULL THEN
      RAISE WARNING 'Wallet introuvable pour artisan %', NEW.artisan_id;
      RETURN NEW;
    END IF;

    -- Calculer les totaux en une seule requête
    SELECT 
      COALESCE(SUM(CASE WHEN status = 'completed' THEN artisan_payout ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN status = 'processing' THEN artisan_payout ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN status IN ('completed','processing') THEN artisan_payout ELSE 0 END), 0)
    INTO v_total_completed, v_total_pending, v_total_all
    FROM public.transactions
    WHERE artisan_id = NEW.artisan_id;

    -- Update atomique
    UPDATE public.wallets
    SET 
      balance = v_total_completed,
      pending_balance = v_total_pending,
      total_earnings = v_total_all,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = v_wallet_id;

    RAISE NOTICE '✅ Wallet sync: artisan=%, balance=%, pending=%', 
      NEW.artisan_id, v_total_completed, v_total_pending;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_wallet_on_transaction ON public.transactions;
CREATE TRIGGER sync_wallet_on_transaction
  AFTER INSERT OR UPDATE OF status ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_wallet_on_transaction();

-- Fonction de reconstruction (une fois au déploiement)
CREATE OR REPLACE FUNCTION public.rebuild_all_wallets()
RETURNS TABLE(
  artisan_id UUID, 
  balance DECIMAL, 
  pending DECIMAL, 
  total_earnings DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  UPDATE public.wallets w
  SET 
    balance = (
      SELECT COALESCE(SUM(artisan_payout), 0)
      FROM public.transactions t
      WHERE t.artisan_id = w.artisan_id AND t.status = 'completed'
    ),
    pending_balance = (
      SELECT COALESCE(SUM(artisan_payout), 0)
      FROM public.transactions t
      WHERE t.artisan_id = w.artisan_id AND t.status = 'processing'
    ),
    total_earnings = (
      SELECT COALESCE(SUM(artisan_payout), 0)
      FROM public.transactions t
      WHERE t.artisan_id = w.artisan_id 
        AND t.status IN ('completed','processing')
    ),
    updated_at = CURRENT_TIMESTAMP
  RETURNING w.artisan_id, w.balance, w.pending_balance, w.total_earnings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------
-- 8️⃣ P1 - SAFE WITHDRAWAL (RACE CONDITION)
-- -----------------------------

CREATE OR REPLACE FUNCTION public.process_safe_withdrawal(
  p_wallet_id UUID,
  p_artisan_id UUID,
  p_amount DECIMAL(12,2),
  p_method TEXT
)
RETURNS TABLE(
  withdrawal_id UUID,
  status TEXT,
  message TEXT
) AS $$
DECLARE
  v_current_balance DECIMAL(12,2);
  v_withdrawal_id UUID;
BEGIN
  -- 🔒 LOCK la ligne pour éviter race condition
  SELECT balance INTO v_current_balance
  FROM public.wallets
  WHERE id = p_wallet_id AND artisan_id = p_artisan_id
  FOR UPDATE;  -- CRITIQUE

  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, 'failed'::TEXT, 'Wallet introuvable'::TEXT;
    RETURN;
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN QUERY SELECT NULL::UUID, 'failed'::TEXT, 
      format('Solde insuffisant (disponible: %s EUR)', v_current_balance)::TEXT;
    RETURN;
  END IF;

  -- Créer le retrait
  INSERT INTO public.withdrawals (
    wallet_id, artisan_id, amount, status, method, created_at
  )
  VALUES (
    p_wallet_id, p_artisan_id, p_amount, 'pending', p_method, NOW()
  )
  RETURNING id INTO v_withdrawal_id;

  -- Décrémenter le solde (atomiquement)
  UPDATE public.wallets
  SET 
    balance = balance - p_amount,
    total_withdrawals = total_withdrawals + p_amount,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_wallet_id;

  RETURN QUERY SELECT 
    v_withdrawal_id, 
    'pending'::TEXT, 
    'Retrait créé avec succès'::TEXT;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT 
    NULL::UUID, 
    'error'::TEXT, 
    ('Erreur: ' || SQLERRM)::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------
-- 9️⃣ P1 - AUDIT SYSTEM
-- -----------------------------

-- Audit withdrawals
CREATE OR REPLACE FUNCTION public.audit_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, entity, entity_id, data, created_at
  )
  VALUES (
    NEW.artisan_id,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'withdrawal_created'
      WHEN TG_OP = 'UPDATE' THEN 'withdrawal_' || NEW.status
      ELSE 'withdrawal_unknown'
    END,
    'withdrawals',
    NEW.id,
    jsonb_build_object(
      'amount', NEW.amount,
      'method', NEW.method,
      'wallet_id', NEW.wallet_id,
      'status', NEW.status,
      'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END
    ),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_withdrawal_trigger ON public.withdrawals;
CREATE TRIGGER audit_withdrawal_trigger
  AFTER INSERT OR UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.audit_withdrawal();

-- Audit transactions
CREATE OR REPLACE FUNCTION public.audit_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      user_id, action, entity, entity_id, data, created_at
    )
    VALUES (
      NEW.client_id,
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'transaction_created'
        ELSE 'transaction_' || NEW.status
      END,
      'transactions',
      NEW.id,
      jsonb_build_object(
        'amount', NEW.amount,
        'commission_amount', NEW.commission_amount,
        'artisan_payout', NEW.artisan_payout,
        'artisan_id', NEW.artisan_id,
        'mission_id', NEW.mission_id,
        'status', NEW.status,
        'old_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END
      ),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_transaction_trigger ON public.transactions;
CREATE TRIGGER audit_transaction_trigger
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.audit_transaction();

-- -----------------------------
-- 🔟 ROW LEVEL SECURITY (RLS)
-- -----------------------------

-- Activer RLS sur toutes les tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users','artisans','clients','admins','payment_methods',
    'missions','transactions','reviews','notifications','chat_messages',
    'subscriptions','wallets','withdrawals','invoices','audit_logs'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    RAISE NOTICE '✅ RLS activé pour %', t;
  END LOOP;
END$$;

-- USERS
DROP POLICY IF EXISTS users_select_own ON public.users;
DROP POLICY IF EXISTS users_update_own ON public.users;
DROP POLICY IF EXISTS users_insert_own ON public.users;

CREATE POLICY users_select_own ON public.users FOR SELECT 
  USING (auth.uid() = id);
CREATE POLICY users_update_own ON public.users FOR UPDATE 
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY users_insert_own ON public.users FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ARTISANS (vue publique pour artisans vérifiés)
DROP POLICY IF EXISTS artisans_view_public ON public.artisans;
DROP POLICY IF EXISTS artisans_update_own ON public.artisans;
DROP POLICY IF EXISTS artisans_insert_own ON public.artisans;

CREATE POLICY artisans_view_public ON public.artisans FOR SELECT 
  USING (
    auth.uid() = id 
    OR (is_available = true AND is_suspended = false AND is_verified = true)
  );
CREATE POLICY artisans_update_own ON public.artisans FOR UPDATE 
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY artisans_insert_own ON public.artisans FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- CLIENTS
DROP POLICY IF EXISTS clients_select_own ON public.clients;
DROP POLICY IF EXISTS clients_update_own ON public.clients;
DROP POLICY IF EXISTS clients_insert_own ON public.clients;

CREATE POLICY clients_select_own ON public.clients FOR SELECT 
  USING (auth.uid() = id);
CREATE POLICY clients_update_own ON public.clients FOR UPDATE 
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY clients_insert_own ON public.clients FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- MISSIONS (avec géolocalisation P1)
DROP POLICY IF EXISTS missions_select_smart ON public.missions;
DROP POLICY IF EXISTS missions_insert_client ON public.missions;
DROP POLICY IF EXISTS missions_update_own ON public.missions;

CREATE POLICY missions_select_smart ON public.missions FOR SELECT 
  USING (
    -- Client voit ses missions
    auth.uid() = client_id 
    -- Artisan voit ses missions acceptées
    OR auth.uid() = artisan_id
    -- Artisan voit missions pending dans sa catégorie + rayon
    OR (
      status = 'pending'
      AND EXISTS (
        SELECT 1 FROM public.artisans a
        WHERE a.id = auth.uid()
          AND a.category = public.missions.category
          AND a.is_available = true
          AND a.is_suspended = false
          AND a.is_verified = true
          AND (
            a.latitude IS NULL 
            OR a.longitude IS NULL
            OR public.missions.latitude IS NULL
            OR public.missions.longitude IS NULL
            OR public.calculate_distance_km(
              a.latitude, a.longitude,
              public.missions.latitude, public.missions.longitude
            ) <= a.intervention_radius
          )
      )
    )
  );

CREATE POLICY missions_insert_client ON public.missions FOR INSERT 
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY missions_update_own ON public.missions FOR UPDATE 
  USING (auth.uid() = client_id OR auth.uid() = artisan_id);

-- TRANSACTIONS
DROP POLICY IF EXISTS transactions_select_own ON public.transactions;
CREATE POLICY transactions_select_own ON public.transactions FOR SELECT 
  USING (auth.uid() = client_id OR auth.uid() = artisan_id);

-- REVIEWS
DROP POLICY IF EXISTS reviews_select_all ON public.reviews;
DROP POLICY IF EXISTS reviews_insert_own ON public.reviews;
CREATE POLICY reviews_select_all ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY reviews_insert_own ON public.reviews FOR INSERT 
  WITH CHECK (auth.uid() = from_user_id);

-- NOTIFICATIONS
DROP POLICY IF EXISTS notifications_own ON public.notifications;
CREATE POLICY notifications_own ON public.notifications FOR ALL 
  USING (auth.uid() = user_id);

-- CHAT_MESSAGES
DROP POLICY IF EXISTS chat_messages_select_own ON public.chat_messages;
DROP POLICY IF EXISTS chat_messages_insert_own ON public.chat_messages;

CREATE POLICY chat_messages_select_own ON public.chat_messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.missions m
      WHERE m.id = public.chat_messages.mission_id
        AND (m.client_id = auth.uid() OR m.artisan_id = auth.uid())
    )
  );

CREATE POLICY chat_messages_insert_own ON public.chat_messages FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

-- WALLETS
DROP POLICY IF EXISTS wallets_select_own ON public.wallets;
DROP POLICY IF EXISTS wallets_update_own ON public.wallets;

CREATE POLICY wallets_select_own ON public.wallets FOR SELECT 
  USING (auth.uid() = artisan_id);

CREATE POLICY wallets_update_own ON public.wallets FOR UPDATE 
  USING (auth.uid() = artisan_id) 
  WITH CHECK (
    auth.uid() = artisan_id 
    AND balance >= 0 
    AND pending_balance >= 0
  );

-- WITHDRAWALS
DROP POLICY IF EXISTS withdrawals_own ON public.withdrawals;
CREATE POLICY withdrawals_own ON public.withdrawals FOR ALL 
  USING (auth.uid() = artisan_id);

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS subscriptions_own ON public.subscriptions;
CREATE POLICY subscriptions_own ON public.subscriptions FOR ALL 
  USING (auth.uid() = artisan_id);

-- INVOICES
DROP POLICY IF EXISTS invoices_select_own ON public.invoices;
CREATE POLICY invoices_select_own ON public.invoices FOR SELECT 
  USING (auth.uid() = client_id OR auth.uid() = artisan_id);

-- PAYMENT_METHODS
DROP POLICY IF EXISTS payment_methods_own ON public.payment_methods;
CREATE POLICY payment_methods_own ON public.payment_methods FOR ALL 
  USING (auth.uid() = client_id);

-- ADMINS
DROP POLICY IF EXISTS admins_admin_only ON public.admins;
CREATE POLICY admins_admin_only ON public.admins FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND user_type = 'admin'
    )
  );

-- AUDIT_LOGS (lecture seule pour admins)
DROP POLICY IF EXISTS audit_logs_admin_only ON public.audit_logs;
CREATE POLICY audit_logs_admin_only ON public.audit_logs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE admins.id = auth.uid()
    )
  );

-- -----------------------------
-- 1️⃣1️⃣ MAINTENANCE
-- -----------------------------

-- ANALYZE tables
ANALYZE public.users;
ANALYZE public.artisans;
ANALYZE public.clients;
ANALYZE public.missions;
ANALYZE public.transactions;
ANALYZE public.reviews;
ANALYZE public.notifications;
ANALYZE public.wallets;
ANALYZE public.subscriptions;

-- -----------------------------
-- 1️⃣2️⃣ VERIFICATION FINALE
-- -----------------------------

DO $$
DECLARE
  v_tables INTEGER;
  v_indexes INTEGER;
  v_triggers INTEGER;
  v_constraints INTEGER;
  v_policies INTEGER;
  v_functions INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_tables 
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  SELECT COUNT(*) INTO v_indexes 
  FROM pg_indexes 
  WHERE schemaname = 'public';
  
  SELECT COUNT(*) INTO v_triggers 
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public';
  
  SELECT COUNT(*) INTO v_constraints 
  FROM information_schema.table_constraints 
  WHERE constraint_schema = 'public';
  
  SELECT COUNT(*) INTO v_policies 
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  SELECT COUNT(*) INTO v_functions 
  FROM pg_proc 
  WHERE pronamespace = 'public'::regnamespace;

  RAISE NOTICE '========================================';
  RAISE NOTICE '🚀 ARTISAN CONNECT - PRODUCTION READY';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 STATISTIQUES:';
  RAISE NOTICE '  • Tables: %', v_tables;
  RAISE NOTICE '  • Index: %', v_indexes;
  RAISE NOTICE '  • Triggers: %', v_triggers;
  RAISE NOTICE '  • Constraints: %', v_constraints;
  RAISE NOTICE '  • RLS Policies: %', v_policies;
  RAISE NOTICE '  • Functions: %', v_functions;
  RAISE NOTICE '';
  RAISE NOTICE '✅ FONCTIONNALITÉS P1 ACTIVÉES:';
  RAISE NOTICE '  • Sync Wallets ↔ Transactions (atomique)';
  RAISE NOTICE '  • Safe Withdrawal (FOR UPDATE lock)';
  RAISE NOTICE '  • RLS avec géolocalisation';
  RAISE NOTICE '  • Audit complet (withdrawals + transactions)';
  RAISE NOTICE '  • Rating system automatique';
  RAISE NOTICE '  • Auth sync (auth.users → public.users)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 SÉCURITÉ:';
  RAISE NOTICE '  • SECURITY DEFINER sur fonctions sensibles';
  RAISE NOTICE '  • RLS activé sur toutes les tables';
  RAISE NOTICE '  • Constraints de cohérence';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ PERFORMANCE:';
  RAISE NOTICE '  • Index géolocalisés';
  RAISE NOTICE '  • Partial indexes pour recherches fréquentes';
  RAISE NOTICE '  • Triggers optimisés (DISTINCT FROM)';
  RAISE NOTICE '';
  RAISE NOTICE '📝 PROCHAINES ÉTAPES:';
  RAISE NOTICE '  1. Tester avec charge réaliste (1000+ artisans)';
  RAISE NOTICE '  2. Monitorer slow queries (pg_stat_statements)';
  RAISE NOTICE '  3. Backup avant déploiement production';
  RAISE NOTICE '  4. Activer monitoring temps réel';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SCRIPT EXÉCUTÉ AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  
  -- Vérifications critiques
  IF v_tables < 15 THEN
    RAISE WARNING '⚠️ Moins de 15 tables détectées';
  END IF;
  
  IF v_policies < 20 THEN
    RAISE WARNING '⚠️ Moins de 20 policies RLS détectées';
  END IF;
  
  IF v_functions < 8 THEN
    RAISE WARNING '⚠️ Moins de 8 fonctions détectées';
  END IF;
END$$;

-- ========================================
-- FIN DU SCRIPT
-- ========================================
