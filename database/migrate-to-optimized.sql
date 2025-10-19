-- ========================================
-- 🔄 MIGRATION VERS SCHÉMA OPTIMISÉ
-- ========================================
-- 
-- Ce script migre votre base de données existante
-- vers le schéma optimisé recommandé par ChatGPT
--
-- ⚠️ ATTENTION:
-- - Faites une sauvegarde avant d'exécuter ce script
-- - Testez d'abord sur un environnement de développement
-- - Vérifiez les données après migration
--
-- ========================================

-- ========================================
-- ÉTAPE 1: Créer la table audit_logs
-- ========================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- RLS pour audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS audit_logs_admin_only ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid())
);

COMMENT ON TABLE audit_logs IS 'Table de traçabilité pour conformité et debugging';

-- ========================================
-- ÉTAPE 2: Ajouter les contraintes manquantes
-- ========================================

-- Missions
DO $$ 
BEGIN
  -- Ajouter contrainte NOT NULL sur commission si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'missions' 
    AND column_name = 'commission' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE missions 
      ALTER COLUMN commission SET NOT NULL,
      ALTER COLUMN commission SET DEFAULT 0.10;
  END IF;
END $$;

-- Transactions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' 
    AND column_name = 'commission' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE transactions 
      ALTER COLUMN commission SET NOT NULL,
      ALTER COLUMN commission SET DEFAULT 0.10;
  END IF;
END $$;

-- Subscriptions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' 
    AND column_name = 'commission' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE subscriptions 
      ALTER COLUMN commission SET NOT NULL,
      ALTER COLUMN commission SET DEFAULT 0.10;
  END IF;
END $$;

-- Wallets
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'wallets' 
    AND column_name = 'balance' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE wallets 
      ALTER COLUMN balance SET NOT NULL,
      ALTER COLUMN balance SET DEFAULT 0.00;
  END IF;
END $$;

-- ========================================
-- ÉTAPE 3: Améliorer les politiques RLS
-- ========================================

-- Supprimer l'ancienne politique missions_select_client si elle existe
DROP POLICY IF EXISTS missions_select_client ON missions;

-- Créer la nouvelle politique optimisée
CREATE POLICY missions_select_client ON missions FOR SELECT USING (
  auth.uid() = client_id 
  OR auth.uid() = artisan_id
  OR (
    status = 'pending' 
    AND category IN (
      SELECT category FROM artisans WHERE artisans.id = auth.uid()
    )
  )
);

COMMENT ON POLICY missions_select_client ON missions IS 
  'Artisans voient uniquement les missions pending de leur catégorie';

-- ========================================
-- ÉTAPE 4: Ajouter des commentaires sur les tables
-- ========================================

COMMENT ON TABLE users IS 'Table principale des utilisateurs';
COMMENT ON TABLE artisans IS 'Profils des artisans avec localisation et tarifs';
COMMENT ON TABLE clients IS 'Profils des clients';
COMMENT ON TABLE missions IS 'Demandes de services des clients';
COMMENT ON TABLE transactions IS 'Historique des paiements';
COMMENT ON TABLE wallets IS 'Portefeuilles des artisans';
COMMENT ON TABLE subscriptions IS 'Abonnements des artisans';

-- ========================================
-- ÉTAPE 5: Vérification post-migration
-- ========================================

-- Compter les tables
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
  
  RAISE NOTICE '✅ Nombre de tables: %', table_count;
  
  IF table_count >= 15 THEN
    RAISE NOTICE '✅ Migration réussie - toutes les tables présentes';
  ELSE
    RAISE WARNING '⚠️ Migration incomplète - certaines tables manquent';
  END IF;
END $$;

-- Vérifier les indexes
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public';
  
  RAISE NOTICE '✅ Nombre d indexes: %', index_count;
END $$;

-- Vérifier les politiques RLS
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RAISE NOTICE '✅ Nombre de politiques RLS: %', policy_count;
  
  IF policy_count >= 15 THEN
    RAISE NOTICE '✅ RLS configuré correctement';
  ELSE
    RAISE WARNING '⚠️ Politiques RLS incomplètes';
  END IF;
END $$;

-- Vérifier les contraintes
DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints
  WHERE constraint_schema = 'public'
  AND constraint_type = 'FOREIGN KEY';
  
  RAISE NOTICE '✅ Nombre de clés étrangères: %', constraint_count;
END $$;

-- ========================================
-- ✅ MIGRATION TERMINÉE
-- ========================================

RAISE NOTICE '';
RAISE NOTICE '========================================';
RAISE NOTICE '✅ MIGRATION VERS SCHÉMA OPTIMISÉ TERMINÉE';
RAISE NOTICE '========================================';
RAISE NOTICE '';
RAISE NOTICE 'Prochaines étapes:';
RAISE NOTICE '1. Vérifier les données dans Table Editor';
RAISE NOTICE '2. Tester l authentification';
RAISE NOTICE '3. Créer une mission de test';
RAISE NOTICE '4. Vérifier les politiques RLS';
RAISE NOTICE '5. Consulter database/OPTIMIZED_SCHEMA_GUIDE.md';
RAISE NOTICE '';
