-- ========================================
-- 🔐 STRIPE PAYMENT INTEGRATION - SUPABASE
-- ========================================
-- Copiez et collez ce script dans l'éditeur SQL de Supabase
-- Dashboard > SQL Editor > New Query

-- ========================================
-- 1. AJOUTER COLONNES STRIPE AUX TABLES
-- ========================================

-- Ajouter stripe_customer_id aux clients
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Ajouter payment_intent_id aux transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT UNIQUE;

-- Ajouter payment_status aux missions
ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- ========================================
-- 2. CRÉER INDEX POUR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_transactions_payment_intent 
ON transactions(payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_transactions_status 
ON transactions(status);

CREATE INDEX IF NOT EXISTS idx_missions_payment_status 
ON missions(payment_status);

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer 
ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- ========================================
-- 3. FONCTION: CRÉDITER WALLET ARTISAN
-- ========================================

CREATE OR REPLACE FUNCTION credit_artisan_wallet(
  p_artisan_id UUID,
  p_amount DECIMAL(10,2)
)
RETURNS VOID AS $$
BEGIN
  -- Vérifier si wallet existe
  IF NOT EXISTS (SELECT 1 FROM wallets WHERE artisan_id = p_artisan_id) THEN
    -- Créer wallet si nécessaire
    INSERT INTO wallets (artisan_id, balance, pending_balance, total_earnings)
    VALUES (p_artisan_id, 0, 0, 0);
  END IF;

  -- Créditer le wallet
  UPDATE wallets
  SET 
    balance = balance + p_amount,
    total_earnings = total_earnings + p_amount,
    updated_at = NOW()
  WHERE artisan_id = p_artisan_id;

  -- Logger l'opération
  RAISE NOTICE 'Wallet credited: artisan_id=%, amount=%', p_artisan_id, p_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 4. FONCTION: DÉBITER WALLET ARTISAN (RETRAIT)
-- ========================================

CREATE OR REPLACE FUNCTION debit_artisan_wallet(
  p_artisan_id UUID,
  p_amount DECIMAL(10,2)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance DECIMAL(10,2);
BEGIN
  -- Obtenir solde actuel
  SELECT balance INTO v_current_balance
  FROM wallets
  WHERE artisan_id = p_artisan_id;

  -- Vérifier solde suffisant
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Solde insuffisant: disponible=%, demandé=%', v_current_balance, p_amount;
    RETURN FALSE;
  END IF;

  -- Débiter le wallet
  UPDATE wallets
  SET 
    balance = balance - p_amount,
    total_withdrawals = total_withdrawals + p_amount,
    updated_at = NOW()
  WHERE artisan_id = p_artisan_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 5. FONCTION: CALCULER COMMISSION
-- ========================================

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

-- ========================================
-- 6. TRIGGER: AUTO-CRÉER WALLET ARTISAN
-- ========================================

CREATE OR REPLACE FUNCTION create_wallet_for_artisan()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer wallet automatiquement pour les artisans
  IF NEW.user_type = 'artisan' THEN
    INSERT INTO wallets (artisan_id, balance, pending_balance, total_earnings)
    VALUES (NEW.id, 0, 0, 0)
    ON CONFLICT (artisan_id) DO NOTHING;
    
    RAISE NOTICE 'Wallet created for artisan: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_wallet ON users;
CREATE TRIGGER trigger_create_wallet
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_wallet_for_artisan();

-- ========================================
-- 7. TRIGGER: LOGGER TRANSACTIONS
-- ========================================

CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Logger les changements de statut
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    RAISE NOTICE 'Transaction % changed: % -> %', NEW.id, OLD.status, NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_transactions ON transactions;
CREATE TRIGGER trigger_log_transactions
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION log_transaction_changes();

-- ========================================
-- 8. RLS POLICIES POUR TRANSACTIONS
-- ========================================

-- Activer RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON transactions;
DROP POLICY IF EXISTS "Service role can do anything with transactions" ON transactions;

-- Policy: Clients peuvent voir leurs transactions
CREATE POLICY "Clients can view their transactions"
ON transactions FOR SELECT
USING (
  auth.uid() = client_id
);

-- Policy: Artisans peuvent voir leurs transactions
CREATE POLICY "Artisans can view their transactions"
ON transactions FOR SELECT
USING (
  auth.uid() = artisan_id
);

-- Policy: Service role peut tout faire (pour backend)
CREATE POLICY "Service role full access to transactions"
ON transactions FOR ALL
USING (
  auth.jwt()->>'role' = 'service_role'
);

-- Policy: Insertion via API backend uniquement
CREATE POLICY "Backend can insert transactions"
ON transactions FOR INSERT
WITH CHECK (
  auth.jwt()->>'role' = 'service_role'
);

-- ========================================
-- 9. RLS POLICIES POUR WALLETS
-- ========================================

-- Activer RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Artisans can view their wallet" ON wallets;
DROP POLICY IF EXISTS "Service role can manage wallets" ON wallets;

-- Policy: Artisans peuvent voir leur wallet
CREATE POLICY "Artisans can view their wallet"
ON wallets FOR SELECT
USING (
  auth.uid() = artisan_id
);

-- Policy: Service role peut tout faire
CREATE POLICY "Service role full access to wallets"
ON wallets FOR ALL
USING (
  auth.jwt()->>'role' = 'service_role'
);

-- ========================================
-- 10. VUES POUR STATISTIQUES PAIEMENTS
-- ========================================

-- Vue: Statistiques par artisan
CREATE OR REPLACE VIEW artisan_payment_stats AS
SELECT 
  a.id as artisan_id,
  u.name as artisan_name,
  COUNT(t.id) as total_transactions,
  COALESCE(SUM(t.amount), 0) as total_volume,
  COALESCE(SUM(t.artisan_payout), 0) as total_earnings,
  COALESCE(w.balance, 0) as current_balance,
  COALESCE(w.pending_balance, 0) as pending_balance
FROM artisans a
JOIN users u ON u.id = a.id
LEFT JOIN transactions t ON t.artisan_id = a.id AND t.status = 'completed'
LEFT JOIN wallets w ON w.artisan_id = a.id
GROUP BY a.id, u.name, w.balance, w.pending_balance;

-- Vue: Statistiques par client
CREATE OR REPLACE VIEW client_payment_stats AS
SELECT 
  u.id as client_id,
  u.name as client_name,
  COUNT(t.id) as total_payments,
  COALESCE(SUM(t.amount), 0) as total_spent,
  COUNT(DISTINCT t.artisan_id) as artisans_worked_with
FROM users u
LEFT JOIN transactions t ON t.client_id = u.id AND t.status = 'completed'
WHERE u.user_type = 'client'
GROUP BY u.id, u.name;

-- Vue: Transactions récentes avec détails
CREATE OR REPLACE VIEW recent_transactions_detailed AS
SELECT 
  t.id,
  t.created_at,
  t.amount,
  t.commission_amount,
  t.artisan_payout,
  t.status,
  t.payment_method,
  t.payment_intent_id,
  m.title as mission_title,
  m.category as mission_category,
  uc.name as client_name,
  ua.name as artisan_name
FROM transactions t
JOIN missions m ON m.id = t.mission_id
JOIN users uc ON uc.id = t.client_id
JOIN users ua ON ua.id = t.artisan_id
ORDER BY t.created_at DESC
LIMIT 100;

-- ========================================
-- 11. DONNÉES DE TEST (OPTIONNEL)
-- ========================================

-- Tester la fonction calculate_commission
DO $$
DECLARE
  result RECORD;
BEGIN
  -- Test avec 100€
  SELECT * INTO result FROM calculate_commission(100.00);
  RAISE NOTICE 'Test commission 100€: amount=%, commission=%, payout=%', 
    result.amount, result.commission_amount, result.artisan_payout;
END;
$$;

-- ========================================
-- 12. VÉRIFICATIONS FINALES
-- ========================================

-- Vérifier que toutes les colonnes existent
DO $$
BEGIN
  -- Vérifier stripe_customer_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'stripe_customer_id'
  ) THEN
    RAISE EXCEPTION 'Colonne stripe_customer_id manquante dans users';
  END IF;

  -- Vérifier payment_intent_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'payment_intent_id'
  ) THEN
    RAISE EXCEPTION 'Colonne payment_intent_id manquante dans transactions';
  END IF;

  -- Vérifier payment_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'missions' AND column_name = 'payment_status'
  ) THEN
    RAISE EXCEPTION 'Colonne payment_status manquante dans missions';
  END IF;

  RAISE NOTICE '✅ Toutes les colonnes Stripe sont présentes';
