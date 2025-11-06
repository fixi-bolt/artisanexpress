-- 🧪 TEST COMPLET DES NOTIFICATIONS
-- Copier-coller ce script dans Supabase SQL Editor

-- 1️⃣ CRÉER UN CLIENT TEST
DO $$
DECLARE
    v_client_id UUID;
    v_artisan_id UUID;
    v_mission_id UUID;
    v_notification_count INTEGER;
    v_row RECORD;  -- ✅ CORRECTION: Déclarer v_row comme RECORD
BEGIN
    -- Trouver ou créer un client
    SELECT id INTO v_client_id 
    FROM users 
    WHERE user_type = 'client' 
    LIMIT 1;
    
    IF v_client_id IS NULL THEN
        RAISE NOTICE '❌ Aucun client trouvé dans la base';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Client trouvé: %', v_client_id;
    
    -- Trouver ou créer un artisan
    SELECT id INTO v_artisan_id 
    FROM users 
    WHERE user_type = 'artisan' 
    LIMIT 1;
    
    IF v_artisan_id IS NULL THEN
        RAISE NOTICE '❌ Aucun artisan trouvé dans la base';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Artisan trouvé: %', v_artisan_id;
    
    -- Nettoyer les anciennes missions de test
    DELETE FROM missions 
    WHERE title = '🧪 TEST NOTIFICATION' 
    AND client_id = v_client_id;
    
    -- Créer une nouvelle mission
    INSERT INTO missions (
        client_id,
        title,
        description,
        category,
        status,
        priority,
        budget_min,
        budget_max,
        latitude,
        longitude,
        address
    ) VALUES (
        v_client_id,
        '🧪 TEST NOTIFICATION',
        'Mission de test pour vérifier les notifications',
        'plumbing',
        'pending',
        'high',
        100,
        200,
        48.8566,
        2.3522,
        'Paris, France'
    ) RETURNING id INTO v_mission_id;
    
    RAISE NOTICE '✅ Mission créée: %', v_mission_id;
    
    -- Attendre un peu (simuler le temps réel)
    PERFORM pg_sleep(1);
    
    -- Accepter la mission par l'artisan
    UPDATE missions 
    SET 
        status = 'accepted',
        artisan_id = v_artisan_id,
        updated_at = NOW()
    WHERE id = v_mission_id;
    
    RAISE NOTICE '✅ Mission acceptée par l''artisan';
    
    -- Attendre que le trigger s'exécute
    PERFORM pg_sleep(2);
    
    -- Vérifier les notifications créées
    SELECT COUNT(*) INTO v_notification_count
    FROM notifications
    WHERE mission_id = v_mission_id
    AND user_id = v_client_id;
    
    IF v_notification_count > 0 THEN
        RAISE NOTICE '🎉 SUCCÈS ! % notification(s) créée(s)', v_notification_count;
        
        -- Afficher les détails de la notification
        RAISE NOTICE '📋 Détails de la notification:';
        FOR v_row IN 
            SELECT 
                id,
                type,
                title,
                message,
                is_read,
                created_at
            FROM notifications
            WHERE mission_id = v_mission_id
            AND user_id = v_client_id
            ORDER BY created_at DESC
        LOOP
            RAISE NOTICE '  - Type: %, Titre: %, Lue: %', v_row.type, v_row.title, v_row.is_read;
        END LOOP;
    ELSE
        RAISE NOTICE '❌ ÉCHEC ! Aucune notification créée';
        RAISE NOTICE '🔍 Vérifier que:';
        RAISE NOTICE '   1. Le trigger est actif';
        RAISE NOTICE '   2. La fonction send_mission_accepted_notification existe';
        RAISE NOTICE '   3. Les RLS sont configurés correctement';
    END IF;
    
    -- Afficher un résumé
    RAISE NOTICE '';
    RAISE NOTICE '📊 RÉSUMÉ DU TEST:';
    RAISE NOTICE '==================';
    RAISE NOTICE 'Client ID: %', v_client_id;
    RAISE NOTICE 'Artisan ID: %', v_artisan_id;
    RAISE NOTICE 'Mission ID: %', v_mission_id;
    RAISE NOTICE 'Notifications créées: %', v_notification_count;
    RAISE NOTICE '';
    
END $$;

-- 2️⃣ AFFICHER TOUTES LES NOTIFICATIONS RÉCENTES
SELECT 
    '📬 NOTIFICATIONS RÉCENTES (dernières 5)' as section;

SELECT 
    n.id,
    n.type,
    n.title,
    n.message,
    n.is_read,
    u.full_name as destinataire,
    m.title as mission,
    n.created_at
FROM notifications n
LEFT JOIN users u ON n.user_id = u.id
LEFT JOIN missions m ON n.mission_id = m.id
ORDER BY n.created_at DESC
LIMIT 5;

-- 3️⃣ VÉRIFIER LA CONFIGURATION
SELECT '🔧 VÉRIFICATION DE LA CONFIGURATION' as section;

SELECT 
    'Trigger actif' as check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_trigger 
            WHERE tgname = 'on_mission_accepted_notify'
        ) THEN '✅ OUI'
        ELSE '❌ NON'
    END as status;

SELECT 
    'Fonction existe' as check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_proc 
            WHERE proname = 'send_mission_accepted_notification'
        ) THEN '✅ OUI'
        ELSE '❌ NON'
    END as status;

SELECT 
    'Realtime activé' as check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
            AND tablename = 'notifications'
        ) THEN '✅ OUI'
        ELSE '❌ NON'
    END as status;
