-- ═══════════════════════════════════════════════════════════════
-- 🧪 SCRIPT DE TEST - Vérifier que les notifications fonctionnent
-- ═══════════════════════════════════════════════════════════════
-- Exécutez ce script APRÈS avoir appliqué le fix principal
-- ═══════════════════════════════════════════════════════════════

-- 1️⃣ VÉRIFIER LA STRUCTURE DE LA BASE
-- ═══════════════════════════════════════════════════════════════

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '1️⃣  VÉRIFICATION DE LA STRUCTURE';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- Vérifier que la colonne is_read existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'notifications' 
            AND column_name = 'is_read'
        ) THEN '✅ Colonne notifications.is_read existe'
        ELSE '❌ ERREUR: Colonne notifications.is_read manquante'
    END as resultat;

-- Vérifier que le trigger existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM pg_trigger 
            WHERE tgname = 'trg_notify_mission_accepted'
        ) THEN '✅ Trigger trg_notify_mission_accepted existe'
        ELSE '❌ ERREUR: Trigger trg_notify_mission_accepted manquant'
    END as resultat;

-- Vérifier que la fonction existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM pg_proc 
            WHERE proname = 'notify_client_on_mission_accepted'
        ) THEN '✅ Fonction notify_client_on_mission_accepted existe'
        ELSE '❌ ERREUR: Fonction notify_client_on_mission_accepted manquante'
    END as resultat;

-- 2️⃣ VÉRIFIER LES DONNÉES EXISTANTES
-- ═══════════════════════════════════════════════════════════════

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '2️⃣  VÉRIFICATION DES DONNÉES';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- Compter les missions en attente
SELECT 
    '📋 Missions en attente' as type,
    COUNT(*) as nombre
FROM missions
WHERE status = 'pending';

-- Compter les missions acceptées
SELECT 
    '✅ Missions acceptées' as type,
    COUNT(*) as nombre
FROM missions
WHERE status = 'accepted';

-- Compter les notifications
SELECT 
    '🔔 Total notifications' as type,
    COUNT(*) as nombre
FROM notifications;

-- Compter les notifications non lues
SELECT 
    '📬 Notifications non lues' as type,
    COUNT(*) as nombre
FROM notifications
WHERE is_read = false;

-- 3️⃣ AFFICHER UNE MISSION DE TEST
-- ═══════════════════════════════════════════════════════════════

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '3️⃣  MISSION DE TEST (si disponible)';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- Afficher une mission en attente pour tester
SELECT 
    m.id as mission_id,
    m.title as mission_titre,
    m.status as statut,
    m.client_id as client_user_id,
    u.name as nom_client,
    u.email as email_client
FROM missions m
JOIN users u ON u.id = m.client_id
WHERE m.status = 'pending'
LIMIT 1;

-- 4️⃣ INSTRUCTIONS DE TEST MANUEL
-- ═══════════════════════════════════════════════════════════════

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '4️⃣  INSTRUCTIONS DE TEST MANUEL';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'Pour tester le système de notifications:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Connectez-vous comme ARTISAN';
    RAISE NOTICE '2. Acceptez une mission en attente';
    RAISE NOTICE '3. Connectez-vous comme CLIENT (qui a créé la mission)';
    RAISE NOTICE '4. Vérifiez que vous avez reçu la notification';
    RAISE NOTICE '';
    RAISE NOTICE 'OU utilisez ce script SQL pour simuler:';
    RAISE NOTICE '';
    RAISE NOTICE 'DO $sim$ ';
    RAISE NOTICE 'DECLARE';
    RAISE NOTICE '    v_mission_id uuid;';
    RAISE NOTICE '    v_artisan_id uuid;';
    RAISE NOTICE 'BEGIN';
    RAISE NOTICE '    -- Récupérer une mission en attente';
    RAISE NOTICE '    SELECT id INTO v_mission_id FROM missions WHERE status = ''pending'' LIMIT 1;';
    RAISE NOTICE '    -- Récupérer un artisan disponible';
    RAISE NOTICE '    SELECT id INTO v_artisan_id FROM artisans WHERE is_available = true LIMIT 1;';
    RAISE NOTICE '    ';
    RAISE NOTICE '    -- Simuler acceptation';
    RAISE NOTICE '    UPDATE missions ';
    RAISE NOTICE '    SET status = ''accepted'', artisan_id = v_artisan_id, accepted_at = NOW()';
    RAISE NOTICE '    WHERE id = v_mission_id;';
    RAISE NOTICE '    ';
    RAISE NOTICE '    RAISE NOTICE ''✅ Mission % acceptée par artisan %'', v_mission_id, v_artisan_id;';
    RAISE NOTICE 'END $sim$;';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- 5️⃣ VÉRIFIER REALTIME
-- ═══════════════════════════════════════════════════════════════

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '5️⃣  VÉRIFICATION REALTIME';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- Vérifier que Realtime est activé pour les notifications
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'notifications'
        ) THEN '✅ Realtime activé pour notifications'
        ELSE '⚠️  ATTENTION: Realtime NON activé pour notifications'
    END as resultat;

-- Vérifier que Realtime est activé pour les missions
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'missions'
        ) THEN '✅ Realtime activé pour missions'
        ELSE '⚠️  ATTENTION: Realtime NON activé pour missions'
    END as resultat;

-- ═══════════════════════════════════════════════════════════════
-- 🎉 FIN DU TEST
-- ═══════════════════════════════════════════════════════════════
-- Si tous les ✅ sont verts, le système est prêt !
-- Sinon, ré-exécutez FIX_NOTIFICATIONS_ACCEPTATION_FINAL.sql
-- ═══════════════════════════════════════════════════════════════
