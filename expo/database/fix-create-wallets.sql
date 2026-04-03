-- ========================================
-- 🔧 CORRECTION - Création de la table WALLETS manquante
-- ========================================

-- Créer la table wallets si elle n'existe pas
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

-- Créer l'index sur artisan_id
CREATE INDEX IF NOT EXISTS idx_wallets_artisan ON wallets(artisan_id);

-- Créer le trigger pour updated_at
DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
CREATE TRIGGER update_wallets_updated_at 
  BEFORE UPDATE ON wallets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Supprimer l'ancienne policy si elle existe
DROP POLICY IF EXISTS wallets_own ON wallets;

-- Créer la policy RLS
CREATE POLICY wallets_own ON wallets 
  FOR ALL 
  USING (auth.uid() = artisan_id);

-- Vérifier que la table existe
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'wallets'
  ) THEN
    RAISE NOTICE '✅ Table wallets créée avec succès';
  ELSE
    RAISE EXCEPTION '❌ Erreur: La table wallets n''a pas été créée';
  END IF;
END $$;

-- Afficher les colonnes de la table
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'wallets'
ORDER BY ordinal_position;
