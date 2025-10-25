-- ========================================
-- FIX: Supprimer RLS → Modifier Types → Recréer RLS
-- À exécuter dans Supabase SQL Editor
-- ========================================

-- ========================================
-- 1️⃣ SUPPRIMER LES POLICIES QUI BLOQUENT
-- ========================================

DROP POLICY IF EXISTS wallets_update_own ON public.wallets;
DROP POLICY IF EXISTS wallets_select_own ON public.wallets;
DROP POLICY IF EXISTS transactions_select_own ON public.transactions;
DROP POLICY IF EXISTS missions_update_own ON public.missions;
DROP POLICY IF EXISTS missions_select_client ON public.missions;

-- ========================================
-- 2️⃣ MODIFIER LES TYPES (sans blocage)
-- ========================================

-- Users
ALTER TABLE public.users
ALTER COLUMN rating TYPE numeric(3,2);

-- Wallets
ALTER TABLE public.wallets
ALTER COLUMN balance TYPE numeric(12,2),
ALTER COLUMN pending_balance TYPE numeric(12,2),
ALTER COLUMN total_earnings TYPE numeric(12,2),
ALTER COLUMN total_withdrawals TYPE numeric(12,2);

-- Transactions
ALTER TABLE public.transactions
ALTER COLUMN amount TYPE numeric(12,2),
ALTER COLUMN commission TYPE numeric(10,4),
ALTER COLUMN commission_amount TYPE numeric(12,2),
ALTER COLUMN artisan_payout TYPE numeric(12,2);

-- Withdrawals
ALTER TABLE public.withdrawals
ALTER COLUMN amount TYPE numeric(12,2);

-- Invoices
ALTER TABLE public.invoices
ALTER COLUMN amount TYPE numeric(12,2),
ALTER COLUMN tax TYPE numeric(12,2),
ALTER COLUMN total_amount TYPE numeric(12,2);

-- Missions
ALTER TABLE public.missions
ALTER COLUMN estimated_price TYPE numeric(10,2),
ALTER COLUMN final_price TYPE numeric(10,2),
ALTER COLUMN commission TYPE numeric(10,4);

-- Artisans
ALTER TABLE public.artisans
ALTER COLUMN hourly_rate TYPE numeric(10,2),
ALTER COLUMN travel_fee TYPE numeric(10,2),
ALTER COLUMN latitude TYPE numeric(10,8),
ALTER COLUMN longitude TYPE numeric(11,8);

-- Subscriptions
ALTER TABLE public.subscriptions
ALTER COLUMN commission TYPE numeric(10,4),
ALTER COLUMN monthly_price TYPE numeric(10,2);

-- ========================================
-- 3️⃣ FIXER LES TYPES ARRAY
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

-- ========================================
-- 4️⃣ AJOUTER CONTRAINTES
-- ========================================

-- Wallets
ALTER TABLE public.wallets
DROP CONSTRAINT IF EXISTS valid_wallet_balances,
ADD CONSTRAINT valid_wallet_balances CHECK (
  balance >= 0 
  AND pending_balance >= 0 
  AND total_earnings >= 0 
  AND total_withdrawals >= 0
);

-- Transactions
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS valid_transaction_amounts,
ADD CONSTRAINT valid_transaction_amounts CHECK (
  amount >= 0
  AND commission_amount >= 0 
  AND artisan_payout >= 0
  AND (commission_amount + artisan_payout) <= amount
);

-- Missions
ALTER TABLE public.missions
DROP CONSTRAINT IF EXISTS valid_mission_price,
ADD CONSTRAINT valid_mission_price CHECK (
  final_price IS NULL OR final_price >= estimated_price
);

ALTER TABLE public.missions
DROP CONSTRAINT IF EXISTS valid_mission_timeline,
ADD CONSTRAINT valid_mission_timeline CHECK (
  (accepted_at IS NULL OR accepted_at >= created_at)
  AND (completed_at IS NULL OR accepted_at IS NULL OR completed_at >= accepted_at)
);

-- Transactions timeline
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS valid_transaction_timeline,
ADD CONSTRAINT valid_transaction_timeline CHECK (
  processed_at IS NULL OR created_at IS NULL OR processed_at >= created_at
);

