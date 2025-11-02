-- ========================================
-- 🔔 CORRECTION : Notifications automatiques à l'acceptation de mission
-- ========================================
-- Objectif : Créer automatiquement une notification pour le client
--            quand un artisan accepte une mission
-- Date : 2025-11-01
-- ========================================

-- ========================================
-- 1. FONCTION : Créer notification client
-- ========================================
CREATE OR REPLACE FUNCTION notify_client_on_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id UUID;
  v_client_name TEXT;
  v_artisan_name TEXT;
  v_mission_title TEXT;
BEGIN
  -- Vérifier que c'est bien un changement vers 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    -- Récupérer les infos nécessaires
    SELECT 
      m.client_id,
      c_user.name as client_name,
      m.title,
      a_user.name as artisan_name
    INTO 
      v_client_id,
      v_client_name,
      v_mission_title,
      v_artisan_name
    FROM missions m
    JOIN users c_user ON m.client_id = c_user.id
    LEFT JOIN users a_user ON m.artisan_id = a_user.id
    WHERE m.id = NEW.id;

    -- Insérer la notification pour le client
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      mission_id,
      read,
      created_at
    ) VALUES (
      v_client_id,
      'mission_accepted',
      'Mission acceptée !',
      CASE 
        WHEN v_artisan_name IS NOT NULL THEN 
          v_artisan_name || ' arrive bientôt pour "' || v_mission_title || '"'
        ELSE 
          'Un artisan arrive bientôt pour "' || v_mission_title || '"'
      END,
      NEW.id,
      false,
      NOW()
    );

    -- Log pour debug
    RAISE NOTICE 'Notification créée pour client % (mission %)', v_client_id, NEW.id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 2. TRIGGER : Activer sur UPDATE missions
-- ========================================

-- Drop existing trigger if exists (pour rendre le script idempotent)
DROP TRIGGER IF EXISTS notify_client_on_mission_accepted ON missions;

-- Créer le trigger
CREATE TRIGGER notify_client_on_mission_accepted
  AFTER UPDATE ON missions
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted'))
  EXECUTE FUNCTION notify_client_on_mission_accepted();

-- ========================================
-- 3. VÉRIFICATIONS
-- ========================================

-- Vérifier que le trigger est créé
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgname = 'notify_client_on_mission_accepted';
  
  IF trigger_count > 0 THEN
    RAISE NOTICE '✅ Trigger notify_client_on_mission_accepted créé avec succès';
  ELSE
    RAISE EXCEPTION '❌ Échec de création du trigger';
  END IF;
END $$;

-- Vérifier que la fonction existe
DO $$
DECLARE
  function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE proname = 'notify_client_on_mission_accepted';
  
  IF function_count > 0 THEN
    RAISE NOTICE '✅ Fonction notify_client_on_mission_accepted créée avec succès';
  ELSE
    RAISE EXCEPTION '❌ Échec de création de la fonction';
  END IF;
END $$;

