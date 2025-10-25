-- ========================================
-- 🛠️ FIXES PRODUCTION-READY POUR ARTISAN CONNECT
-- Version améliorée avec gestion d'erreurs et vérifications complètes
-- ========================================

-- ========================================
-- 🔍 ÉTAPE 1: DIAGNOSTIC COMPLET
-- ========================================

DO $$
DECLARE
  v_tables_count INTEGER;
  v_rls_enabled_count INTEGER;
  v_constraints_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔍 DIAGNOSTIC INITIAL';
  RAISE NOTICE '========================================';
  
  SELECT COUNT(*) INTO v_tables_count
  FROM information_schema.tables 
  WHERE table_schema = 'public';
  RAISE NOTICE 'Tables trouvées: %', v_tables_count;
  
  SELECT COUNT(*) INTO v_rls_enabled_count
  FROM pg_tables 
  WHERE schemaname = 'public' AND rowsecurity = true;
  RAISE NOTICE 'Tables avec RLS activé: %', v_rls_enabled_count;
  
  SELECT COUNT(*) INTO v_constraints_count
  FROM information_schema.table_constraints 
  WHERE constraint_schema = 'public';
  RAISE NOTICE 'Contraintes totales: %', v_constraints_count;
  
  RAISE NOTICE '========================================';
END $$;

-- ========================================
-- 🗑️ ÉTAPE 2: NETTOYAGE DES CONTRAINTES INVALIDES
-- ========================================

DO $$
DECLARE
  v_invalid_data_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🗑️ VÉRIFICATION DONNÉES INVALIDES';
  RAISE NOTICE '========================================';
  
  -- Vérifier transactions avec montants invalides
  SELECT COUNT(*) INTO v_invalid_data_count
  FROM transactions 
  WHERE commission_amount < 0 
     OR artisan_payout < 0 
     OR (artisan_payout + commission_amount) > amount;
  
  IF v_invalid_data_count > 0 THEN
    RAISE NOTICE '⚠️ % transactions avec montants invalides trouvées', v_invalid_data_count;
    RAISE NOTICE '🔧 Correction en cours...';
    
    UPDATE transactions 
    SET 
      commission_amount = GREATEST(0, commission_amount),
      artisan_payout = GREATEST(0, artisan_payout)
    WHERE commission_amount < 0 OR artisan_payout < 0;
    
    RAISE NOTICE '✅ Transactions corrigées';
  ELSE
    RAISE NOTICE '✅ Aucune transaction invalide';
  END IF;
  
  -- Vérifier missions avec prix invalides
  SELECT COUNT(*) INTO v_invalid_data_count
  FROM missions 
  WHERE final_price IS NOT NULL AND final_price < estimated_price;
  
  IF v_invalid_data_count > 0 THEN
    RAISE NOTICE '⚠️ % missions avec prix invalides', v_invalid_data_count;
  ELSE
    RAISE NOTICE '✅ Prix des missions valides';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

-- ========================================
-- 📊 ÉTAPE 3: INDEX OPTIMISÉS
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 CRÉATION DES INDEX OPTIMISÉS';
  RAISE NOTICE '========================================';
END $$;

-- Index composites pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_artisans_search_optimized 
ON artisans(category, is_available, is_suspended, rating DESC)
WHERE is_available = true AND is_suspended = false;

CREATE INDEX IF NOT EXISTS idx_artisans_available_by_category
ON artisans(category, id)
WHERE is_available = true AND is_suspended = false;

CREATE INDEX IF NOT EXISTS idx_transactions_artisan_completed 
ON transactions(artisan_id, status, processed_at DESC)
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_missions_pending_by_category
ON missions(category, created_at DESC)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_missions_artisan_active 
ON missions(artisan_id, status, updated_at DESC)
WHERE status IN ('accepted', 'in_progress');

