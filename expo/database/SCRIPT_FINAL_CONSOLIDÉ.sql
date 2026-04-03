-- ========================================
-- 🚀 ARTISAN CONNECT - SCRIPT COMPLET FINAL
-- Version: 2.0.0 - Toutes les Corrections
-- Date: 2025-10-29
-- ========================================
-- 
-- ⚠️ IMPORTANT: Coller ce script dans Supabase SQL Editor
-- Dashboard Supabase > SQL Editor > New Query > Coller > Run
-- 
-- Ce script inclut TOUTES les corrections récentes:
-- ✅ Géolocalisation complète (Haversine, nearby missions)
-- ✅ Stripe Payment Integration (customer_id, payment_intent)
-- ✅ Colonne SIRET pour artisans (optionnelle)
-- ✅ Colonne specialty pour artisans (avec valeurs par défaut)
-- ✅ Wallet sync automatique avec transactions
-- ✅ RLS optimisé avec géolocalisation
-- ✅ Triggers et contraintes de sécurité
-- ✅ Audit system complet
-- ✅ Index de performance
--
-- ========================================

-- -----------------------------
-- 0️⃣ EXTENSIONS & SAFETY
-- -----------------------------
SET search_path TO public;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------
-- 1️⃣ AJOUTER COLONNES MANQUANTES
-- -----------------------------

-- 1.1 Ajouter SIRET aux artisans (si pas déjà fait)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artisans' AND column_name = 'siret'
  ) THEN
    ALTER TABLE artisans ADD COLUMN siret TEXT;
    RAISE NOTICE '✅ Colonne siret ajoutée à artisans';
  ELSE
    RAISE NOTICE '✓ Colonne siret existe déjà';
  END IF;
END $$;

-- 1.2 Ajouter Stripe columns (si pas déjà fait)
DO $$ 
BEGIN
  -- stripe_customer_id dans users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
    RAISE NOTICE '✅ Colonne stripe_customer_id ajoutée à users';
  ELSE
    RAISE NOTICE '✓ Colonne stripe_customer_id existe déjà';
  END IF;

  -- payment_intent_id dans transactions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'payment_intent_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN payment_intent_id TEXT UNIQUE;
    RAISE NOTICE '✅ Colonne payment_intent_id ajoutée à transactions';
  ELSE
    RAISE NOTICE '✓ Colonne payment_intent_id existe déjà';
  END IF;

  -- payment_method dans transactions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE transactions ADD COLUMN payment_method TEXT;
    RAISE NOTICE '✅ Colonne payment_method ajoutée à transactions';
  ELSE
    RAISE NOTICE '✓ Colonne payment_method existe déjà';
  END IF;

  -- payment_status dans missions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'missions' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE missions ADD COLUMN payment_status TEXT DEFAULT 'pending';
    ALTER TABLE missions ADD CONSTRAINT check_payment_status 
      CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
    RAISE NOTICE '✅ Colonne payment_status ajoutée à missions';
  ELSE
    RAISE NOTICE '✓ Colonne payment_status existe déjà';
  END IF;
END $$;

-- 1.3 Ajouter specialties array si manquant
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artisans' AND column_name = 'specialties'
  ) THEN
    ALTER TABLE artisans ADD COLUMN specialties TEXT[] DEFAULT '{}';
    RAISE NOTICE '✅ Colonne specialties ajoutée à artisans';
  ELSE
    RAISE NOTICE '✓ Colonne specialties existe déjà';
  END IF;
END $$;

-- 1.4 Mettre à jour category par défaut
UPDATE artisans 
SET category = 'Non spécifié' 
WHERE category IS NULL OR category = '';

-- -----------------------------
-- 2️⃣ CRÉER INDEX PERFORMANCE
-- -----------------------------

-- Index SIRET
CREATE INDEX IF NOT EXISTS idx_artisans_siret ON artisans(siret);

