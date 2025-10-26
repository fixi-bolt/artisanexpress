-- ========================================
-- 🚀 ARTISAN CONNECT - SCRIPT COMPLET
-- Géolocalisation + Stripe
-- ========================================
-- À coller dans Supabase SQL Editor
-- Dashboard Supabase > SQL Editor > New Query > Coller > Run
-- ========================================

-- ========================================
-- PARTIE 1: GÉOLOCALISATION
-- ========================================

-- 1.1 Fonction distance (Haversine)
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

-- 1.2 Fonction: Trouver missions à proximité
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

-- 1.3 Fonction: Mettre à jour localisation artisan
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

-- 1.4 Créer index géolocalisés
CREATE INDEX IF NOT EXISTS idx_artisans_location 
ON artisans(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_missions_location 
ON missions(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_missions_pending_by_category 
ON missions(category, created_at DESC) 
WHERE status = 'pending';

-- ========================================
-- PARTIE 2: STRIPE PAYMENT
-- ========================================

-- 2.1 Ajouter colonnes Stripe
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS payment_method TEXT;

ALTER TABLE missions 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- 2.2 Index Stripe
CREATE INDEX IF NOT EXISTS idx_transactions_payment_intent 
ON transactions(payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer 
ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_missions_payment_status 
ON missions(payment_status);

-- 2.3 Fonction: Créditer wallet artisan
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

  RAISE NOTICE 'Wallet credited: artisan_id=%, amount=%', p_artisan_id, p_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2.4 Fonction: Calculer commission
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

-- 2.5 Fonction: Process paiement complet
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

  RAISE NOTICE 'Payment processed: mission=%, amount=%, payout=%', 
    p_mission_id, p_amount_received, v_payout;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- PARTIE 3: PERMISSIONS
-- ========================================

-- Donner accès aux fonctions
GRANT EXECUTE ON FUNCTION calculate_distance_km TO authenticated;
GRANT EXECUTE ON FUNCTION find_nearby_missions TO authenticated;
GRANT EXECUTE ON FUNCTION update_artisan_location TO authenticated;
GRANT EXECUTE ON FUNCTION credit_artisan_wallet TO service_role;
GRANT EXECUTE ON FUNCTION calculate_commission TO authenticated;
GRANT EXECUTE ON FUNCTION process_payment_complete TO service_role;

-- ========================================
-- PARTIE 4: VÉRIFICATIONS
-- ========================================

DO $$
DECLARE
  v_functions INTEGER;
  v_indexes INTEGER;
BEGIN
  -- Compter fonctions
  SELECT COUNT(*) INTO v_functions
  FROM pg_proc 
  WHERE proname IN (
    'calculate_distance_km',
    'find_nearby_missions',
    'update_artisan_location',
    'credit_artisan_wallet',
    'calculate_commission',
    'process_payment_complete'
  );

  -- Compter index
  SELECT COUNT(*) INTO v_indexes
  FROM pg_indexes 
  WHERE indexname IN (
    'idx_artisans_location',
    'idx_missions_location',
    'idx_missions_pending_by_category',
    'idx_transactions_payment_intent',
    'idx_users_stripe_customer'
  );

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 INSTALLATION TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Fonctions créées: %/6', v_functions;
  RAISE NOTICE '✅ Index créés: %/5', v_indexes;
  RAISE NOTICE '';
  RAISE NOTICE '📍 GÉOLOCALISATION:';
  RAISE NOTICE '  • calculate_distance_km()';
  RAISE NOTICE '  • find_nearby_missions()';
  RAISE NOTICE '  • update_artisan_location()';
  RAISE NOTICE '';
  RAISE NOTICE '💳 STRIPE:';
  RAISE NOTICE '  • credit_artisan_wallet()';
  RAISE NOTICE '  • calculate_commission()';
  RAISE NOTICE '  • process_payment_complete()';
  RAISE NOTICE '';
  RAISE NOTICE '🔑 PROCHAINES ÉTAPES:';
  RAISE NOTICE '  1. Configurer clés Stripe dans .env:';
  RAISE NOTICE '     STRIPE_SECRET_KEY=sk_test_...';
  RAISE NOTICE '     EXPO_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...';
  RAISE NOTICE '     STRIPE_WEBHOOK_SECRET=whsec_...';
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
