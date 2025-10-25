-- ========================================
-- FIX SCHEMA - Corrections Critiques
-- À exécuter dans Supabase SQL Editor
-- ========================================

-- ========================================
-- 1️⃣ FIXER LES TYPES ARRAY
-- ========================================

-- Admins
ALTER TABLE public.admins 
ALTER COLUMN permissions TYPE text[] USING permissions::text[];

-- Artisans  
ALTER TABLE public.artisans
ALTER COLUMN specialties TYPE text[] USING specialties::text[],
ALTER COLUMN skills TYPE text[] USING skills::text[],
ALTER COLUMN languages TYPE text[] USING languages::text[],
ALTER COLUMN photos TYPE text[] USING COALESCE(photos::text[], '{}'::text[]),
ALTER COLUMN documents TYPE text[] USING COALESCE(documents::text[], '{}'::text[]);

-- Missions
ALTER TABLE public.missions
ALTER COLUMN photos TYPE text[] USING photos::text[];

-- Subscriptions
ALTER TABLE public.subscriptions
ALTER COLUMN features TYPE text[] USING features::text[];

RAISE NOTICE '✅ Types ARRAY corrigés';

-- ========================================
-- 2️⃣ AJOUTER CONTRAINTES DE COHÉRENCE
-- ========================================

-- Wallets: balances positives
ALTER TABLE public.wallets
DROP CONSTRAINT IF EXISTS valid_wallet_balances,
ADD CONSTRAINT valid_wallet_balances CHECK (
  balance >= 0 
  AND pending_balance >= 0 
  AND total_earnings >= 0 
  AND total_withdrawals >= 0
);

-- Transactions: montants cohérents
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS valid_transaction_amounts,
ADD CONSTRAINT valid_transaction_amounts CHECK (
  amount >= 0
  AND commission_amount >= 0 
  AND artisan_payout >= 0
  AND (commission_amount + artisan_payout) <= amount
);

-- Missions: final_price >= estimated_price
ALTER TABLE public.missions
DROP CONSTRAINT IF EXISTS valid_mission_price,
ADD CONSTRAINT valid_mission_price CHECK (
  final_price IS NULL OR final_price >= estimated_price
);

-- Missions: timeline cohérente
ALTER TABLE public.missions
DROP CONSTRAINT IF EXISTS valid_mission_timeline,
ADD CONSTRAINT valid_mission_timeline CHECK (
  (accepted_at IS NULL OR accepted_at >= created_at)
  AND (completed_at IS NULL OR accepted_at IS NULL OR completed_at >= accepted_at)
);

-- Transactions: timeline cohérente
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS valid_transaction_timeline,
ADD CONSTRAINT valid_transaction_timeline CHECK (
  processed_at IS NULL OR created_at IS NULL OR processed_at >= created_at
);

-- Artisans: lat/lon valides
ALTER TABLE public.artisans
DROP CONSTRAINT IF EXISTS valid_latitude,
DROP CONSTRAINT IF EXISTS valid_longitude,
ADD CONSTRAINT valid_latitude CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
ADD CONSTRAINT valid_longitude CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

-- Missions: lat/lon valides
ALTER TABLE public.missions
DROP CONSTRAINT IF EXISTS valid_mission_latitude,
DROP CONSTRAINT IF EXISTS valid_mission_longitude,
ADD CONSTRAINT valid_mission_latitude CHECK (latitude >= -90 AND latitude <= 90),
ADD CONSTRAINT valid_mission_longitude CHECK (longitude >= -180 AND longitude <= 180);

-- Withdrawals: montants positifs
ALTER TABLE public.withdrawals
DROP CONSTRAINT IF EXISTS valid_withdrawal_amount,
ADD CONSTRAINT valid_withdrawal_amount CHECK (amount > 0);

-- Invoices: montants cohérents
ALTER TABLE public.invoices
DROP CONSTRAINT IF EXISTS valid_invoice_amounts,
ADD CONSTRAINT valid_invoice_amounts CHECK (
  amount >= 0
  AND tax >= 0
  AND total_amount >= amount
);

RAISE NOTICE '✅ Contraintes de cohérence ajoutées';

-- ========================================
-- 3️⃣ AMÉLIORER LA PRÉCISION DES DECIMALS
-- ========================================

