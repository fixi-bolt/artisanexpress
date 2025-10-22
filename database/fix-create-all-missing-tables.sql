-- ========================================
-- 🔧 CORRECTION COMPLÈTE - Créer toutes les tables manquantes
-- ========================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "earthdistance" CASCADE;

-- ========================================
-- Vérifier et créer la fonction update_updated_at_column
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 💵 WALLETS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS wallets (
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

CREATE INDEX IF NOT EXISTS idx_wallets_artisan ON wallets(artisan_id);

DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
CREATE TRIGGER update_wallets_updated_at 
  BEFORE UPDATE ON wallets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 💸 WITHDRAWALS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS withdrawals (
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

CREATE INDEX IF NOT EXISTS idx_withdrawals_wallet ON withdrawals(wallet_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_artisan ON withdrawals(artisan_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON withdrawals;
CREATE TRIGGER update_withdrawals_updated_at 
  BEFORE UPDATE ON withdrawals 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 🔐 ROW LEVEL SECURITY
-- ========================================

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS wallets_own ON wallets;
DROP POLICY IF EXISTS withdrawals_own ON withdrawals;

-- Créer les nouvelles policies
CREATE POLICY wallets_own ON wallets 
  FOR ALL 
  USING (auth.uid() = artisan_id);

CREATE POLICY withdrawals_own ON withdrawals 
  FOR ALL 
  USING (auth.uid() = artisan_id);

-- ========================================
-- ✅ VÉRIFICATION
-- ========================================

DO $$
DECLARE
  v_tables_created TEXT[] := ARRAY[]::TEXT[];
  v_tables_missing TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Vérifier wallets
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'wallets'
  ) THEN
    v_tables_created := array_append(v_tables_created, 'wallets');
  ELSE
    v_tables_missing := array_append(v_tables_missing, 'wallets');
  END IF;

  -- Vérifier withdrawals
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'withdrawals'
  ) THEN
    v_tables_created := array_append(v_tables_created, 'withdrawals');
  ELSE
    v_tables_missing := array_append(v_tables_missing, 'withdrawals');
  END IF;

  -- Afficher les résultats
  IF array_length(v_tables_created, 1) > 0 THEN
    RAISE NOTICE '✅ Tables créées avec succès: %', array_to_string(v_tables_created, ', ');
  END IF;

  IF array_length(v_tables_missing, 1) > 0 THEN
    RAISE WARNING '❌ Tables manquantes: %', array_to_string(v_tables_missing, ', ');
  ELSE
    RAISE NOTICE '✅✅✅ Toutes les tables ont été créées avec succès!';
  END IF;
END $$;

-- Afficher la structure de la table wallets
SELECT 
  '=== STRUCTURE TABLE WALLETS ===' as info,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'wallets'
ORDER BY ordinal_position;

-- Afficher la structure de la table withdrawals
SELECT 
  '=== STRUCTURE TABLE WITHDRAWALS ===' as info,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'withdrawals'
ORDER BY ordinal_position;