-- ========================================
-- 4. TEST UNITAIRE (optionnel - décommenter pour tester)
-- ========================================
/*
-- Créer une mission de test
DO $$
DECLARE
  test_mission_id UUID;
  test_client_id UUID;
  test_artisan_id UUID;
  notification_count INTEGER;
BEGIN
  -- Récupérer un client et un artisan de test
  SELECT id INTO test_client_id FROM clients LIMIT 1;
  SELECT id INTO test_artisan_id FROM artisans LIMIT 1;
  
  IF test_client_id IS NULL OR test_artisan_id IS NULL THEN
    RAISE NOTICE '⚠️ Pas de données de test disponibles (besoin d''au moins 1 client et 1 artisan)';
    RETURN;
  END IF;

  -- Créer une mission de test
  INSERT INTO missions (
    client_id,
    category,
    title,
    description,
    latitude,
    longitude,
    status,
    estimated_price
  ) VALUES (
    test_client_id,
    'plombier',
    'Test mission pour notification',
    'Test automatique du trigger',
    48.8566,
    2.3522,
    'pending',
    50.00
  ) RETURNING id INTO test_mission_id;

  RAISE NOTICE '📝 Mission de test créée : %', test_mission_id;

  -- Accepter la mission (doit déclencher le trigger)
  UPDATE missions
  SET 
    status = 'accepted',
    artisan_id = test_artisan_id,
    accepted_at = NOW()
  WHERE id = test_mission_id;

  -- Vérifier qu'une notification a été créée
  SELECT COUNT(*) INTO notification_count
  FROM notifications
  WHERE mission_id = test_mission_id
    AND type = 'mission_accepted'
    AND user_id = test_client_id;

  IF notification_count = 1 THEN
    RAISE NOTICE '✅ TEST RÉUSSI : Notification créée automatiquement';
  ELSE
    RAISE WARNING '❌ TEST ÉCHOUÉ : Attendu 1 notification, trouvé %', notification_count;
  END IF;

  -- Nettoyer les données de test
  DELETE FROM notifications WHERE mission_id = test_mission_id;
  DELETE FROM missions WHERE id = test_mission_id;
  
  RAISE NOTICE '🧹 Données de test nettoyées';
END $$;
*/

-- ========================================
-- 5. DOCUMENTATION
-- ========================================
COMMENT ON FUNCTION notify_client_on_mission_accepted() IS 
  'Trigger function: Crée automatiquement une notification pour le client quand un artisan accepte sa mission. Garantit que le client est toujours notifié, même si le code applicatif échoue.';

COMMENT ON TRIGGER notify_client_on_mission_accepted ON missions IS 
  'Déclenché à chaque UPDATE de missions vers status = accepted. Crée une notification pour informer le client.';

-- ========================================
-- 6. REQUÊTES DE MONITORING (�� exécuter après déploiement)
-- ========================================

-- Vérifier les notifications créées dans les dernières 24h
/*
SELECT 
  n.id,
  n.created_at,
  n.title,
  n.message,
  n.read,
  u.name as client_name,
  u.email as client_email,
  m.title as mission_title,
  m.status as mission_status
FROM notifications n
JOIN users u ON n.user_id = u.id
JOIN missions m ON n.mission_id = m.id
WHERE n.type = 'mission_accepted'
  AND n.created_at > NOW() - INTERVAL '24 hours'
ORDER BY n.created_at DESC;
*/

-- Compter les notifications par type
/*
SELECT 
  type,
  COUNT(*) as total,
  COUNT(CASE WHEN read THEN 1 END) as read_count,
  COUNT(CASE WHEN NOT read THEN 1 END) as unread_count
FROM notifications
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY type
ORDER BY total DESC;
*/

-- Trouver les missions acceptées sans notification (bug potentiel)
/*
SELECT 
  m.id,
  m.title,
  m.status,
  m.accepted_at,
  m.client_id,
  u.name as client_name,
  COUNT(n.id) as notification_count
FROM missions m
JOIN users u ON m.client_id = u.id
LEFT JOIN notifications n ON m.id = n.mission_id AND n.type = 'mission_accepted'
WHERE m.status = 'accepted'
  AND m.accepted_at > NOW() - INTERVAL '7 days'
GROUP BY m.id, m.title, m.status, m.accepted_at, m.client_id, u.name
HAVING COUNT(n.id) = 0
ORDER BY m.accepted_at DESC;
*/

-- ========================================
-- FIN DU SCRIPT
-- ========================================

-- Message de succès
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SCRIPT EXÉCUTÉ AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '🔔 Le trigger de notification est maintenant actif';
  RAISE NOTICE '📋 Testez en acceptant une mission dans l''app';
  RAISE NOTICE '🔍 Vérifiez la notification avec la requête :';
  RAISE NOTICE '    SELECT * FROM notifications WHERE type = ''mission_accepted'' ORDER BY created_at DESC LIMIT 5;';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
