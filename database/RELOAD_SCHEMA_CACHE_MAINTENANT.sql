-- ========================================
-- 🔄 RECHARGER LE CACHE DU SCHÉMA SUPABASE
-- ========================================
-- Exécutez ce SQL dans le SQL Editor de Supabase

-- 1️⃣ Réinitialiser complètement le cache du schéma
NOTIFY pgrst, 'reload schema';

-- 2️⃣ Alternative: Forcer PostgREST à recharger le cache
-- Si la commande ci-dessus ne fonctionne pas, utilisez celle-ci:
SELECT pg_notify('pgrst', 'reload schema');

-- 3️⃣ Vérifier que les colonnes existent bien dans la table users
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- ✅ Vous devriez voir: id, email, name, phone, photo, user_type, rating, review_count, created_at, updated_at