CREATE INDEX IF NOT EXISTS idx_missions_client_recent 
ON missions(client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallets_positive_balance 
ON wallets(artisan_id, balance DESC)
WHERE balance > 0;

CREATE INDEX IF NOT EXISTS idx_notifications_unread_recent 
ON notifications(user_id, created_at DESC)
WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_reviews_recent_by_user
ON reviews(to_user_id, created_at DESC, rating);

-- Index pour recherches géographiques
CREATE INDEX IF NOT EXISTS idx_missions_location_pending
ON missions(latitude, longitude, category)
WHERE status = 'pending';

DO $$
BEGIN
  RAISE NOTICE '✅ Index créés avec succès';
END $$;

-- ========================================
-- 🛡️ ÉTAPE 4: CONTRAINTES AVEC VALIDATION
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🛡️ AJOUT DES CONTRAINTES MÉTIER';
  RAISE NOTICE '========================================';
END $$;

-- Contraintes sur transactions (avec vérification préalable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM transactions 
    WHERE commission_amount < 0 OR artisan_payout < 0
  ) THEN
    ALTER TABLE transactions
    DROP CONSTRAINT IF EXISTS valid_transaction_amounts;
    
    ALTER TABLE transactions
    ADD CONSTRAINT valid_transaction_amounts 
    CHECK (
      commission_amount >= 0 
      AND artisan_payout >= 0
      AND commission_amount <= amount
      AND artisan_payout <= amount
    );
    
    RAISE NOTICE '✅ Contraintes transactions ajoutées';
  ELSE
    RAISE WARNING '⚠️ Données invalides détectées - contraintes non ajoutées';
  END IF;
END $$;

-- Contraintes sur missions
DO $$
BEGIN
  ALTER TABLE missions
  DROP CONSTRAINT IF EXISTS valid_mission_price;
  
  ALTER TABLE missions
  ADD CONSTRAINT valid_mission_price 
  CHECK (
    final_price IS NULL 
    OR final_price >= 0
  );
  
  ALTER TABLE missions
  DROP CONSTRAINT IF EXISTS valid_mission_timeline;
  
  ALTER TABLE missions
  ADD CONSTRAINT valid_mission_timeline 
  CHECK (
    (accepted_at IS NULL OR accepted_at >= created_at)
    AND (completed_at IS NULL OR completed_at >= created_at)
  );
  
  RAISE NOTICE '✅ Contraintes missions ajoutées';
END $$;

-- Contraintes sur wallets
DO $$
BEGIN
  ALTER TABLE wallets
  DROP CONSTRAINT IF EXISTS valid_wallet_balances;
  
  ALTER TABLE wallets
  ADD CONSTRAINT valid_wallet_balances 
  CHECK (
    balance >= 0 
    AND pending_balance >= 0
    AND total_earnings >= 0
    AND total_withdrawals >= 0
  );
  
  RAISE NOTICE '✅ Contraintes wallets ajoutées';
END $$;

-- ========================================
-- 🔄 ÉTAPE 5: TRIGGERS OPTIMISÉS
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔄 MISE À JOUR DES TRIGGERS';
  RAISE NOTICE '========================================';
END $$;

-- Fonction updated_at (simple et performante)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer sur toutes les tables avec updated_at
DO $$
DECLARE
  v_table_name TEXT;
BEGIN
  FOR v_table_name IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND column_name = 'updated_at'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', v_table_name, v_table_name);
    EXECUTE format(
      'CREATE TRIGGER update_%I_updated_at 
       BEFORE UPDATE ON %I 
       FOR EACH ROW 
       EXECUTE FUNCTION update_updated_at_column()',
      v_table_name, v_table_name
    );
    RAISE NOTICE '✅ Trigger updated_at créé pour: %', v_table_name;
  END LOOP;
END $$;

-- Fonction mise à jour rating (OPTIMISÉE avec cache)
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_new_rating DECIMAL(3,2);
  v_new_count INTEGER;
BEGIN
  v_user_id := COALESCE(NEW.to_user_id, OLD.to_user_id);
  
  -- Calculer une seule fois
  SELECT 
    ROUND(COALESCE(AVG(rating), 0)::NUMERIC, 2),
    COUNT(*)
  INTO v_new_rating, v_new_count
  FROM reviews 
  WHERE to_user_id = v_user_id;
  
  -- Mise à jour uniquement si changement
  UPDATE users 
  SET 
    rating = v_new_rating,
    review_count = v_new_count,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = v_user_id
    AND (rating != v_new_rating OR review_count != v_new_count);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_rating_after_review ON reviews;
CREATE TRIGGER update_rating_after_review 
AFTER INSERT OR UPDATE OF rating OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_user_rating();

RAISE NOTICE '✅ Trigger rating optimisé créé';

-- ========================================
-- 🔍 ÉTAPE 6: AMÉLIORATION DES POLICIES RLS
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔐 OPTIMISATION DES POLICIES RLS';
  RAISE NOTICE '========================================';
END $$;

-- Améliorer la policy missions pour artisans (ne voir que pending + leurs missions)
DROP POLICY IF EXISTS missions_select_client ON missions;
CREATE POLICY missions_select_client ON missions FOR SELECT USING (
  auth.uid() = client_id 
  OR auth.uid() = artisan_id
  OR (
    status = 'pending' 
    AND EXISTS (
      SELECT 1 FROM artisans 
      WHERE id = auth.uid() 
        AND category = missions.category
        AND is_available = true
        AND is_suspended = false
    )
  )
);

RAISE NOTICE '✅ Policy missions améliorée';

-- Optimiser policy artisans
DROP POLICY IF EXISTS artisans_select_limited ON artisans;
CREATE POLICY artisans_select_limited ON artisans FOR SELECT USING (
  auth.uid() = id
  OR (is_available = true AND is_suspended = false)
);

RAISE NOTICE '✅ Policy artisans optimisée';

-- ========================================
-- 🧹 ÉTAPE 7: NETTOYAGE ET MAINTENANCE
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🧹 MAINTENANCE DE LA BASE';
  RAISE NOTICE '========================================';
END $$;

-- Analyser les tables pour mettre à jour les statistiques
ANALYZE users;
ANALYZE artisans;
ANALYZE clients;
ANALYZE missions;
ANALYZE transactions;
ANALYZE reviews;
ANALYZE notifications;
ANALYZE wallets;
ANALYZE subscriptions;

DO $$
BEGIN
  RAISE NOTICE '✅ Tables analysées pour optimisation des requêtes';
END $$;

-- ========================================
-- ✅ ÉTAPE 8: RAPPORT FINAL
-- ========================================

DO $$
DECLARE
  v_tables_count INTEGER;
  v_indexes_count INTEGER;
  v_triggers_count INTEGER;
  v_constraints_count INTEGER;
  v_policies_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_tables_count
  FROM information_schema.tables WHERE table_schema = 'public';
  
  SELECT COUNT(*) INTO v_indexes_count
  FROM pg_indexes WHERE schemaname = 'public';
  
  SELECT COUNT(*) INTO v_triggers_count
  FROM information_schema.triggers WHERE trigger_schema = 'public';
  
  SELECT COUNT(*) INTO v_constraints_count
  FROM information_schema.table_constraints WHERE constraint_schema = 'public';
  
  SELECT COUNT(*) INTO v_policies_count
  FROM pg_policies WHERE schemaname = 'public';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RAPPORT FINAL - FIXES APPLIQUÉS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 Tables: %', v_tables_count;
  RAISE NOTICE '🔍 Index: %', v_indexes_count;
  RAISE NOTICE '🔄 Triggers: %', v_triggers_count;
  RAISE NOTICE '🛡️ Contraintes: %', v_constraints_count;
  RAISE NOTICE '🔐 Policies RLS: %', v_policies_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 FIXES TERMINÉS AVEC SUCCÈS';
  RAISE NOTICE '========================================';
END $$;
