-- ============================================================================
-- 🔍 DIAGNOSTIC SIMPLE : Vérification des notifications
-- ============================================================================
-- Copiez-collez tout ce script dans l'éditeur SQL de Supabase
-- ============================================================================

-- 1️⃣ Vérifier que le trigger existe
SELECT 
  '1️⃣ TRIGGER' as diagnostic,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notify_mission_accepted') 
    THEN '✅ Existe' 
    ELSE '❌ Manquant' 
  END as trigger_status;

-- 2️⃣ Vérifier que la fonction existe
SELECT 
  '2️⃣ FONCTION' as diagnostic,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_client_on_mission_accepted') 
    THEN '✅ Existe' 
    ELSE '❌ Manquante' 
  END as fonction_status;

-- 3️⃣ Vérifier la colonne is_read
SELECT 
  '3️⃣ COLONNE' as diagnostic,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'is_read'
    ) 
    THEN '✅ is_read existe' 
    ELSE '❌ is_read manquante' 
  END as colonne_status;

-- 4️⃣ Vérifier Realtime sur notifications
SELECT 
  '4️⃣ REALTIME NOTIFICATIONS' as diagnostic,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) 
    THEN '✅ Configuré' 
    ELSE '❌ Non configuré' 
  END as realtime_status;

-- 5️⃣ Vérifier Realtime sur missions
SELECT 
  '5️⃣ REALTIME MISSIONS' as diagnostic,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'missions'
    ) 
    THEN '✅ Configuré' 
    ELSE '❌ Non configuré' 
  END as realtime_status;

-- 6️⃣ Voir les dernières missions
SELECT 
  '6️⃣ DERNIÈRES MISSIONS' as diagnostic,
  id,
  title,
  status,
  client_id,
  artisan_id,
  accepted_at
FROM missions
ORDER BY created_at DESC
LIMIT 3;

-- 7️⃣ Voir les dernières notifications
SELECT 
  '7️⃣ DERNIÈRES NOTIFICATIONS' as diagnostic,
  id,
  type,
  title,
  user_id,
  mission_id,
  is_read,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 5;

-- 8️⃣ RÉSUMÉ FINAL
SELECT 
  '🎯 RÉSUMÉ FINAL' as diagnostic,
  CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notify_mission_accepted') THEN '✅' ELSE '❌' END as trigger_status,
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_client_on_mission_accepted') THEN '✅' ELSE '❌' END as fonction_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'is_read') THEN '✅' ELSE '❌' END as colonne_is_read,
  CASE WHEN EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN '✅' ELSE '❌' END as realtime_notifications,
  CASE WHEN EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'missions') THEN '✅' ELSE '❌' END as realtime_missions,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notify_mission_accepted')
     AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_client_on_mission_accepted')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'is_read')
     AND EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications')
    THEN '✅ Tout est OK !'
    ELSE '❌ Configuration incomplète - voir détails ci-dessus'
  END as conclusion;
