-- ========================================
-- 🔍 DIAGNOSTIC COMPLET SUPABASE
-- ========================================
-- Coller ce script dans Supabase SQL Editor
-- Il va vérifier l'état actuel de votre base
-- ========================================

\echo '========================================';
\echo '🔍 DIAGNOSTIC DÉMARRÉ';
\echo '========================================';

-- ========================================
-- 1. VÉRIFIER LES COLONNES CRITIQUES
-- ========================================
\echo '';
\echo '📋 1. COLONNES CRITIQUES:';
\echo '';

-- Vérifier users
SELECT 
  'users.' || column_name AS colonne,
  data_type,
  CASE WHEN is_nullable = 'YES' THEN '✓ nullable' ELSE '✗ NOT NULL' END AS nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('id', 'user_type', 'is_available', 'is_profile_visible', 'latitude', 'longitude', 'stripe_customer_id')
ORDER BY column_name;

-- Vérifier artisans
SELECT 
  'artisans.' || column_name AS colonne,
  data_type,
  CASE WHEN is_nullable = 'YES' THEN '✓ nullable' ELSE '✗ NOT NULL' END AS nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'artisans'
  AND column_name IN ('id', 'category', 'is_available', 'is_verified', 'latitude', 'longitude', 'intervention_radius', 'siret', 'specialties')
ORDER BY column_name;

-- Vérifier notifications
SELECT 
  'notifications.' || column_name AS colonne,
  data_type,
  CASE WHEN is_nullable = 'YES' THEN '✓ nullable' ELSE '✗ NOT NULL' END AS nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notifications'
  AND column_name IN ('id', 'user_id', 'type', 'title', 'message', 'mission_id', 'read', 'is_read', 'created_at')
ORDER BY column_name;

-- ========================================
-- 2. VÉRIFIER LES FONCTIONS
-- ========================================
\echo '';
\echo '🔧 2. FONCTIONS SQL:';
\echo '';

SELECT 
  proname AS nom_fonction,
  pg_get_function_arguments(oid) AS arguments,
  CASE 
    WHEN prorettype = 2278 THEN 'void'
    WHEN proretset THEN 'table'
    ELSE format_type(prorettype, null)
  END AS retour
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'calculate_distance_km',
    'find_nearby_missions',
    'notify_nearby_artisans',
    'mark_notification_as_read',
    'update_artisan_location',
    'credit_artisan_wallet',
    'process_payment_complete'
  )
ORDER BY proname;

-- ========================================
-- 3. VÉRIFIER LES TRIGGERS
-- ========================================
\echo '';
\echo '⚡ 3. TRIGGERS:';
\echo '';

SELECT 
  trigger_name,
  event_object_table AS sur_table,
  event_manipulation AS evenement,
  action_timing AS timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'on_new_mission_notify',
    'on_mission_created_notify_artisans',
    'sync_wallet_on_transaction',
    'trigger_create_wallet',
    'on_auth_user_created'
  )
ORDER BY event_object_table, trigger_name;

-- ========================================
-- 4. VÉRIFIER LES INDEX
-- ========================================
\echo '';
\echo '📊 4. INDEX GÉOLOCALISATION:';
\echo '';

SELECT 
  tablename AS table,
  indexname AS index,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_artisans_location',
    'idx_missions_location',
    'idx_users_location',
    'idx_notifications_user_id'
  )
ORDER BY tablename, indexname;

-- ========================================
-- 5. VÉRIFIER RLS
-- ========================================
\echo '';
\echo '🔒 5. ROW LEVEL SECURITY:';
\echo '';

SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_actif
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'artisans', 'missions', 'notifications', 'wallets', 'transactions')
ORDER BY tablename;

-- Lister les policies sur notifications
\echo '';
\echo '📜 Policies sur notifications:';
SELECT 
  policyname AS policy,
  cmd AS commande,
  qual AS using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'notifications';

-- ========================================
-- 6. DONNÉES DE TEST
-- ========================================
\echo '';
\echo '📈 6. STATISTIQUES:';
\echo '';

-- Compter artisans disponibles avec GPS
SELECT 
  COUNT(*) FILTER (WHERE a.is_available = true) AS artisans_disponibles,
  COUNT(*) FILTER (WHERE a.is_available = true AND a.latitude IS NOT NULL AND a.longitude IS NOT NULL) AS artisans_avec_gps,
  COUNT(*) FILTER (WHERE a.is_available = true AND COALESCE(a.is_verified, true) = true) AS artisans_verifies,
  COUNT(DISTINCT a.category) AS categories_distinctes
FROM public.artisans a;

-- Compter missions récentes
SELECT 
  COUNT(*) AS missions_24h,
  COUNT(*) FILTER (WHERE status = 'pending') AS missions_pending,
  COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL) AS missions_avec_gps
FROM public.missions
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Compter notifications récentes
SELECT 
  COUNT(*) AS notifications_24h,
  COUNT(*) FILTER (WHERE type = 'mission_request') AS notif_missions,
  COUNT(*) FILTER (WHERE read = false OR is_read = false) AS notif_non_lues
FROM public.notifications
WHERE created_at > NOW() - INTERVAL '24 hours';

-- ========================================
-- 7. TEST FONCTION DISTANCE
-- ========================================
\echo '';
\echo '📍 7. TEST GÉOLOCALISATION:';
\echo '';

-- Tester calculate_distance_km (Paris → Lyon ≈ 395 km)
DO $$
DECLARE
  v_distance DECIMAL;
