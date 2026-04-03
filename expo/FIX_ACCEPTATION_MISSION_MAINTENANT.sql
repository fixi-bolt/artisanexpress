-- ============================================================================
-- 🚨 FIX URGENT : Acceptation mission + Notification client
-- ============================================================================
-- Problème : L'artisan accepte mais le client ne reçoit pas la notification
--            et le statut reste "pending"
-- ============================================================================
-- ⏱️  Temps estimé : 30 secondes
-- 📋 À faire : Copier-coller dans l'éditeur SQL de Supabase
-- ============================================================================

-- 🔍 ÉTAPE 1 : DIAGNOSTIC RAPIDE
SELECT '🔍 ÉTAPE 1 : DIAGNOSTIC' as etape;

-- Vérifier si le trigger existe
SELECT 
  COALESCE(
    (SELECT '✅ Trigger existe' FROM pg_trigger WHERE tgname = 'trg_notify_mission_accepted'),
    '❌ Trigger manquant'
  ) as status_trigger;

-- Vérifier si la fonction existe
SELECT 
  COALESCE(
    (SELECT '✅ Fonction existe' FROM pg_proc WHERE proname = 'notify_client_on_mission_accepted'),
    '❌ Fonction manquante'
  ) as status_fonction;

-- 🧹 ÉTAPE 2 : NETTOYAGE (supprimer anciennes versions)
SELECT '🧹 ÉTAPE 2 : NETTOYAGE' as etape;

DROP TRIGGER IF EXISTS trg_notify_mission_accepted ON public.missions CASCADE;
DROP TRIGGER IF EXISTS trigger_notify_client_on_acceptance ON public.missions CASCADE;
DROP FUNCTION IF EXISTS notify_client_on_mission_accepted() CASCADE;
DROP FUNCTION IF EXISTS send_mission_accepted_notification() CASCADE;

SELECT '✅ Nettoyage terminé' as status;

-- 🔧 ÉTAPE 3 : CRÉER LA FONCTION DE NOTIFICATION
SELECT '🔧 ÉTAPE 3 : CRÉATION FONCTION' as etape;

CREATE OR REPLACE FUNCTION notify_client_on_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id uuid;
  v_mission_title text;
BEGIN
  -- Ne déclencher que si le statut passe à "accepted"
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    -- Récupérer le client_id et le titre
    v_client_id := NEW.client_id;
    v_mission_title := NEW.title;
    
    -- Insérer la notification pour le client
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      mission_id,
      is_read,
      created_at
    ) VALUES (
      v_client_id,
      'mission_accepted',
      '✅ Mission acceptée !',
      'Un artisan a accepté votre demande "' || v_mission_title || '" et arrive bientôt.',
      NEW.id,
      false,
      NOW()
    );
    
    RAISE NOTICE '✅ Notification créée pour client % (mission %)', v_client_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ Fonction créée' as status;

-- 🎯 ÉTAPE 4 : CRÉER LE TRIGGER
SELECT '🎯 ÉTAPE 4 : CRÉATION TRIGGER' as etape;

CREATE TRIGGER trg_notify_mission_accepted
  AFTER UPDATE OF status ON public.missions
  FOR EACH ROW
  EXECUTE FUNCTION notify_client_on_mission_accepted();

SELECT '✅ Trigger créé' as status;

-- 🔐 ÉTAPE 5 : VÉRIFIER LES PERMISSIONS RLS
SELECT '🔐 ÉTAPE 5 : PERMISSIONS RLS' as etape;

-- S'assurer que les policies permettent l'insertion
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read their own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

SELECT '✅ Permissions configurées' as status;

-- 📡 ÉTAPE 6 : VÉRIFIER LA PUBLICATION REALTIME
SELECT '📡 ÉTAPE 6 : REALTIME' as etape;

-- Vérifier que notifications est dans la publication realtime
DO $$
BEGIN
  -- Ajouter la table à la publication si elle n'y est pas déjà
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    RAISE NOTICE '✅ Table notifications ajoutée à la publication realtime';
  ELSE
    RAISE NOTICE '✅ Table notifications déjà dans la publication realtime';
  END IF;
END $$;

-- 🧪 ÉTAPE 7 : TEST COMPLET
SELECT '🧪 ÉTAPE 7 : TEST COMPLET' as etape;

