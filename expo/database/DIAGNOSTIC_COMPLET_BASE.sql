-- ========================================
-- DIAGNOSTIC COMPLET BASE DE DONNÉES
-- À exécuter dans Supabase SQL Editor
-- ========================================

-- 1️⃣ VÉRIFICATION DES TABLES
SELECT 
  '📊 TABLES' as section,
  tablename as nom_table,
  CASE WHEN rowsecurity THEN '✅ Activé' ELSE '❌ Désactivé' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2️⃣ VÉRIFICATION DES COLONNES CRITIQUES
SELECT 
  '📋 COLONNES CRITIQUES' as section,
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'artisans', 'clients', 'missions', 'notifications', 'wallets', 'transactions')
  AND column_name IN ('id', 'user_type', 'is_available', 'latitude', 'longitude', 'status', 'read', 'is_read', 'balance')
ORDER BY table_name, column_name;

-- 3️⃣ VÉRIFICATION DES FONCTIONS
SELECT 
  '⚙️ FONCTIONS' as section,
  proname as nom_fonction,
  prosecdef as security_definer
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'calculate_distance_km',
    'handle_new_user',
    'update_user_rating',
    'update_wallet_on_transaction',
    'process_safe_withdrawal'
  )
ORDER BY proname;

-- 4️⃣ VÉRIFICATION DES TRIGGERS
SELECT 
  '🔔 TRIGGERS' as section,
  trigger_name as nom_trigger,
  event_object_table as table_cible,
  action_timing as timing,
  event_manipulation as evenement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 5️⃣ VÉRIFICATION DES POLITIQUES RLS
SELECT 
  '🔒 POLITIQUES RLS' as section,
  tablename as table_name,
  policyname as policy_name,
  cmd as commande,
  qual as condition_using,
  with_check as condition_with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6️⃣ VÉRIFICATION DES INDEX
SELECT 
  '📑 INDEX' as section,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('artisans', 'missions', 'notifications', 'transactions', 'wallets')
ORDER BY tablename, indexname;

-- 7️⃣ STATISTIQUES DES DONNÉES
SELECT '📈 STATISTIQUES DONNÉES' as section, 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT '📈 STATISTIQUES DONNÉES', 'artisans', COUNT(*) FROM artisans
UNION ALL
SELECT '📈 STATISTIQUES DONNÉES', 'clients', COUNT(*) FROM clients
UNION ALL
SELECT '📈 STATISTIQUES DONNÉES', 'missions', COUNT(*) FROM missions
UNION ALL
SELECT '📈 STATISTIQUES DONNÉES', 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT '📈 STATISTIQUES DONNÉES', 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT '📈 STATISTIQUES DONNÉES', 'wallets', COUNT(*) FROM wallets;

-- 8️⃣ VÉRIFICATION DES ARTISANS DISPONIBLES
SELECT 
  '👷 ARTISANS DISPONIBLES' as section,
  a.id,
  u.name,
  u.email,
  a.category,
  a.is_available,
  a.is_suspended,
  a.is_verified,
  a.latitude,
  a.longitude,
  a.intervention_radius
FROM artisans a
JOIN users u ON u.id = a.id
ORDER BY a.category, u.name;

-- 9️⃣ VÉRIFICATION DES MISSIONS PENDING
SELECT 
  '📋 MISSIONS EN ATTENTE' as section,
  m.id,
  m.title,
  m.category,
  m.status,
  m.latitude,
  m.longitude,
  m.created_at,
  u.name as client_name
FROM missions m
JOIN users u ON u.id = m.client_id
WHERE m.status = 'pending'
ORDER BY m.created_at DESC;

-- 🔟 VÉRIFICATION DES NOTIFICATIONS NON LUES
SELECT 
  '🔔 NOTIFICATIONS NON LUES' as section,
  n.id,
  n.type,
  n.title,
  n.message,
  n.user_id,
  u.name as user_name,
  u.user_type,
  CASE WHEN n.read IS NOT NULL THEN n.read ELSE false END as is_read,
  n.created_at
FROM notifications n
JOIN users u ON u.id = n.user_id
WHERE CASE WHEN n.read IS NOT NULL THEN n.read ELSE false END = false
ORDER BY n.created_at DESC
LIMIT 20;

-- 1️⃣1️⃣ VÉRIFICATION DES WALLETS
SELECT 
  '💰 WALLETS' as section,
  w.artisan_id,
  u.name as artisan_name,
  w.balance,
  w.pending_balance,
  w.total_earnings,
  w.total_withdrawals,
  w.updated_at
FROM wallets w
JOIN users u ON u.id = w.artisan_id
ORDER BY w.balance DESC;

-- 1️⃣2️⃣ TEST FONCTION calculate_distance_km
SELECT 
  '🗺️ TEST DISTANCE' as section,
  'Paris → Lyon' as trajet,
  calculate_distance_km(48.8566, 2.3522, 45.7640, 4.8357) as distance_km;

-- 1️⃣3️⃣ VÉRIFICATION REALTIME PUBLICATION
SELECT 
  '📡 REALTIME PUBLICATIONS' as section,
  pubname as publication_name,
  (SELECT array_agg(tablename) 
   FROM pg_publication_tables 
   WHERE pubname = p.pubname) as tables_included
FROM pg_publication p
WHERE pubname = 'supabase_realtime';

-- 1️⃣4️⃣ RÉSUMÉ FINAL
SELECT 
  '✅ RÉSUMÉ' as section,
  'Tables' as type,
  COUNT(*) as count
FROM pg_tables WHERE schemaname = 'public'
UNION ALL
SELECT '✅ RÉSUMÉ', 'Fonctions', COUNT(*) 
FROM pg_proc WHERE pronamespace = 'public'::regnamespace
UNION ALL
SELECT '✅ RÉSUMÉ', 'Triggers', COUNT(*) 
FROM information_schema.triggers WHERE trigger_schema = 'public'
UNION ALL
SELECT '✅ RÉSUMÉ', 'Politiques RLS', COUNT(*) 
FROM pg_policies WHERE schemaname = 'public'
UNION ALL
SELECT '✅ RÉSUMÉ', 'Index', COUNT(*) 
FROM pg_indexes WHERE schemaname = 'public';