-- Artisans lat/lon
ALTER TABLE public.artisans
DROP CONSTRAINT IF EXISTS valid_latitude,
DROP CONSTRAINT IF EXISTS valid_longitude,
ADD CONSTRAINT valid_latitude CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
ADD CONSTRAINT valid_longitude CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

-- Missions lat/lon
ALTER TABLE public.missions
DROP CONSTRAINT IF EXISTS valid_mission_latitude,
DROP CONSTRAINT IF EXISTS valid_mission_longitude,
ADD CONSTRAINT valid_mission_latitude CHECK (latitude >= -90 AND latitude <= 90),
ADD CONSTRAINT valid_mission_longitude CHECK (longitude >= -180 AND longitude <= 180);

-- Withdrawals
ALTER TABLE public.withdrawals
DROP CONSTRAINT IF EXISTS valid_withdrawal_amount,
ADD CONSTRAINT valid_withdrawal_amount CHECK (amount > 0);

-- Invoices
ALTER TABLE public.invoices
DROP CONSTRAINT IF EXISTS valid_invoice_amounts,
ADD CONSTRAINT valid_invoice_amounts CHECK (
  amount >= 0
  AND tax >= 0
  AND total_amount >= amount
);

-- ========================================
-- 5️⃣ RECRÉER LES POLICIES RLS
-- ========================================

-- Wallets policies
CREATE POLICY wallets_select_own ON public.wallets 
FOR SELECT USING (auth.uid() = artisan_id);

CREATE POLICY wallets_update_own ON public.wallets 
FOR UPDATE USING (auth.uid() = artisan_id) 
WITH CHECK (auth.uid() = artisan_id AND balance >= 0 AND pending_balance >= 0);

-- Transactions policy
CREATE POLICY transactions_select_own ON public.transactions 
FOR SELECT USING (auth.uid() = client_id OR auth.uid() = artisan_id);

-- Missions policies
CREATE POLICY missions_select_client ON public.missions 
FOR SELECT USING (
  auth.uid() = client_id 
  OR auth.uid() = artisan_id 
  OR (
    status = 'pending' 
    AND EXISTS (
      SELECT 1 FROM public.artisans a 
      WHERE a.id = auth.uid() 
        AND a.category = public.missions.category 
        AND a.is_available = true 
        AND a.is_suspended = false
    )
  )
);

CREATE POLICY missions_update_own ON public.missions 
FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = artisan_id);

-- ========================================
-- 6️⃣ NETTOYER DONNÉES INVALIDES
-- ========================================

UPDATE public.wallets 
SET 
  balance = GREATEST(0, balance),
  pending_balance = GREATEST(0, pending_balance),
  total_earnings = GREATEST(0, total_earnings),
  total_withdrawals = GREATEST(0, total_withdrawals),
  updated_at = NOW()
WHERE balance < 0 OR pending_balance < 0 OR total_earnings < 0 OR total_withdrawals < 0;

UPDATE public.users 
SET rating = 5.00, updated_at = NOW()
WHERE rating > 5.00;

-- ========================================
-- 7️⃣ VÉRIFICATION FINALE
-- ========================================

DO $$
DECLARE
  v_policies INTEGER;
  v_constraints INTEGER;
  v_invalid_wallets INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policies
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename IN ('wallets', 'transactions', 'missions');
  
  SELECT COUNT(*) INTO v_constraints
  FROM information_schema.table_constraints
  WHERE constraint_schema = 'public'
    AND constraint_type = 'CHECK';
  
  SELECT COUNT(*) INTO v_invalid_wallets
  FROM public.wallets
  WHERE balance < 0 OR pending_balance < 0;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CORRECTIONS TERMINÉES';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Policies RLS recréées: %', v_policies;
  RAISE NOTICE 'Contraintes CHECK: %', v_constraints;
  RAISE NOTICE 'Wallets invalides: %', v_invalid_wallets;
  RAISE NOTICE '========================================';
  
  IF v_invalid_wallets = 0 THEN
    RAISE NOTICE '🚀 SCHÉMA PRODUCTION-READY';
  ELSE
    RAISE WARNING '⚠️ Vérification manuelle requise';
  END IF;
END $$;
