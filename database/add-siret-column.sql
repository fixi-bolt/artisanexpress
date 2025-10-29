-- Add SIRET column to artisans table
-- This script can be run multiple times (idempotent)

DO $$ 
BEGIN
  -- Add siret column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'artisans' 
    AND column_name = 'siret'
  ) THEN
    ALTER TABLE artisans ADD COLUMN siret TEXT;
    RAISE NOTICE 'Column siret added to artisans table';
  ELSE
    RAISE NOTICE 'Column siret already exists in artisans table';
  END IF;
END $$;

-- Create index for SIRET lookups (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_artisans_siret ON artisans(siret);

COMMENT ON COLUMN artisans.siret IS 'Numéro SIRET de l''artisan (optionnel pour le moment, deviendra obligatoire au lancement)';
