-- ========================================
-- FIX: Modifier les types de colonnes avec RLS
-- Étape 1: Supprimer les policies dépendantes
-- Étape 2: Modifier les types
-- Étape 3: Recréer les policies
-- ========================================

-- ========================================
-- ÉTAPE 1: SUPPRIMER LES POLICIES DÉPENDANTES
-- ========================================

DROP POLICY IF EXISTS missions_select_smart ON public.missions;
DROP POLICY IF EXISTS missions_select_client ON public.missions;
DROP POLICY IF EXISTS wallets_update_own ON public.wallets;

-- ========================================
-- ÉTAPE 2: MODIFIER LES TYPES DE COLONNES
-- ========================================

-- Missions: latitude/longitude
ALTER TABLE public.missions 
  ALTER COLUMN latitude TYPE DECIMAL(10,8) USING latitude::DECIMAL(10,8);

ALTER TABLE public.missions 
  ALTER COLUMN longitude TYPE DECIMAL(11,8) USING longitude::DECIMAL(11,8);

ALTER TABLE public.missions 
  ALTER COLUMN artisan_latitude TYPE DECIMAL(10,8) USING artisan_latitude::DECIMAL(10,8);

ALTER TABLE public.missions 
  ALTER COLUMN artisan_longitude TYPE DECIMAL(11,8) USING artisan_longitude::DECIMAL(11,8);

-- Artisans: latitude/longitude
ALTER TABLE public.artisans 
  ALTER COLUMN latitude TYPE DECIMAL(10,8) USING latitude::DECIMAL(10,8);

ALTER TABLE public.artisans 
  ALTER COLUMN longitude TYPE DECIMAL(11,8) USING longitude::DECIMAL(11,8);

-- Wallets: montants
ALTER TABLE public.wallets 
  ALTER COLUMN balance TYPE DECIMAL(12,2) USING balance::DECIMAL(12,2);

ALTER TABLE public.wallets 
  ALTER COLUMN pending_balance TYPE DECIMAL(12,2) USING pending_balance::DECIMAL(12,2);

ALTER TABLE public.wallets 
  ALTER COLUMN total_earnings TYPE DECIMAL(12,2) USING total_earnings::DECIMAL(12,2);

ALTER TABLE public.wallets 
  ALTER COLUMN total_withdrawals TYPE DECIMAL(12,2) USING total_withdrawals::DECIMAL(12,2);

-- Transactions: montants
ALTER TABLE public.transactions 
  ALTER COLUMN amount TYPE DECIMAL(12,2) USING amount::DECIMAL(12,2);

ALTER TABLE public.transactions 
  ALTER COLUMN commission_amount TYPE DECIMAL(12,2) USING commission_amount::DECIMAL(12,2);

ALTER TABLE public.transactions 
  ALTER COLUMN artisan_payout TYPE DECIMAL(12,2) USING artisan_payout::DECIMAL(12,2);

-- Withdrawals: montants
ALTER TABLE public.withdrawals 
  ALTER COLUMN amount TYPE DECIMAL(12,2) USING amount::DECIMAL(12,2);

-- Invoices: montants
ALTER TABLE public.invoices 
  ALTER COLUMN amount TYPE DECIMAL(12,2) USING amount::DECIMAL(12,2);

ALTER TABLE public.invoices 
  ALTER COLUMN tax TYPE DECIMAL(12,2) USING tax::DECIMAL(12,2);

ALTER TABLE public.invoices 
  ALTER COLUMN total_amount TYPE DECIMAL(12,2) USING total_amount::DECIMAL(12,2);

-- Artisans: tarifs
ALTER TABLE public.artisans 
  ALTER COLUMN hourly_rate TYPE DECIMAL(10,2) USING hourly_rate::DECIMAL(10,2);

ALTER TABLE public.artisans 
  ALTER COLUMN travel_fee TYPE DECIMAL(10,2) USING travel_fee::DECIMAL(10,2);

-- Missions: prix
ALTER TABLE public.missions 
  ALTER COLUMN estimated_price TYPE DECIMAL(10,2) USING estimated_price::DECIMAL(10,2);

ALTER TABLE public.missions 
  ALTER COLUMN final_price TYPE DECIMAL(10,2) USING final_price::DECIMAL(10,2);

ALTER TABLE public.missions 
  ALTER COLUMN commission TYPE DECIMAL(10,4) USING commission::DECIMAL(10,4);

-- Transactions: commission
ALTER TABLE public.transactions 
  ALTER COLUMN commission TYPE DECIMAL(10,4) USING commission::DECIMAL(10,4);

-- Subscriptions: commission et prix
ALTER TABLE public.subscriptions 
  ALTER COLUMN commission TYPE DECIMAL(10,4) USING commission::DECIMAL(10,4);

ALTER TABLE public.subscriptions 
  ALTER COLUMN monthly_price TYPE DECIMAL(10,2) USING monthly_price::DECIMAL(10,2);

-- Users: rating
ALTER TABLE public.users 
  ALTER COLUMN rating TYPE DECIMAL(3,2) USING rating::DECIMAL(3,2);

-- ========================================
-- ÉTAPE 3: RECRÉER LES POLICIES
-- ========================================

-- Missions: SELECT avec géolocalisation
CREATE POLICY missions_select_client ON public.missions 
FOR SELECT 
USING (
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
        AND (
          a.latitude IS NULL 
          OR a.longitude IS NULL 
          OR public.calculate_distance_km(
            a.latitude, 
            a.longitude, 
            public.missions.latitude, 
            public.missions.longitude
          ) <= a.intervention_radius
        )
    )
  )
);

-- Wallets: UPDATE avec vérification des montants
CREATE POLICY wallets_update_own ON public.wallets 
FOR UPDATE 
USING (auth.uid() = artisan_id) 
WITH CHECK (
  auth.uid() = artisan_id 
  AND balance >= 0 
  AND pending_balance >= 0
);

-- ========================================
-- VÉRIFICATION
-- ========================================

DO $$
DECLARE
  v_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policies 
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Types de colonnes modifiés';
  RAISE NOTICE '✅ Policies RLS recréées: %', v_policies;
  RAISE NOTICE '========================================';
END $$;
