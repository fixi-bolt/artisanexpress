-- ========================================
-- 🔄 RELOAD SUPABASE SCHEMA CACHE
-- ========================================
-- This forces PostgREST to reload its schema cache
-- Run this whenever you see "Could not find column in schema cache" errors

-- Method 1: Reload schema cache via NOTIFY
NOTIFY pgrst, 'reload schema';

-- Method 2: Send reload config signal (alternative)
NOTIFY pgrst, 'reload config';

-- Verify the users table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;