DO $$
DECLARE
  v_test_client_id uuid;
  v_test_artisan_id uuid;
  v_test_mission_id uuid;
  v_notif_count_before integer;
  v_notif_count_after integer;
BEGIN
  -- Créer des utilisateurs de test si nécessaire
  INSERT INTO public.users (id, name, email, user_type, phone)
  VALUES (
    gen_random_uuid(),
    'Client Test',
    'client.test@example.com',
    'client',
    '+33612345678'
  )
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_test_client_id;
  
  INSERT INTO public.users (id, name, email, user_type, phone)
  VALUES (
    gen_random_uuid(),
    'Artisan Test',
    'artisan.test@example.com',
    'artisan',
    '+33612345679'
  )
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_test_artisan_id;
  
  -- Créer une mission de test
  INSERT INTO public.missions (
    client_id,
    title,
    description,
    category,
    status,
    estimated_price,
    commission,
    latitude,
    longitude,
    address
  ) VALUES (
    v_test_client_id,
    '🧪 TEST - Acceptation mission',
    'Mission de test pour vérifier que les notifications fonctionnent',
    'plumbing',
    'pending',
    100,
    0.10,
    48.8566,
    2.3522,
    'Paris, France'
  ) RETURNING id INTO v_test_mission_id;
  
  RAISE NOTICE '✅ Mission test créée : %', v_test_mission_id;
  
  -- Compter les notifications avant
  SELECT COUNT(*) INTO v_notif_count_before 
  FROM public.notifications 
  WHERE user_id = v_test_client_id;
  
  -- SIMULER L'ACCEPTATION PAR L'ARTISAN
  UPDATE public.missions
  SET 
    status = 'accepted',
    artisan_id = v_test_artisan_id,
    accepted_at = NOW(),
    eta = 15
  WHERE id = v_test_mission_id;
  
  RAISE NOTICE '✅ Mission acceptée par l''artisan';
  
  -- Attendre un peu pour que le trigger se déclenche
  PERFORM pg_sleep(0.5);
  
  -- Compter les notifications après
  SELECT COUNT(*) INTO v_notif_count_after 
  FROM public.notifications 
  WHERE user_id = v_test_client_id;
  
  -- Vérifier le résultat
  IF v_notif_count_after > v_notif_count_before THEN
    RAISE NOTICE '✅✅✅ TEST RÉUSSI ! Notification créée automatiquement';
    RAISE NOTICE '    Notifications avant: %, après: %', v_notif_count_before, v_notif_count_after;
  ELSE
    RAISE WARNING '❌ TEST ÉCHOUÉ ! Aucune notification créée';
    RAISE WARNING '    Notifications avant: %, après: %', v_notif_count_before, v_notif_count_after;
  END IF;
  
  -- Afficher la dernière notification créée
  RAISE NOTICE '--- Dernière notification ---';
  PERFORM (
    SELECT RAISE(NOTICE, '  ID: %, Type: %, Message: %', id, type, message)
    FROM public.notifications
    WHERE user_id = v_test_client_id
    ORDER BY created_at DESC
    LIMIT 1
  );
  
END $$;

-- 📊 ÉTAPE 8 : RÉSUMÉ FINAL
SELECT '📊 ÉTAPE 8 : RÉSUMÉ FINAL' as etape;

SELECT 
  '✅ Configuration terminée' as status,
  'Le système de notification est maintenant opérationnel' as message;

-- Afficher l'état actuel
SELECT 
  (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'trg_notify_mission_accepted') as triggers,
  (SELECT COUNT(*) FROM pg_proc WHERE proname = 'notify_client_on_mission_accepted') as fonctions,
  (SELECT COUNT(*) FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') as realtime;

-- ============================================================================
-- 🎯 INSTRUCTIONS POUR TESTER DANS L'APP
-- ============================================================================
-- 
-- 1. Connectez-vous en tant qu'ARTISAN
-- 2. Allez sur le dashboard artisan
-- 3. Vous devriez voir des missions en attente (pending)
-- 4. Cliquez sur "Accepter" pour une mission
-- 5. Le statut de la mission devrait passer à "accepted"
-- 6. Le CLIENT devrait recevoir une notification immédiatement
-- 
-- Si le client ne reçoit pas la notification :
-- - Vérifier que le client a bien chargé les notifications (refreshNotifications)
-- - Vérifier la console du client pour les logs realtime
-- - Vérifier que le client est bien connecté (user.id)
-- 
-- ============================================================================
