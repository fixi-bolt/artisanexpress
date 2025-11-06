-- ============================================================================
-- 🔍 DIAGNOSTIC SIMPLE : Affichage des résultats avec SELECT
-- ============================================================================
-- Copiez-collez ce script dans Supabase SQL Editor
-- ============================================================================

-- 1️⃣ Vérifier le trigger et la fonction
SELECT 
  '1️⃣ Trigger & Fonction' as diagnostic,
  EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notify_mission_accepted') as trigger_existe,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_client_on_mission_accepted') as fonction_existe;

-- 2️⃣ Vérifier la colonne is_read
SELECT 
  '2️⃣ Colonne is_read' as diagnostic,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'is_read'
  ) as is_read_existe;

-- 3️⃣ Vérifier Realtime
SELECT 
  '3️⃣ Realtime' as diagnostic,
  EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) as realtime_notifications,
  EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'missions'
  ) as realtime_missions;

-- 4️⃣ État des missions
SELECT 
  '4️⃣ Missions récentes' as diagnostic,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
  COUNT(*) FILTER (WHERE status = 'completed') as completed
FROM public.missions;

-- 5️⃣ Dernières notifications créées
SELECT 
  '5️⃣ Dernières notifications' as section,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE type = 'mission_accepted') as mission_accepted_notifs,
  COUNT(*) FILTER (WHERE is_read = false) as non_lues
FROM public.notifications
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 6️⃣ Détails des notifications récentes
SELECT 
  id,
  type,
  title,
  user_id,
  mission_id,
  is_read,
  created_at
FROM public.notifications
ORDER BY created_at DESC
LIMIT 5;

-- 7️⃣ Détails des missions récentes
SELECT 
  id,
  title,
  status,
  client_id,
  artisan_id,
  created_at,
  accepted_at
FROM public.missions
ORDER BY created_at DESC
LIMIT 5;

-- 🎯 RÉSUMÉ FINAL (tout dans une seule requête)
WITH config_check AS (
  SELECT
    EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notify_mission_accepted') as has_trigger,
    EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_client_on_mission_accepted') as has_function,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'is_read') as has_is_read,
    EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') as has_realtime_notifs,
    EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'missions') as has_realtime_missions
)
SELECT
  '🎯 RÉSUMÉ' as diagnostic,
  CASE WHEN has_trigger THEN '✅' ELSE '❌' END as trigger_status,
  CASE WHEN has_function THEN '✅' ELSE '❌' END as fonction_status,
  CASE WHEN has_is_read THEN '✅' ELSE '❌' END as colonne_is_read,
  CASE WHEN has_realtime_notifs THEN '✅' ELSE '❌' END as realtime_notifications,
  CASE WHEN has_realtime_missions THEN '✅' ELSE '❌' END as realtime_missions,
  CASE 
    WHEN has_trigger AND has_function AND has_is_read AND has_realtime_notifs AND has_realtime_missions 
    THEN '✅ Configuration SQL complète'
    ELSE '❌ Configuration incomplète - voir détails ci-dessus'
  END as conclusion
FROM config_check;