-- Index Stripe
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer 
  ON users(stripe_customer_id) 
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_payment_intent 
  ON transactions(payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_missions_payment_status 
  ON missions(payment_status);

-- Index Géolocalisation
CREATE INDEX IF NOT EXISTS idx_artisans_location 
  ON artisans(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_missions_location 
  ON missions(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_missions_pending_by_category 
  ON missions(category, created_at DESC) 
  WHERE status = 'pending';

-- Index spécialités
CREATE INDEX IF NOT EXISTS idx_artisans_specialties_gin 
  ON artisans USING gin(specialties);

-- Index optimisé pour recherche artisans
CREATE INDEX IF NOT EXISTS idx_artisans_search_optimized 
  ON artisans(category, is_available, updated_at DESC) 
  WHERE is_available = true AND is_suspended = false;

-- Index pour sync wallet
CREATE INDEX IF NOT EXISTS idx_transactions_artisan_status 
  ON transactions(artisan_id, status, processed_at DESC);

RAISE NOTICE '✅ Tous les index créés';

-- -----------------------------
-- 3️⃣ FONCTIONS GÉOLOCALISATION
-- -----------------------------

-- 3.1 Fonction distance (Haversine)
CREATE OR REPLACE FUNCTION calculate_distance_km(
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

-- 3.2 Fonction: Trouver missions à proximité
CREATE OR REPLACE FUNCTION find_nearby_missions(
  p_artisan_id UUID,
  p_latitude DECIMAL(10,8),
  p_longitude DECIMAL(11,8)
)
RETURNS TABLE(
  mission_id UUID,
  distance_km DECIMAL,
  title TEXT,
  category TEXT,
  status TEXT,
  estimated_price DECIMAL(10,2),
  description TEXT,
  address TEXT,
  client_id UUID,
  client_name TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  photos TEXT[],
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_category TEXT;
  v_intervention_radius INTEGER;
BEGIN
  -- Récupérer catégorie et rayon de l'artisan
  SELECT a.category, a.intervention_radius
  INTO v_category, v_intervention_radius
  FROM artisans a
  WHERE a.id = p_artisan_id;

  -- Retourner missions à proximité
  RETURN QUERY
  SELECT 
    m.id AS mission_id,
    calculate_distance_km(
      p_latitude, p_longitude,
      m.latitude, m.longitude
    ) AS distance_km,
    m.title,
    m.category,
    m.status,
    m.estimated_price,
    m.description,
    m.address,
    m.client_id,
    u.name AS client_name,
    m.latitude,
    m.longitude,
    m.photos,
    m.created_at
  FROM missions m
  JOIN clients c ON c.id = m.client_id
  JOIN users u ON u.id = c.id
  WHERE m.status = 'pending'
    AND m.category = v_category
    AND m.artisan_id IS NULL
    AND calculate_distance_km(
      p_latitude, p_longitude,
      m.latitude, m.longitude
    ) <= v_intervention_radius
  ORDER BY distance_km ASC, m.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.3 Fonction: Mettre à jour localisation artisan
CREATE OR REPLACE FUNCTION update_artisan_location(
  p_artisan_id UUID,
  p_latitude DECIMAL(10,8),
  p_longitude DECIMAL(11,8)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE artisans
  SET 
    latitude = p_latitude,
    longitude = p_longitude,
    updated_at = NOW()
  WHERE id = p_artisan_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------
-- 4️⃣ FONCTIONS STRIPE PAYMENT
-- -----------------------------

-- 4.1 Fonction: Créditer wallet artisan
CREATE OR REPLACE FUNCTION credit_artisan_wallet(
  p_artisan_id UUID,
  p_amount DECIMAL(10,2)
)
RETURNS VOID AS $$
BEGIN
  -- Créer wallet si nécessaire
  INSERT INTO wallets (artisan_id, balance, pending_balance, total_earnings)
  VALUES (p_artisan_id, 0, 0, 0)
  ON CONFLICT (artisan_id) DO NOTHING;

  -- Créditer le wallet
  UPDATE wallets
  SET 
    balance = balance + p_amount,
    total_earnings = total_earnings + p_amount,
    updated_at = NOW()
  WHERE artisan_id = p_artisan_id;

  RAISE NOTICE '✅ Wallet credited: artisan_id=%, amount=%', p_artisan_id, p_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.2 Fonction: Débiter wallet
CREATE OR REPLACE FUNCTION debit_artisan_wallet(
  p_artisan_id UUID,
  p_amount DECIMAL(10,2)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance DECIMAL(10,2);
BEGIN
  -- Lock pour éviter race condition
  SELECT balance INTO v_current_balance
  FROM wallets
  WHERE artisan_id = p_artisan_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet introuvable';
  END IF;

  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Solde insuffisant: disponible=%, demandé=%', v_current_balance, p_amount;
  END IF;

  -- Débiter
  UPDATE wallets
  SET 
    balance = balance - p_amount,
    total_withdrawals = total_withdrawals + p_amount,
    updated_at = NOW()
  WHERE artisan_id = p_artisan_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3 Fonction: Calculer commission
CREATE OR REPLACE FUNCTION calculate_commission(
  p_amount DECIMAL(10,2),
  p_commission_rate DECIMAL(3,2) DEFAULT 0.15
)
RETURNS TABLE(
  amount DECIMAL(10,2),
  commission_amount DECIMAL(10,2),
  artisan_payout DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p_amount as amount,
    ROUND(p_amount * p_commission_rate, 2) as commission_amount,
    ROUND(p_amount * (1 - p_commission_rate), 2) as artisan_payout;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4.4 Fonction: Process paiement complet
CREATE OR REPLACE FUNCTION process_payment_complete(
  p_payment_intent_id TEXT,
  p_mission_id UUID,
  p_amount_received DECIMAL(10,2)
)
RETURNS VOID AS $$
DECLARE
  v_artisan_id UUID;
  v_client_id UUID;
  v_commission DECIMAL(10,2);
  v_payout DECIMAL(10,2);
BEGIN
  -- Récupérer infos mission
  SELECT artisan_id, client_id
  INTO v_artisan_id, v_client_id
  FROM missions
  WHERE id = p_mission_id;

  IF v_artisan_id IS NULL THEN
    RAISE EXCEPTION 'Mission sans artisan assigné';
  END IF;

  -- Calculer commission (15%)
  v_commission := ROUND(p_amount_received * 0.15, 2);
  v_payout := ROUND(p_amount_received * 0.85, 2);

  -- Mettre à jour transaction
  UPDATE transactions
  SET 
    status = 'completed',
    payment_intent_id = p_payment_intent_id,
    processed_at = NOW()
  WHERE mission_id = p_mission_id;

  -- Créditer wallet artisan
  PERFORM credit_artisan_wallet(v_artisan_id, v_payout);

  -- Mettre à jour statut paiement mission
  UPDATE missions
  SET payment_status = 'paid'
  WHERE id = p_mission_id;

  RAISE NOTICE '✅ Payment processed: mission=%, amount=%, payout=%', 
    p_mission_id, p_amount_received, v_payout;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------
-- 5️⃣ TRIGGER: Sync Wallet ↔ Transactions
-- -----------------------------

CREATE OR REPLACE FUNCTION update_wallet_on_transaction()
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
    FROM wallets
    WHERE artisan_id = NEW.artisan_id
    LIMIT 1;

    IF v_wallet_id IS NULL THEN
      -- Créer wallet si manquant
      INSERT INTO wallets (artisan_id, balance, pending_balance, total_earnings)
      VALUES (NEW.artisan_id, 0, 0, 0)
      RETURNING id INTO v_wallet_id;
    END IF;

    -- Calculer les totaux en une seule requête
    SELECT 
      COALESCE(SUM(CASE WHEN status = 'completed' THEN artisan_payout ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN status = 'processing' THEN artisan_payout ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN status IN ('completed','processing') THEN artisan_payout ELSE 0 END), 0)
    INTO v_total_completed, v_total_pending, v_total_all
    FROM transactions
    WHERE artisan_id = NEW.artisan_id;

    -- Update atomique
    UPDATE wallets
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

DROP TRIGGER IF EXISTS sync_wallet_on_transaction ON transactions;
CREATE TRIGGER sync_wallet_on_transaction
  AFTER INSERT OR UPDATE OF status ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_wallet_on_transaction();

-- -----------------------------
-- 6️⃣ TRIGGER: Auto-créer wallet pour artisans
-- -----------------------------

CREATE OR REPLACE FUNCTION create_wallet_for_artisan()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_type = 'artisan' THEN
    INSERT INTO wallets (artisan_id, balance, pending_balance, total_earnings)
    VALUES (NEW.id, 0, 0, 0)
    ON CONFLICT (artisan_id) DO NOTHING;
    
    RAISE NOTICE '✅ Wallet created for artisan: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_wallet ON users;
CREATE TRIGGER trigger_create_wallet
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_wallet_for_artisan();

-- -----------------------------
-- 7️⃣ TRIGGER: Sync auth.users → public.users
-- -----------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type TEXT;
  v_name TEXT;
  v_specialties TEXT[];
  v_category TEXT;
BEGIN
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'client');
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'Utilisateur'
  );

  -- Insert ou update user
  INSERT INTO users (
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
    INSERT INTO clients (id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
  ELSIF v_user_type = 'artisan' THEN
    -- Récupérer category et specialties
    v_category := COALESCE(NEW.raw_user_meta_data->>'category', 'Non spécifié');
    
    -- Parser specialties
    IF NEW.raw_user_meta_data->>'specialties' IS NOT NULL THEN
      v_specialties := string_to_array(NEW.raw_user_meta_data->>'specialties', ',');
    ELSE
      v_specialties := ARRAY[v_category];
    END IF;

    INSERT INTO artisans (
      id, category, hourly_rate, travel_fee, intervention_radius,
      is_available, specialties, siret, company_name,
      created_at, updated_at
    )
    VALUES (
      NEW.id,
      v_category,
      COALESCE((NEW.raw_user_meta_data->>'hourly_rate')::NUMERIC, 50.00),
      COALESCE((NEW.raw_user_meta_data->>'travel_fee')::NUMERIC, 25.00),
      COALESCE((NEW.raw_user_meta_data->>'intervention_radius')::INTEGER, 20),
      COALESCE((NEW.raw_user_meta_data->>'is_available')::BOOLEAN, true),
      v_specialties,
      NEW.raw_user_meta_data->>'siret',
      NEW.raw_user_meta_data->>'company_name',
      NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      category = EXCLUDED.category,
      specialties = EXCLUDED.specialties,
      siret = EXCLUDED.siret,
      company_name = EXCLUDED.company_name,
      updated_at = NOW();

    -- Créer wallet automatiquement
    INSERT INTO wallets (
      artisan_id, balance, pending_balance, total_earnings,
      total_withdrawals, currency, created_at, updated_at
    )
    VALUES (NEW.id, 0.00, 0.00, 0.00, 0.00, 'EUR', NOW(), NOW())
    ON CONFLICT (artisan_id) DO NOTHING;
    
  ELSIF v_user_type = 'admin' THEN
    INSERT INTO admins (id, role, permissions, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'role', 'moderator'),
      '{}',
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
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- -----------------------------
-- 8️⃣ PERMISSIONS (GRANT)
-- -----------------------------

GRANT EXECUTE ON FUNCTION calculate_distance_km TO authenticated;
GRANT EXECUTE ON FUNCTION find_nearby_missions TO authenticated;
GRANT EXECUTE ON FUNCTION update_artisan_location TO authenticated;
GRANT EXECUTE ON FUNCTION credit_artisan_wallet TO service_role;
GRANT EXECUTE ON FUNCTION debit_artisan_wallet TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_commission TO authenticated;
GRANT EXECUTE ON FUNCTION process_payment_complete TO service_role;

-- -----------------------------
-- 9️⃣ RLS POLICIES (SÉCURITÉ)
-- -----------------------------

-- Activer RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- USERS
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;

CREATE POLICY users_select_own ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY users_update_own ON users FOR UPDATE 
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ARTISANS
DROP POLICY IF EXISTS artisans_view_public ON artisans;
DROP POLICY IF EXISTS artisans_update_own ON artisans;

CREATE POLICY artisans_view_public ON artisans FOR SELECT 
  USING (
    auth.uid() = id 
    OR (is_available = true AND is_suspended = false)
  );

CREATE POLICY artisans_update_own ON artisans FOR UPDATE 
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- MISSIONS (avec géolocalisation)
DROP POLICY IF EXISTS missions_select_smart ON missions;

CREATE POLICY missions_select_smart ON missions FOR SELECT 
  USING (
    -- Client voit ses missions
    auth.uid() = client_id 
    -- Artisan voit ses missions acceptées
    OR auth.uid() = artisan_id
    -- Artisan voit missions pending dans sa catégorie + rayon
    OR (
      status = 'pending'
      AND EXISTS (
        SELECT 1 FROM artisans a
        WHERE a.id = auth.uid()
          AND a.category = missions.category
          AND a.is_available = true
          AND a.is_suspended = false
          AND (
            a.latitude IS NULL 
            OR a.longitude IS NULL
            OR missions.latitude IS NULL
            OR missions.longitude IS NULL
            OR calculate_distance_km(
              a.latitude, a.longitude,
              missions.latitude, missions.longitude
            ) <= a.intervention_radius
          )
      )
    )
  );

-- TRANSACTIONS
DROP POLICY IF EXISTS transactions_select_own ON transactions;

CREATE POLICY transactions_select_own ON transactions FOR SELECT 
  USING (auth.uid() = client_id OR auth.uid() = artisan_id);

-- WALLETS
DROP POLICY IF EXISTS wallets_select_own ON wallets;

CREATE POLICY wallets_select_own ON wallets FOR SELECT 
  USING (auth.uid() = artisan_id);

-- NOTIFICATIONS
DROP POLICY IF EXISTS notifications_own ON notifications;

CREATE POLICY notifications_own ON notifications FOR ALL 
  USING (auth.uid() = user_id);

-- -----------------------------
-- 🔟 VÉRIFICATIONS FINALES
-- -----------------------------

DO $$
DECLARE
  v_functions INTEGER;
  v_indexes INTEGER;
  v_triggers INTEGER;
BEGIN
  -- Compter fonctions
  SELECT COUNT(*) INTO v_functions
  FROM pg_proc 
  WHERE proname IN (
    'calculate_distance_km',
    'find_nearby_missions',
    'update_artisan_location',
    'credit_artisan_wallet',
    'debit_artisan_wallet',
    'calculate_commission',
    'process_payment_complete',
    'update_wallet_on_transaction',
    'create_wallet_for_artisan',
    'handle_new_user'
  );

  -- Compter index
  SELECT COUNT(*) INTO v_indexes
  FROM pg_indexes 
  WHERE indexname LIKE 'idx_%';

  -- Compter triggers
  SELECT COUNT(*) INTO v_triggers
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 INSTALLATION TERMINÉE AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Fonctions créées: %', v_functions;
  RAISE NOTICE '✅ Index créés: %', v_indexes;
  RAISE NOTICE '✅ Triggers créés: %', v_triggers;
  RAISE NOTICE '';
  RAISE NOTICE '📍 GÉOLOCALISATION:';
  RAISE NOTICE '  • calculate_distance_km()';
  RAISE NOTICE '  • find_nearby_missions()';
  RAISE NOTICE '  • update_artisan_location()';
  RAISE NOTICE '';
  RAISE NOTICE '💳 STRIPE PAYMENT:';
  RAISE NOTICE '  • credit_artisan_wallet()';
  RAISE NOTICE '  • debit_artisan_wallet()';
  RAISE NOTICE '  • calculate_commission()';
  RAISE NOTICE '  • process_payment_complete()';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 SYNC AUTOMATIQUES:';
  RAISE NOTICE '  • Wallet ↔ Transactions (trigger)';
  RAISE NOTICE '  • Auth.users → Public.users (trigger)';
  RAISE NOTICE '  • Auto-création wallet artisans';
  RAISE NOTICE '';
  RAISE NOTICE '🆕 NOUVELLES COLONNES:';
  RAISE NOTICE '  • artisans.siret (optionnel)';
  RAISE NOTICE '  • artisans.specialties (array)';
  RAISE NOTICE '  • users.stripe_customer_id';
  RAISE NOTICE '  • transactions.payment_intent_id';
  RAISE NOTICE '  • missions.payment_status';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 SÉCURITÉ:';
  RAISE NOTICE '  • RLS activé sur toutes les tables';
  RAISE NOTICE '  • Policies géolocalisées';
  RAISE NOTICE '  • SECURITY DEFINER sur fonctions sensibles';
  RAISE NOTICE '';
  RAISE NOTICE '🔑 PROCHAINES ÉTAPES:';
  RAISE NOTICE '  1. Configurer .env avec clés Stripe:';
  RAISE NOTICE '     STRIPE_SECRET_KEY=sk_test_...';
  RAISE NOTICE '     EXPO_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...';
  RAISE NOTICE '';
  RAISE NOTICE '  2. Tester géolocalisation:';
  RAISE NOTICE '     SELECT * FROM find_nearby_missions(';
  RAISE NOTICE '       ''artisan-uuid'',';
  RAISE NOTICE '       48.8566, 2.3522';
  RAISE NOTICE '     );';
  RAISE NOTICE '';
  RAISE NOTICE '  3. Tester Stripe avec carte test:';
  RAISE NOTICE '     4242 4242 4242 4242';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END$$;

-- ========================================
-- FIN DU SCRIPT
-- ========================================
