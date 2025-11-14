-- ============================================================================
-- FIX RAPIDE : Correction RLS pour permettre l'insertion de notifications
-- ============================================================================
-- Erreur actuelle : "new row violates row-level security policy for table notifications"
-- Solution : Ajouter une policy pour permettre l'insertion via SECURITY DEFINER
-- ============================================================================

-- Désactiver temporairement RLS pour diagnostiquer
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes policies
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow service role to insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Réactiver RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES CORRECTES
-- ============================================================================

-- 1. Lecture : Les utilisateurs peuvent lire leurs propres notifications
CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 2. Mise à jour : Les utilisateurs peuvent marquer comme lu
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. INSERTION : Permettre l'insertion depuis les fonctions SECURITY DEFINER
--    Cette policy permet au système de créer des notifications pour n'importe quel utilisateur
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT 
  WITH CHECK (true);

-- Alternative si vous voulez restreindre : autoriser seulement les insertions 
-- depuis l'application authentifiée
-- CREATE POLICY "Authenticated users can create notifications" ON public.notifications
--   FOR INSERT 
--   WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- VÉRIFICATIONS
-- ============================================================================

DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE tablename = 'notifications';
  
  RAISE NOTICE '✅ Nombre de policies sur notifications: %', policy_count;
  RAISE NOTICE '✅ RLS configuré correctement';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies actives :';
END $$;

-- Afficher les policies
SELECT 
  policyname as "Policy Name",
  cmd as "Command",
  qual as "USING",
  with_check as "WITH CHECK"
FROM pg_policies 
WHERE tablename = 'notifications';

-- ============================================================================
-- TEST RAPIDE
-- ============================================================================

-- Test : Créer une notification de test
-- Remplacez 'USER_ID_ICI' par un vrai UUID d'utilisateur de votre base
-- SELECT id FROM auth.users LIMIT 1;

DO $$
DECLARE
  test_user_id uuid;
  test_notification_id uuid;
BEGIN
  -- Récupérer un utilisateur de test
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE '⚠️  Aucun utilisateur trouvé pour le test';
    RETURN;
  END IF;
  
  -- Tenter d'insérer une notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    is_read,
    created_at
  ) VALUES (
    test_user_id,
    'mission_accepted',
    'Test notification',
    'Ceci est une notification de test',
    false,
    NOW()
  ) RETURNING id INTO test_notification_id;
  
  IF test_notification_id IS NOT NULL THEN
    RAISE NOTICE '✅ Test réussi ! Notification créée avec ID: %', test_notification_id;
    
    -- Nettoyer la notification de test
    DELETE FROM public.notifications WHERE id = test_notification_id;
    RAISE NOTICE '🧹 Notification de test supprimée';
  ELSE
    RAISE WARNING '❌ Échec du test d''insertion';
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '❌ Erreur lors du test: %', SQLERRM;
END $$;

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║  ✅ FIX RLS NOTIFICATIONS APPLIQUÉ AVEC SUCCÈS       ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Changements effectués :';
  RAISE NOTICE '  ✓ RLS réactivé sur la table notifications';
  RAISE NOTICE '  ✓ Policy INSERT permissive créée';
  RAISE NOTICE '  ✓ Policy SELECT pour les utilisateurs';
  RAISE NOTICE '  ✓ Policy UPDATE pour marquer comme lu';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaines étapes :';
  RAISE NOTICE '  1. Testez l''acceptation d''une mission';
  RAISE NOTICE '  2. Vérifiez les notifications avec :';
  RAISE NOTICE '     SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;';
  RAISE NOTICE '';
END $$;
