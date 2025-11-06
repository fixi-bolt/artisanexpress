-- ============================================
-- 🔍 DIAGNOSTIC SIMPLE - CONFIGURATION ACTUELLE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📊 VÉRIFICATION CONFIGURATION REALTIME';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- 1️⃣ Vérifier que la table notifications est dans la publication
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ notifications est dans supabase_realtime'
    ELSE '❌ notifications manque dans supabase_realtime'
  END as status_publication
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename = 'notifications';

-- 2️⃣ Vérifier que le trigger existe
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Trigger notify_mission_accepted existe'
    ELSE '❌ Trigger notify_mission_accepted manque'
  END as status_trigger
FROM pg_trigger
WHERE tgname = 'notify_mission_accepted';

-- 3️⃣ Vérifier que la fonction existe
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Fonction send_mission_accepted_notification existe'
    ELSE '❌ Fonction send_mission_accepted_notification manque'
  END as status_fonction
FROM pg_proc
WHERE proname = 'send_mission_accepted_notification';

-- 4️⃣ Tester une notification de test
DO $$
DECLARE
  v_test_user_id uuid;
  v_test_mission_id uuid;
  v_notification_id uuid;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🧪 TEST DE NOTIFICATION';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  -- Créer un utilisateur test (client)
  INSERT INTO users (email, user_type, name)
  VALUES ('test_client_notif_' || floor(random() * 10000) || '@test.com', 'client', 'Test Client')
  RETURNING id INTO v_test_user_id;
  
  -- Créer l'entrée client
  INSERT INTO clients (id) VALUES (v_test_user_id);
  
  RAISE NOTICE '✅ Utilisateur test créé: %', v_test_user_id;
  
  -- Créer une mission test
  INSERT INTO missions (
    client_id, 
    title, 
    description, 
    category, 
    status,
    latitude,
    longitude
  )
  VALUES (
    v_test_user_id,
    'Test Mission Notification',
    'Test',
    'Plomberie',
    'pending',
    48.8566,
    2.3522
  )
  RETURNING id INTO v_test_mission_id;
  
  RAISE NOTICE '✅ Mission test créée: %', v_test_mission_id;
  
  -- Insérer une notification directement
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    is_read
  )
  VALUES (
    v_test_user_id,
    'mission_accepted',
    'Test Notification',
    'Ceci est un test de notification',
    jsonb_build_object('mission_id', v_test_mission_id),
    false
  )
  RETURNING id INTO v_notification_id;
  
  RAISE NOTICE '✅ Notification test créée: %', v_notification_id;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 VÉRIFICATION: Regardez dans votre app si la notification apparaît !';
  RAISE NOTICE '   User ID: %', v_test_user_id;
  RAISE NOTICE '   Mission ID: %', v_test_mission_id;
  RAISE NOTICE '   Notification ID: %', v_notification_id;
  
  -- Nettoyer les données de test
  DELETE FROM notifications WHERE id = v_notification_id;
  DELETE FROM missions WHERE id = v_test_mission_id;
  DELETE FROM clients WHERE id = v_test_user_id;
  DELETE FROM users WHERE id = v_test_user_id;
  
  RAISE NOTICE '';
  RAISE NOTICE '🧹 Données de test nettoyées';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ ERREUR lors du test: %', SQLERRM;
  
  -- Nettoyer en cas d'erreur
  DELETE FROM notifications WHERE user_id = v_test_user_id;
  DELETE FROM missions WHERE client_id = v_test_user_id;
  DELETE FROM clients WHERE id = v_test_user_id;
  DELETE FROM users WHERE id = v_test_user_id;
END $$;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🎯 RÉSUMÉ';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Si tout est vert ci-dessus, la configuration est correcte';
  RAISE NOTICE '📱 Le problème est probablement dans le code frontend';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Prochaine étape:';
  RAISE NOTICE '   1. Vérifier que le client écoute bien les notifications';
  RAISE NOTICE '   2. Vérifier les permissions RLS';
  RAISE NOTICE '   3. Vérifier les logs console dans l''app';
  RAISE NOTICE '';
END $$;
