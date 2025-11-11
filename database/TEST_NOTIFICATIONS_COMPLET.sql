-- 🧪 SCRIPT DE TEST COMPLET POUR LES NOTIFICATIONS
-- Ce script crée un client et un artisan de test, puis simule l'acceptation d'une mission

DO $
DECLARE
    v_test_user_id uuid;
    v_test_client_id uuid;
    v_test_artisan_user_id uuid;
    v_test_artisan_id uuid;
    v_test_mission_id uuid;
    v_notification_count integer;
    v_row RECORD;
BEGIN
    RAISE NOTICE '🧪 DÉBUT DES TESTS DE NOTIFICATIONS';
    RAISE NOTICE '═══════════════════════════════════';
    
    -- 1. NETTOYAGE
    RAISE NOTICE '';
    RAISE NOTICE '🧹 Nettoyage des données de test précédentes...';
    
    DELETE FROM notifications WHERE message LIKE '%TEST%';
    DELETE FROM mission_applications WHERE mission_id IN (
        SELECT id FROM missions WHERE title LIKE '%TEST%'
    );
    DELETE FROM missions WHERE title LIKE '%TEST%';
    DELETE FROM artisans WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE '%test-notif%'
    );
    DELETE FROM clients WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE '%test-notif%'
    );
    DELETE FROM users WHERE email LIKE '%test-notif%';
    
    RAISE NOTICE '✅ Nettoyage terminé';
    
    -- 2. CRÉER UN UTILISATEUR CLIENT
    RAISE NOTICE '';
    RAISE NOTICE '👤 Création d''un client de test...';
    
    INSERT INTO users (id, email, user_type, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'client-test-notif@test.com',
        'client',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_test_user_id;
    
    INSERT INTO clients (id, user_id, name, phone, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        v_test_user_id,
        'Client Test Notifications',
        '+33612345678',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_test_client_id;
    
    RAISE NOTICE '✅ Client créé: %', v_test_client_id;
    
    -- 3. CRÉER UN UTILISATEUR ARTISAN
    RAISE NOTICE '';
    RAISE NOTICE '👷 Création d''un artisan de test...';
    
    INSERT INTO users (id, email, user_type, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'artisan-test-notif@test.com',
        'artisan',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_test_artisan_user_id;
    
    INSERT INTO artisans (
        id, 
        user_id, 
        name, 
        phone, 
        specialty,
        latitude,
        longitude,
        address,
        is_available,
        created_at, 
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        v_test_artisan_user_id,
        'Artisan Test Notifications',
        '+33687654321',
        'plumbing',
        48.8566,
        2.3522,
        'Paris, France',
        true,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_test_artisan_id;
    
    RAISE NOTICE '✅ Artisan créé: %', v_test_artisan_id;
    
    -- 4. CRÉER UNE MISSION
    RAISE NOTICE '';
    RAISE NOTICE '📋 Création d''une mission de test...';
    
    INSERT INTO missions (
        id,
        client_id,
        title,
        description,
        category,
        status,
        estimated_price,
        commission,
        latitude,
        longitude,
        address,
        created_at,
        updated_at
    )
    VALUES (
        gen_random_uuid(),
        v_test_client_id,
        '🧪 TEST - Acceptation mission',
        'Mission de test pour vérifier que les notifications fonctionnent',
        'plumbing',
        'pending',
        100,
        0.10,
        48.8566,
        2.3522,
        'Paris, France',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_test_mission_id;
    
    RAISE NOTICE '✅ Mission créée: %', v_test_mission_id;
    
    -- 5. SIMULER L'ACCEPTATION DE LA MISSION
    RAISE NOTICE '';
    RAISE NOTICE '✋ Simulation de l''acceptation de la mission...';
    
    -- L'artisan accepte la mission
    UPDATE missions
    SET 
        status = 'accepted',
        artisan_id = v_test_artisan_id,
        updated_at = NOW()
    WHERE id = v_test_mission_id;
    
    RAISE NOTICE '✅ Mission acceptée par l''artisan';
    
    -- 6. ATTENDRE UN PEU POUR LAISSER LE TRIGGER S'EXÉCUTER
    PERFORM pg_sleep(1);
    
    -- 7. VÉRIFIER LES NOTIFICATIONS
    RAISE NOTICE '';
    RAISE NOTICE '📬 Vérification des notifications créées...';
    RAISE NOTICE '';
    
    SELECT COUNT(*) INTO v_notification_count
    FROM notifications
    WHERE user_id = v_test_user_id
    AND message LIKE '%accepté%';
    
    IF v_notification_count > 0 THEN
        RAISE NOTICE '✅ SUCCESS! % notification(s) créée(s)', v_notification_count;
        RAISE NOTICE '';
        RAISE NOTICE 'Détails de la notification:';
        RAISE NOTICE '─────────────────────────────';
        
        FOR v_row IN (
            SELECT 
                id,
                user_id,
                type,
                title,
                message,
                is_read,
                created_at
            FROM notifications
            WHERE user_id = v_test_user_id
            AND message LIKE '%accepté%'
            ORDER BY created_at DESC
            LIMIT 1
        ) LOOP
            RAISE NOTICE 'ID: %', v_row.id;
            RAISE NOTICE 'User ID: %', v_row.user_id;
            RAISE NOTICE 'Type: %', v_row.type;
            RAISE NOTICE 'Title: %', v_row.title;
            RAISE NOTICE 'Message: %', v_row.message;
            RAISE NOTICE 'Lu: %', v_row.is_read;
            RAISE NOTICE 'Créée le: %', v_row.created_at;
        END LOOP;
    ELSE
        RAISE NOTICE '❌ ÉCHEC: Aucune notification créée';
        RAISE NOTICE '';
        RAISE NOTICE 'Vérification du trigger...';
        
        SELECT COUNT(*) INTO v_notification_count
        FROM pg_trigger
        WHERE tgname = 'trigger_mission_accepted_notification';
        
        IF v_notification_count > 0 THEN
            RAISE NOTICE '✅ Le trigger existe';
        ELSE
            RAISE NOTICE '❌ Le trigger n''existe pas';
        END IF;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════';
    RAISE NOTICE '🧪 FIN DES TESTS';
    
    -- 8. AFFICHER UN RÉSUMÉ
    RAISE NOTICE '';
    RAISE NOTICE 'RÉSUMÉ:';
    RAISE NOTICE '-------';
    RAISE NOTICE 'Client ID: %', v_test_client_id;
    RAISE NOTICE 'Artisan ID: %', v_test_artisan_id;
    RAISE NOTICE 'Mission ID: %', v_test_mission_id;
    RAISE NOTICE 'Notifications créées: %', v_notification_count;
    
END $$;

-- Afficher toutes les notifications de test créées
SELECT 
    '📬 TOUTES LES NOTIFICATIONS DE TEST' as info,
    n.id,
    u.email as destinataire,
    n.type,
    n.title,
    n.message,
    n.is_read,
    n.created_at
FROM notifications n
JOIN users u ON u.id = n.user_id
WHERE u.email LIKE '%test-notif%'
ORDER BY n.created_at DESC;