BEGIN
  SELECT public.calculate_distance_km(48.8566, 2.3522, 45.7640, 4.8357) INTO v_distance;
  
  IF v_distance IS NOT NULL THEN
    RAISE NOTICE '✅ calculate_distance_km() fonctionne (Paris-Lyon: %.1f km)', v_distance;
    
    IF v_distance BETWEEN 390 AND 400 THEN
      RAISE NOTICE '✅ Calcul correct (attendu: ~395 km)';
    ELSE
      RAISE WARNING '⚠️ Calcul approximatif: %.1f km (attendu: ~395 km)', v_distance;
    END IF;
  ELSE
    RAISE WARNING '❌ calculate_distance_km() retourne NULL';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Erreur lors du test de calculate_distance_km(): %', SQLERRM;
END$$;

-- ========================================
-- 8. PROBLÈMES IDENTIFIÉS
-- ========================================
\echo '';
\echo '🚨 8. DIAGNOSTIC FINAL:';
\echo '';

DO $$
DECLARE
  v_func_distance BOOLEAN;
  v_func_notify BOOLEAN;
  v_trigger_notify BOOLEAN;
  v_col_read BOOLEAN;
  v_col_is_read BOOLEAN;
  v_artisans_gps INTEGER;
  v_issues TEXT := '';
BEGIN
  -- Vérifier fonction distance
  SELECT EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'calculate_distance_km' 
    AND pronamespace = 'public'::regnamespace
  ) INTO v_func_distance;

  -- Vérifier fonction notify
  SELECT EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'notify_nearby_artisans' 
    AND pronamespace = 'public'::regnamespace
  ) INTO v_func_notify;

  -- Vérifier trigger
  SELECT EXISTS(
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    AND event_object_table = 'missions'
    AND trigger_name IN ('on_new_mission_notify', 'on_mission_created_notify_artisans')
  ) INTO v_trigger_notify;

  -- Vérifier colonne read
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notifications'
    AND column_name = 'read'
  ) INTO v_col_read;

  -- Vérifier colonne is_read
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notifications'
    AND column_name = 'is_read'
  ) INTO v_col_is_read;

  -- Compter artisans avec GPS
  SELECT COUNT(*) INTO v_artisans_gps
  FROM public.artisans
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎯 RÉSULTATS DU DIAGNOSTIC';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- Fonctions
  IF v_func_distance THEN
    RAISE NOTICE '✅ Fonction calculate_distance_km() existe';
  ELSE
    RAISE WARNING '❌ Fonction calculate_distance_km() MANQUANTE';
    v_issues := v_issues || ' - FONCTION_DISTANCE';
  END IF;

  IF v_func_notify THEN
    RAISE NOTICE '✅ Fonction notify_nearby_artisans() existe';
  ELSE
    RAISE WARNING '❌ Fonction notify_nearby_artisans() MANQUANTE';
    v_issues := v_issues || ' - FONCTION_NOTIFY';
  END IF;

  -- Trigger
  IF v_trigger_notify THEN
    RAISE NOTICE '✅ Trigger de notification existe';
  ELSE
    RAISE WARNING '❌ Trigger de notification MANQUANT';
    v_issues := v_issues || ' - TRIGGER';
  END IF;

  -- Colonne read/is_read
  IF v_col_read AND v_col_is_read THEN
    RAISE WARNING '⚠️ CONFLIT: colonnes "read" ET "is_read" existent toutes les deux';
    v_issues := v_issues || ' - COLONNE_DOUBLE';
  ELSIF v_col_read THEN
    RAISE NOTICE '✅ Colonne "read" existe (correct)';
  ELSIF v_col_is_read THEN
    RAISE WARNING '⚠️ Colonne "is_read" existe mais devrait être "read"';
    v_issues := v_issues || ' - COLONNE_IS_READ';
  ELSE
    RAISE WARNING '❌ Aucune colonne read/is_read trouvée';
    v_issues := v_issues || ' - COLONNE_MANQUANTE';
  END IF;

  -- Artisans GPS
  IF v_artisans_gps > 0 THEN
    RAISE NOTICE '✅ % artisan(s) ont des coordonnées GPS', v_artisans_gps;
  ELSE
    RAISE WARNING '⚠️ Aucun artisan n''a de coordonnées GPS';
    v_issues := v_issues || ' - PAS_DE_GPS';
  END IF;

  RAISE NOTICE '';
  
  IF v_issues = '' THEN
    RAISE NOTICE '🎉 TOUT EST CORRECT !';
  ELSE
    RAISE WARNING '⚠️ PROBLÈMES DÉTECTÉS:%', v_issues;
    RAISE NOTICE '';
    RAISE NOTICE '📝 ACTIONS RECOMMANDÉES:';
    
    IF v_issues LIKE '%FONCTION%' OR v_issues LIKE '%TRIGGER%' THEN
      RAISE NOTICE '  → Exécuter: database/FIX_NOTIFICATIONS_ARTISANS_FINAL.sql';
    END IF;
    
    IF v_issues LIKE '%COLONNE%' THEN
      RAISE NOTICE '  → Exécuter: database/FIX_IS_READ_COLUMN.sql';
    END IF;
    
    IF v_issues LIKE '%GPS%' THEN
      RAISE NOTICE '  → Demander aux artisans d''activer la géolocalisation';
    END IF;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END$$;

-- ========================================
-- FIN DU DIAGNOSTIC
-- ========================================
