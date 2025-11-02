-- =====================================================
-- 🔍 DIAGNOSTIC NOTIFICATIONS PUSH
-- =====================================================
-- Requêtes SQL pour diagnostiquer les notifications push
-- Copier-coller dans Supabase SQL Editor
-- =====================================================

-- 1️⃣ Vérifier que la table push_tokens existe
-- =====================================================
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'push_tokens'
) as table_exists;

-- Résultat attendu : table_exists = true
-- Si false → Exécuter COPIER_COLLER_SUPABASE_PUSH.sql


-- 2️⃣ Compter les tokens enregistrés
-- =====================================================
SELECT 
  COUNT(*) as total_tokens,
  COUNT(DISTINCT user_id) as unique_users
FROM public.push_tokens;

-- Résultat attendu : au moins 1 token
-- Si 0 → Les utilisateurs n'ont pas enregistré leurs tokens


-- 3️⃣ Voir tous les tokens (avec user info)
-- =====================================================
SELECT 
  pt.user_id,
  u.name as user_name,
  u.email,
  u.user_type,
  pt.platform,
  LEFT(pt.token, 30) || '...' as token_preview,
  pt.created_at,
  pt.updated_at
FROM public.push_tokens pt
LEFT JOIN public.users u ON u.id = pt.user_id
ORDER BY pt.created_at DESC;

-- Vérifier : le client concerné a-t-il un token ?


-- 4️⃣ Vérifier les dernières notifications créées
-- =====================================================
SELECT 
  n.id,
  n.user_id,
  u.name as recipient_name,
  u.user_type as recipient_type,
  n.type,
  n.title,
  n.message,
  n.mission_id,
  n.read,
  n.created_at
FROM public.notifications n
LEFT JOIN public.users u ON u.id = n.user_id
ORDER BY n.created_at DESC
LIMIT 20;

-- Vérifier : une notification "mission_accepted" a-t-elle été créée ?


-- 5️⃣ Vérifier les notifications d'acceptation de mission
-- =====================================================
SELECT 
  n.id as notification_id,
  n.user_id as client_id,
  u.name as client_name,
  m.id as mission_id,
  m.title as mission_title,
  m.status as mission_status,
  m.artisan_id,
  m.accepted_at,
  n.created_at as notification_created_at,
  n.read as notification_read,
  CASE 
    WHEN pt.token IS NOT NULL THEN '✅ Token exists'
    ELSE '❌ No token'
  END as push_token_status
FROM public.notifications n
LEFT JOIN public.users u ON u.id = n.user_id
LEFT JOIN public.missions m ON m.id = n.mission_id
LEFT JOIN public.push_tokens pt ON pt.user_id = n.user_id
WHERE n.type = 'mission_accepted'
ORDER BY n.created_at DESC
LIMIT 10;

-- Vérifier : 
-- - La notification existe ?
-- - Le client a un push token ?


-- 6️⃣ Trouver les utilisateurs SANS push token
-- =====================================================
SELECT 
  u.id,
  u.name,
  u.email,
  u.user_type,
  u.created_at as user_created_at,
  CASE 
    WHEN pt.user_id IS NULL THEN '❌ No push token'
    ELSE '✅ Has token'
  END as token_status
FROM public.users u
LEFT JOIN public.push_tokens pt ON pt.user_id = u.id
WHERE pt.user_id IS NULL
  AND u.user_type IN ('client', 'artisan')
ORDER BY u.created_at DESC;

-- Ces utilisateurs doivent se reconnecter pour enregistrer leur token


-- 7️⃣ Vérifier une mission spécifique
-- =====================================================
-- Remplacer '<MISSION_ID>' par l'ID de votre mission
SELECT 
  m.id as mission_id,
  m.title,
  m.status,
  m.client_id,
  uc.name as client_name,
  m.artisan_id,
  ua.name as artisan_name,
  m.created_at as mission_created,
  m.accepted_at as mission_accepted,
  n.id as notification_id,
  n.title as notification_title,
  n.created_at as notification_created,
  pt.token IS NOT NULL as client_has_token
FROM public.missions m
LEFT JOIN public.users uc ON uc.id = m.client_id
LEFT JOIN public.users ua ON ua.id = m.artisan_id
LEFT JOIN public.notifications n ON n.mission_id = m.id AND n.type = 'mission_accepted'
LEFT JOIN public.push_tokens pt ON pt.user_id = m.client_id
WHERE m.id = '<MISSION_ID>';

-- Remplacer <MISSION_ID> par l'ID réel


-- 8️⃣ Statistiques globales
-- =====================================================
SELECT 
  'Total Users' as metric,
  COUNT(*) as count
FROM public.users
UNION ALL
SELECT 
  'Users with Push Tokens' as metric,
  COUNT(DISTINCT user_id) as count
FROM public.push_tokens
UNION ALL
SELECT 
  'Total Push Tokens' as metric,
  COUNT(*) as count
FROM public.push_tokens
UNION ALL
SELECT 
  'Total Notifications' as metric,
  COUNT(*) as count
FROM public.notifications
UNION ALL
SELECT 
  'Mission Accepted Notifications' as metric,
  COUNT(*) as count
FROM public.notifications
WHERE type = 'mission_accepted'
UNION ALL
SELECT 
  'Accepted Missions' as metric,
  COUNT(*) as count
FROM public.missions
WHERE status = 'accepted';


-- 9️⃣ Vérifier les politiques RLS
-- =====================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'push_tokens'
ORDER BY policyname;

-- Doit avoir 6 politiques :
-- 1. Users can view own push tokens
-- 2. Users can insert own push tokens
-- 3. Users can update own push tokens
-- 4. Users can delete own push tokens
-- 5. Service role can read all tokens


-- 🔟 Test d'insertion manuelle (pour debugging)
-- =====================================================
-- ⚠️ NE PAS UTILISER EN PRODUCTION
-- Uniquement pour tester si l'insertion fonctionne

-- Insérer un token de test
-- INSERT INTO public.push_tokens (user_id, token, platform)
-- VALUES (
--   '<USER_ID>',
--   'ExponentPushToken[test-token-123]',
--   'ios'
-- );

-- Vérifier l'insertion
-- SELECT * FROM public.push_tokens WHERE user_id = '<USER_ID>';

-- Supprimer le token de test
-- DELETE FROM public.push_tokens WHERE token = 'ExponentPushToken[test-token-123]';


-- =====================================================
-- ✅ INTERPRÉTATION DES RÉSULTATS
-- =====================================================
-- 
-- ✅ Tout fonctionne si :
-- 1. Table push_tokens existe (requête 1)
-- 2. Au moins 1 token enregistré (requête 2)
-- 3. Le client a un token (requête 3)
-- 4. Notification créée pour mission acceptée (requête 4, 5)
-- 5. 6 politiques RLS actives (requête 9)
--
-- ❌ Problème si :
-- - Table n'existe pas → Exécuter script SQL
-- - Aucun token → Utilisateurs doivent se reconnecter
-- - Client sans token → Il doit accepter permissions
-- - Notification existe mais client sans token → Se reconnecter
-- - Notification n'existe pas → Problème backend/code
--
-- =====================================================