END;
$$;

-- Vérifier que les fonctions existent
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'credit_artisan_wallet') THEN
    RAISE EXCEPTION 'Fonction credit_artisan_wallet manquante';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'debit_artisan_wallet') THEN
    RAISE EXCEPTION 'Fonction debit_artisan_wallet manquante';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_commission') THEN
    RAISE EXCEPTION 'Fonction calculate_commission manquante';
  END IF;

  RAISE NOTICE '✅ Toutes les fonctions Stripe sont créées';
END;
$$;

-- Vérifier les index
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_transactions_payment_intent') THEN
    RAISE WARNING 'Index idx_transactions_payment_intent manquant';
  ELSE
    RAISE NOTICE '✅ Index transactions optimisés';
  END IF;
END;
$$;

-- ========================================
-- ✅ INSTALLATION TERMINÉE
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ========================================';
  RAISE NOTICE '✅ INSTALLATION STRIPE TERMINÉE AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Ce qui a été créé:';
  RAISE NOTICE '  1. Colonnes Stripe (stripe_customer_id, payment_intent_id, payment_status)';
  RAISE NOTICE '  2. Index de performance';
  RAISE NOTICE '  3. Fonctions credit_artisan_wallet, debit_artisan_wallet, calculate_commission';
  RAISE NOTICE '  4. Triggers auto-création wallet';
  RAISE NOTICE '  5. Policies RLS pour transactions et wallets';
  RAISE NOTICE '  6. Vues statistiques paiements';
  RAISE NOTICE '';
  RAISE NOTICE '🔑 Prochaines étapes:';
  RAISE NOTICE '  1. Configurer STRIPE_SECRET_KEY dans .env backend';
  RAISE NOTICE '  2. Configurer STRIPE_PUBLIC_KEY dans .env frontend';
  RAISE NOTICE '  3. Configurer STRIPE_WEBHOOK_SECRET dans Stripe Dashboard';
  RAISE NOTICE '  4. Tester paiement avec carte test 4242 4242 4242 4242';
  RAISE NOTICE '';
  RAISE NOTICE '📖 URL Webhook Stripe: https://votre-domaine.com/api/webhooks/stripe';
  RAISE NOTICE '';
END;
$$;