-- Users: rating doit accepter 5.00
ALTER TABLE public.users
ALTER COLUMN rating TYPE numeric(3,2);

-- Wallets: utiliser numeric(12,2) pour des montants plus élevés
ALTER TABLE public.wallets
ALTER COLUMN balance TYPE numeric(12,2),
ALTER COLUMN pending_balance TYPE numeric(12,2),
ALTER COLUMN total_earnings TYPE numeric(12,2),
ALTER COLUMN total_withdrawals TYPE numeric(12,2);

-- Transactions: numeric(12,2)
ALTER TABLE public.transactions
ALTER COLUMN amount TYPE numeric(12,2),
ALTER COLUMN commission TYPE numeric(10,4),
ALTER COLUMN commission_amount TYPE numeric(12,2),
ALTER COLUMN artisan_payout TYPE numeric(12,2);

-- Withdrawals: numeric(12,2)
ALTER TABLE public.withdrawals
ALTER COLUMN amount TYPE numeric(12,2);

-- Invoices: numeric(12,2)
ALTER TABLE public.invoices
ALTER COLUMN amount TYPE numeric(12,2),
ALTER COLUMN tax TYPE numeric(12,2),
ALTER COLUMN total_amount TYPE numeric(12,2);

-- Missions: numeric(10,2)
ALTER TABLE public.missions
ALTER COLUMN estimated_price TYPE numeric(10,2),
ALTER COLUMN final_price TYPE numeric(10,2),
ALTER COLUMN commission TYPE numeric(10,4);

-- Artisans: numeric(10,2)
ALTER TABLE public.artisans
ALTER COLUMN hourly_rate TYPE numeric(10,2),
ALTER COLUMN travel_fee TYPE numeric(10,2),
ALTER COLUMN latitude TYPE numeric(10,8),
ALTER COLUMN longitude TYPE numeric(11,8);

-- Subscriptions: numeric(10,2)
ALTER TABLE public.subscriptions
ALTER COLUMN commission TYPE numeric(10,4),
ALTER COLUMN monthly_price TYPE numeric(10,2);

RAISE NOTICE '✅ Précision des decimals améliorée';

-- ========================================
-- 4️⃣ NETTOYER LES DONNÉES INVALIDES
-- ========================================

-- Corriger les wallets avec montants négatifs
UPDATE public.wallets 
SET 
  balance = GREATEST(0, balance),
  pending_balance = GREATEST(0, pending_balance),
  total_earnings = GREATEST(0, total_earnings),
  total_withdrawals = GREATEST(0, total_withdrawals),
  updated_at = NOW()
WHERE balance < 0 OR pending_balance < 0 OR total_earnings < 0 OR total_withdrawals < 0;

-- Corriger les ratings invalides (> 5.00)
UPDATE public.users 
SET rating = 5.00, updated_at = NOW()
WHERE rating > 5.00;

RAISE NOTICE '✅ Données invalides nettoyées';

-- ========================================
-- 5️⃣ VÉRIFICATION FINALE
-- ========================================

DO $$
DECLARE
  v_constraints_count INTEGER;
  v_invalid_wallets INTEGER;
  v_invalid_transactions INTEGER;
BEGIN
  -- Compter les contraintes
  SELECT COUNT(*) INTO v_constraints_count
  FROM information_schema.table_constraints
  WHERE constraint_schema = 'public'
    AND constraint_type = 'CHECK';
  
  -- Vérifier wallets
  SELECT COUNT(*) INTO v_invalid_wallets
  FROM public.wallets
  WHERE balance < 0 OR pending_balance < 0;
  
  -- Vérifier transactions
  SELECT COUNT(*) INTO v_invalid_transactions
  FROM public.transactions
  WHERE (commission_amount + artisan_payout) > amount;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CORRECTIONS APPLIQUÉES';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Contraintes CHECK: %', v_constraints_count;
  RAISE NOTICE 'Wallets invalides: %', v_invalid_wallets;
  RAISE NOTICE 'Transactions invalides: %', v_invalid_transactions;
  RAISE NOTICE '========================================';
  
  IF v_invalid_wallets > 0 OR v_invalid_transactions > 0 THEN
    RAISE WARNING '⚠️ Données invalides détectées - vérification manuelle requise';
  ELSE
    RAISE NOTICE '🚀 SCHÉMA MAINTENANT VALIDE';
  END IF;
END $$;
