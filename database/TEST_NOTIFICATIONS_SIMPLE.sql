-- ========================================
-- 🧪 TEST DES NOTIFICATIONS - SCRIPT SIMPLE
-- ========================================

DO $$
DECLARE
  v_client_id UUID;
  v_artisan_id UUID;
  v_mission_id UUID;
  v_notification_count INTEGER;
BEGIN
  RAISE NOTICE '=== 🧪 DÉBUT DU TEST DE NOTIFICATIONS ===';
  
  -- ========================================
  -- 1️⃣ CRÉER UN CLIENT TEST
  -- ========================================
  RAISE NOTICE '1️⃣ Création du client test...';
  
  INSERT INTO users (email, name, phone, user_type)
  VALUES ('client.test@artisannow.com', 'Client Test', '+33612345678', 'client')
  RETURNING id INTO v_client_id;
  
  INSERT INTO clients (id) VALUES (v_client_id);
  
  RAISE NOTICE '   ✅ Client créé: %', v_client_id;
  
  -- ========================================
  -- 2️⃣ CRÉER UN ARTISAN TEST
  -- ========================================
  RAISE NOTICE '2️⃣ Création de l''artisan test...';
  
  INSERT INTO users (email, name, phone, user_type)
  VALUES ('artisan.test@artisannow.com', 'Artisan Test', '+33623456789', 'artisan')
  RETURNING id INTO v_artisan_id;
  
  INSERT INTO artisans (id, category, hourly_rate, intervention_radius, is_available, latitude, longitude)
  VALUES (v_artisan_id, 'plumbing', 50.00, 20, true, 48.8566, 2.3522);
  
  RAISE NOTICE '   ✅ Artisan créé: %', v_artisan_id;
  
  -- ========================================
  -- 3️⃣ CRÉER UNE MISSION TEST
  -- ========================================
  RAISE NOTICE '3️⃣ Création de la mission test...';
  
  INSERT INTO missions (
    client_id,
    title,
    description,
    category,
    status,
    estimated_price,
    latitude,
    longitude,
    address
  ) VALUES (
    v_client_id,
    '🧪 TEST NOTIFICATION',
    'Mission de test pour vérifier les notifications',
    'plumbing',
    'pending',
    150.00,
    48.8566,
    2.3522,
    'Paris, France'
  ) RETURNING id INTO v_mission_id;
  
  RAISE NOTICE '   ✅ Mission créée: %', v_mission_id;
  
  -- ========================================
  -- 4️⃣ ACCEPTER LA MISSION (TRIGGER LA NOTIFICATION)
  -- ========================================
  RAISE NOTICE '4️⃣ Acceptation de la mission par l''artisan...';
  
  UPDATE missions 
  SET 
    status = 'accepted',
    artisan_id = v_artisan_id,
    accepted_at = NOW()
  WHERE id = v_mission_id;
  
  RAISE NOTICE '   ✅ Mission acceptée';
  
  -- ========================================
  -- 5️⃣ VÉRIFIER QUE LA NOTIFICATION A ÉTÉ CRÉÉE
  -- ========================================
  RAISE NOTICE '5️⃣ Vérification de la notification...';
  
  SELECT COUNT(*) INTO v_notification_count
  FROM notifications
  WHERE user_id = v_client_id
    AND mission_id = v_mission_id
    AND type = 'mission_accepted';
  
  IF v_notification_count > 0 THEN
    RAISE NOTICE '   ✅ SUCCÈS: % notification(s) créée(s) pour le client!', v_notification_count;
    
    -- Afficher les détails de la notification
    RAISE NOTICE '   📧 Détails de la notification:';
    FOR v_row IN (
      SELECT title, message, created_at
      FROM notifications
      WHERE user_id = v_client_id AND mission_id = v_mission_id
      ORDER BY created_at DESC
      LIMIT 1
    ) LOOP
      RAISE NOTICE '      - Titre: %', v_row.title;
      RAISE NOTICE '      - Message: %', v_row.message;
      RAISE NOTICE '      - Créée: %', v_row.created_at;
    END LOOP;
  ELSE
    RAISE NOTICE '   ❌ ERREUR: Aucune notification créée!';
  END IF;
  
  -- ========================================
  -- 6️⃣ NETTOYER LES DONNÉES DE TEST
  -- ========================================
  RAISE NOTICE '6️⃣ Nettoyage des données de test...';
  
  DELETE FROM notifications WHERE mission_id = v_mission_id;
  DELETE FROM missions WHERE id = v_mission_id;
  DELETE FROM clients WHERE id = v_client_id;
  DELETE FROM artisans WHERE id = v_artisan_id;
  DELETE FROM users WHERE id IN (v_client_id, v_artisan_id);
  
  RAISE NOTICE '   ✅ Données nettoyées';
  
  RAISE NOTICE '=== ✅ FIN DU TEST ===';
  
  -- Retourner le résultat
  IF v_notification_count > 0 THEN
    RAISE NOTICE '🎉 TEST RÉUSSI: Les notifications fonctionnent correctement!';
  ELSE
    RAISE EXCEPTION '❌ TEST ÉCHOUÉ: Les notifications ne fonctionnent pas!';
  END IF;
END;
$$;
