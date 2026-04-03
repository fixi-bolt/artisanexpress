-- ========================================
-- 🧪 SCRIPT DE TEST DES NOTIFICATIONS
-- ========================================
-- Ce script :
-- 1. Crée des utilisateurs de test (client + artisan)
-- 2. Crée une mission
-- 3. Simule l'acceptation de la mission
-- 4. Vérifie que la notification est créée
-- ========================================

DO $$
DECLARE
    -- IDs pour les entités de test
    v_client_user_id uuid;
    v_client_id uuid;
    v_artisan_user_id uuid;
    v_artisan_id uuid;
    v_mission_id uuid;
    
    -- Variables pour les vérifications
    v_notification_count integer;
    v_notification_id uuid;
    v_notification_title text;
    v_notification_message text;
    v_trigger_exists boolean;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔═══════════════════════════════════════════════╗';
    RAISE NOTICE '║  🧪 TEST DES NOTIFICATIONS - DÉBUT           ║';
    RAISE NOTICE '╚═══════════════════════════════════════════════╝';
    RAISE NOTICE '';
    
    -- ========================================
    -- ÉTAPE 1: NETTOYAGE
    -- ========================================
    RAISE NOTICE '🧹 Étape 1/6: Nettoyage des données de test...';
    
    -- Supprimer les notifications de test
    DELETE FROM notifications 
    WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE '%test-notif%'
    );
    
    -- Supprimer les missions de test
    DELETE FROM missions 
    WHERE client_id IN (
        SELECT id FROM clients WHERE user_id IN (
            SELECT id FROM users WHERE email LIKE '%test-notif%'
        )
    );
    
    -- Supprimer les artisans de test
    DELETE FROM artisans 
    WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE '%test-notif%'
    );
    
    -- Supprimer les clients de test
    DELETE FROM clients 
    WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE '%test-notif%'
    );
    
    -- Supprimer les utilisateurs de test
    DELETE FROM users WHERE email LIKE '%test-notif%';
    
    RAISE NOTICE '   ✅ Nettoyage terminé';
    RAISE NOTICE '';
    
    -- ========================================
    -- ÉTAPE 2: CRÉER UN CLIENT DE TEST
    -- ========================================
    RAISE NOTICE '👤 Étape 2/6: Création du client de test...';
    
    -- Créer l'utilisateur client
    INSERT INTO users (id, email, name, user_type, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'client-test-notif@test.com',
        'Client Test Notifications',
        'client',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_client_user_id;
    
    -- Créer le profil client
    INSERT INTO clients (id, user_id, created_at, updated_at)
    VALUES (
        v_client_user_id,
        v_client_user_id,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_client_id;
    
    RAISE NOTICE '   ✅ Client créé';
    RAISE NOTICE '   📧 Email: client-test-notif@test.com';
    RAISE NOTICE '   🆔 User ID: %', v_client_user_id;
    RAISE NOTICE '   🆔 Client ID: %', v_client_id;
    RAISE NOTICE '';
    
    -- ========================================
    -- ÉTAPE 3: CRÉER UN ARTISAN DE TEST
    -- ========================================
    RAISE NOTICE '👷 Étape 3/6: Création de l''artisan de test...';
    
    -- Créer l'utilisateur artisan
    INSERT INTO users (id, email, name, phone, user_type, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'artisan-test-notif@test.com',
        'Artisan Test Notifications',
        '+33687654321',
        'artisan',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_artisan_user_id;
    
    -- Créer le profil artisan
    INSERT INTO artisans (
        id, 
        user_id, 
        category,
        hourly_rate,
        travel_fee,
        intervention_radius,
        latitude,
        longitude,
        is_available,
        created_at, 
        updated_at
    )
    VALUES (
        v_artisan_user_id,
        v_artisan_user_id,
        'plumbing',
        50.00,
        0.00,
        10,
        48.8566,
        2.3522,
        true,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_artisan_id;
    
    RAISE NOTICE '   ✅ Artisan créé';
    RAISE NOTICE '   📧 Email: artisan-test-notif@test.com';
    RAISE NOTICE '   🆔 User ID: %', v_artisan_user_id;
    RAISE NOTICE '   🆔 Artisan ID: %', v_artisan_id;
    RAISE NOTICE '';
    
    -- ========================================
    -- ÉTAPE 4: CRÉER UNE MISSION
    -- ========================================
    RAISE NOTICE '📋 Étape 4/6: Création de la mission de test...';
    
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
        v_client_id,
        '🧪 TEST - Mission pour tester les notifications',
        'Cette mission sert à vérifier que les notifications fonctionnent correctement',
        'plumbing',
        'pending',
        150.00,
        0.10,
        48.8566,
        2.3522,
        'Paris, France',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_mission_id;
    
    RAISE NOTICE '   ✅ Mission créée';
    RAISE NOTICE '   🆔 Mission ID: %', v_mission_id;
    RAISE NOTICE '   📍 Localisation: Paris, France';
    RAISE NOTICE '   💰 Prix estimé: 150.00 EUR';
    RAISE NOTICE '';
    
    -- ========================================
    -- ÉTAPE 5: VÉRIFIER LE TRIGGER
    -- ========================================
    RAISE NOTICE '🔍 Étape 5/6: Vérification du trigger...';
    
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_notify_client_on_acceptance'
        AND event_object_table = 'missions'
    ) INTO v_trigger_exists;
    
    IF v_trigger_exists THEN
        RAISE NOTICE '   ✅ Le trigger existe et est actif';
    ELSE
        RAISE NOTICE '   ❌ ERREUR: Le trigger n''existe pas!';
        RAISE NOTICE '   ℹ️  Exécutez d''abord: database/FIX_NOTIFICATIONS_CLIENT_FINAL.sql';
        RETURN;
    END IF;
    RAISE NOTICE '';
    
    -- ========================================
    -- ÉTAPE 6: SIMULER L'ACCEPTATION
    -- ========================================
    RAISE NOTICE '✋ Étape 6/6: Simulation de l''acceptation de la mission...';
    RAISE NOTICE '   ⏳ L''artisan accepte la mission...';
    
    -- L'artisan accepte la mission (ceci devrait déclencher le trigger)
    UPDATE missions
    SET 
        status = 'accepted',
        artisan_id = v_artisan_id,
        eta = 15,
        updated_at = NOW()
    WHERE id = v_mission_id;
    
    RAISE NOTICE '   ✅ Mission mise à jour (status = accepted)';
    RAISE NOTICE '';
    
    -- Attendre un peu pour laisser le trigger s'exécuter
    PERFORM pg_sleep(0.5);
    
    -- ========================================
    -- VÉRIFICATION DES RÉSULTATS
    -- ========================================
    RAISE NOTICE '╔═══════════════════════════════════════════════╗';
    RAISE NOTICE '║  📊 RÉSULTATS DU TEST                        ║';
    RAISE NOTICE '╚═══════════════════════════════════════════════╝';
    RAISE NOTICE '';
    
    -- Compter les notifications créées
    SELECT COUNT(*) 
    INTO v_notification_count
    FROM notifications
    WHERE user_id = v_client_user_id;
    
    IF v_notification_count > 0 THEN
        RAISE NOTICE '✅ SUCCESS! Notification créée avec succès';
        RAISE NOTICE '';
        
        -- Récupérer les détails de la notification
        SELECT id, title, message 
        INTO v_notification_id, v_notification_title, v_notification_message
        FROM notifications
        WHERE user_id = v_client_user_id
        ORDER BY created_at DESC
        LIMIT 1;
        
        RAISE NOTICE '📬 Détails de la notification:';
        RAISE NOTICE '   ─────────────────────────────────────';
        RAISE NOTICE '   🆔 ID: %', v_notification_id;
        RAISE NOTICE '   📧 Destinataire: %', v_client_user_id;
        RAISE NOTICE '   📝 Titre: %', v_notification_title;
        RAISE NOTICE '   💬 Message: %', v_notification_message;
        RAISE NOTICE '';
        
        RAISE NOTICE '╔═══════════════════════════════════════════════╗';
        RAISE NOTICE '║  ✅ TEST RÉUSSI - NOTIFICATIONS OK           ║';
        RAISE NOTICE '╚═══════════════════════════════════════════════╝';
    ELSE
        RAISE NOTICE '❌ ÉCHEC: Aucune notification créée';
        RAISE NOTICE '';
        RAISE NOTICE '🔍 Diagnostic:';
        RAISE NOTICE '   • Le trigger existe: %', v_trigger_exists;
        RAISE NOTICE '   • Client User ID: %', v_client_user_id;
        RAISE NOTICE '   • Mission ID: %', v_mission_id;
        RAISE NOTICE '   • Status de la mission: accepted';
        RAISE NOTICE '';
        RAISE NOTICE '💡 Actions suggérées:';
        RAISE NOTICE '   1. Vérifier que le trigger est bien activé';
        RAISE NOTICE '   2. Consulter les logs Supabase pour voir les erreurs';
        RAISE NOTICE '   3. Vérifier les permissions RLS sur la table notifications';
        RAISE NOTICE '';
        
        RAISE NOTICE '╔═══════════════════════════════════════════════╗';
        RAISE NOTICE '║  ❌ TEST ÉCHOUÉ - VOIR DIAGNOSTIC            ║';
        RAISE NOTICE '╚═══════════════════════════════════════════════╝';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🏁 FIN DU TEST';
    RAISE NOTICE '';
    
END $$;

-- ========================================
-- AFFICHAGE RÉCAPITULATIF
-- ========================================
SELECT 
    '📊 RÉCAPITULATIF' as section,
    '══════════════════════════════════════════════' as separator;

SELECT 
    '👥 UTILISATEURS DE TEST CRÉÉS' as info;
    
SELECT 
    '  • ' || u.name as utilisateur,
    '  📧 ' || u.email as email,
    '  👤 ' || u.user_type as type,
    '  🆔 ' || u.id::text as id
FROM users u
WHERE u.email LIKE '%test-notif%'
ORDER BY u.user_type;

SELECT 
    '📋 MISSIONS DE TEST CRÉÉES' as info;

SELECT 
    '  • ' || m.title as mission,
    '  📍 ' || m.status as status,
    '  🆔 ' || m.id::text as id
FROM missions m
WHERE m.title LIKE '%TEST%'
ORDER BY m.created_at DESC;

SELECT 
    '📬 NOTIFICATIONS CRÉÉES' as info;

SELECT 
    '  • ' || n.title as notification,
    '  💬 ' || n.message as message,
    '  👁️ ' || CASE WHEN n.is_read THEN 'Lu' ELSE 'Non lu' END as statut,
    '  🕐 ' || n.created_at::text as cree_le
FROM notifications n
WHERE n.user_id IN (
    SELECT id FROM users WHERE email LIKE '%test-notif%'
)
ORDER BY n.created_at DESC;
