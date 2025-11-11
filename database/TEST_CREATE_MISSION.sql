-- ============================================
-- 🧪 TEST CRÉATION DE MISSION
-- ============================================
-- Ce script teste si la création de mission fonctionne

DO $$
DECLARE
  v_test_user_id uuid;
  v_test_mission_id uuid;
BEGIN
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '🧪 TEST CRÉATION DE MISSION';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  
  -- Créer un utilisateur test
  INSERT INTO users (email, user_type, name)
  VALUES ('test_mission_' || floor(random() * 10000) || '@test.com', 'client', 'Test Client')
  RETURNING id INTO v_test_user_id;
  
  -- Créer l'entrée client
  INSERT INTO clients (id) VALUES (v_test_user_id);
  
  RAISE NOTICE '✅ Utilisateur test créé: %', v_test_user_id;
  
  -- Tester la création d'une mission (comme le frontend le fait)
  INSERT INTO missions (
    client_id,
    category,
    title,
    description,
    photos,
    latitude,
    longitude,
    address,
    status,
    estimated_price,
    commission
  )
  VALUES (
    v_test_user_id,
    'Plomberie',
    'Test fuite évier',
    'Problème de fuite sous l''évier de cuisine',
    ARRAY[]::text[],
    48.8566,
    2.3522,
    '15 Rue de Rivoli, 75001 Paris',
    'pending',
    120.0,
    0.15
  )
  RETURNING id INTO v_test_mission_id;
  
  RAISE NOTICE '✅ Mission test créée: %', v_test_mission_id;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 SUCCÈS ! La création de mission fonctionne';
  RAISE NOTICE '';
  
  -- Nettoyer
  DELETE FROM missions WHERE id = v_test_mission_id;
  DELETE FROM clients WHERE id = v_test_user_id;
  DELETE FROM users WHERE id = v_test_user_id;
  
  RAISE NOTICE '🧹 Données de test nettoyées';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '';
  RAISE NOTICE '❌ ERREUR lors de la création de mission:';
  RAISE NOTICE '   Message: %', SQLERRM;
  RAISE NOTICE '   Détails: %', SQLSTATE;
  RAISE NOTICE '';
  
  -- Nettoyer en cas d'erreur
  BEGIN
    DELETE FROM missions WHERE client_id = v_test_user_id;
    DELETE FROM clients WHERE id = v_test_user_id;
    DELETE FROM users WHERE id = v_test_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- Vérifier les fonctions disponibles
SELECT 
  '🔍 Fonctions disponibles:' as info,
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname LIKE '%distance%'
  OR proname LIKE '%round%'
ORDER BY proname;
