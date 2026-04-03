-- ========================================
-- 🔧 FIX SCHEMA CACHE - SOLUTION RAPIDE
-- ========================================
-- Cette commande actualise le cache du schéma Supabase
-- Exécutez ceci dans l'éditeur SQL de Supabase

-- 1. D'abord, vérifier si la colonne existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';

-- 2. Si la colonne 'name' n'existe PAS, ajoutez-la :
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'User';

-- 3. Ensuite, rafraîchir le cache du schéma Supabase
NOTIFY pgrst, 'reload schema';

-- 4. Vérifier à nouveau que la colonne existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;
