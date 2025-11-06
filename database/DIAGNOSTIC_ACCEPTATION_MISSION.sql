-- ============================================================================
-- 🔍 DIAGNOSTIC COMPLET : Pourquoi les notifications ne fonctionnent pas ?
-- ============================================================================
-- Copiez-collez ce script dans l'éditeur SQL de Supabase
-- ============================================================================

-- 1️⃣ Vérifier les tables
SELECT '1️⃣ VÉRIFICATION DES TABLES' as section;

SELECT 
  'missions' as table_name, 
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM public.missions
UNION ALL
SELECT 
  'notifications' as table_name, 
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM public.notifications
UNION ALL
SELECT 
  'users' as table_name, 
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status
FROM public.users;

-- 2️⃣ Vérifier la colonne is_read existe
SELECT '2️⃣ COLONNE IS_READ' as section;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notifications'
  AND column_name IN ('is_read', 'read');

-- 3️⃣ Vérifier le trigger existe
SELECT '3️⃣ TRIGGER' as section;

SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  CASE 
    WHEN tgenabled = 'O' THEN '✅ Actif'
    ELSE '❌ Désactivé'
  END as status
FROM pg_trigger
WHERE tgname = 'trg_notify_mission_accepted';

-- 4️⃣ Vérifier la fonction trigger existe
SELECT '4️⃣ FONCTION TRIGGER' as section;

SELECT 
  proname as function_name,
  prokind as kind,
  '✅ Existe' as status
FROM pg_proc
WHERE proname = 'notify_client_on_mission_accepted';

-- 5️⃣ Vérifier RLS sur notifications
SELECT '5️⃣ RLS POLICIES - NOTIFICATIONS' as section;

SELECT 
  policyname as policy_name,
  cmd as command,
  qual::text as using_expression
FROM pg_policies
WHERE tablename = 'notifications';

-- 6️⃣ État des missions
SELECT '6️⃣ MISSIONS' as section;

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

-- 7️⃣ Dernières notifications
SELECT '7️⃣ NOTIFICATIONS' as section;

SELECT 
  n.id,
  n.type,
  n.title,
  n.message,
  n.mission_id,
  n.user_id,
  n.is_read,
  n.created_at,
  u.name as user_name,
  u.type as user_type
FROM public.notifications n
LEFT JOIN public.users u ON n.user_id = u.id
ORDER BY n.created_at DESC
LIMIT 10;

-- 8️⃣ Vérifier la configuration Realtime
SELECT '8️⃣ REALTIME PUBLICATION' as section;

SELECT 
  schemaname,
  tablename,
  '✅ Publié' as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename IN ('missions', 'notifications');

-- 9️⃣ Test manuel du trigger (simule une acceptation)
SELECT '9️⃣ TEST MANUEL DU TRIGGER' as section;

-- On crée une notification de test pour voir si le système fonctionne
DO $$
DECLARE
  test_mission_id uuid;
  test_client_id uuid;
  notif_count_before integer;
  notif_count_after integer;
BEGIN
  -- Compter les notifications avant
  SELECT COUNT(*) INTO notif_count_before FROM public.notifications;
  
  -- Récupérer une mission pending
  SELECT id, client_id 
  INTO test_mission_id, test_client_id
  FROM public.missions
  WHERE status = 'pending'
  LIMIT 1;
  
  IF test_mission_id IS NOT NULL THEN
    RAISE NOTICE '🧪 Test avec mission: %', test_mission_id;
    
    -- Essai d''insertion directe d''une notification
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      mission_id,
      is_read,
      created_at
    ) VALUES (
      test_client_id,
      'mission_accepted',
      'TEST - Mission acceptée',
      'Ceci est un test manuel',
      test_mission_id,
      false,
      NOW()
    );
    
    -- Compter après
    SELECT COUNT(*) INTO notif_count_after FROM public.notifications;
    
    RAISE NOTICE '✅ Notifications avant: %, après: %', notif_count_before, notif_count_after;
    
    IF notif_count_after > notif_count_before THEN
      RAISE NOTICE '✅ Insertion manuelle fonctionne !';
    ELSE
      RAISE WARNING '❌ Problème avec l''insertion';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ Aucune mission pending pour tester';
  END IF;
END $$;

-- 🔟 Résumé
SELECT '🔟 RÉSUMÉ' as section;

DO $$
DECLARE
  has_trigger boolean;
  has_function boolean;
  has_is_read boolean;
  realtime_ok boolean;
BEGIN
  -- Vérifier trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notify_mission_accepted'
  ) INTO has_trigger;
  
  -- Vérifier fonction
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'notify_client_on_mission_accepted'
  ) INTO has_function;
  
  -- Vérifier colonne is_read
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'is_read'
  ) INTO has_is_read;
  
  -- Vérifier realtime
  SELECT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) INTO realtime_ok;
  
  RAISE NOTICE '=================================================';
  RAISE NOTICE '📊 RÉSUMÉ DU DIAGNOSTIC';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Trigger existe: %', CASE WHEN has_trigger THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Fonction existe: %', CASE WHEN has_function THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Colonne is_read: %', CASE WHEN has_is_read THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Realtime config: %', CASE WHEN realtime_ok THEN '✅' ELSE '❌' END;
  RAISE NOTICE '=================================================';
  
  IF has_trigger AND has_function AND has_is_read AND realtime_ok THEN
    RAISE NOTICE '✅✅✅ Configuration complète ! Si ça ne marche toujours pas, problème côté code frontend';
  ELSE
    RAISE WARNING '❌ Configuration incomplète, voir détails ci-dessus';
  END IF;
END $$;
