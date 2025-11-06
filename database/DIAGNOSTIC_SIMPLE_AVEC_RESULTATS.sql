-- ===================================================================
-- 🔍 DIAGNOSTIC + CORRECTION AUTOMATIQUE
-- Copier-coller ce script dans Supabase SQL Editor
-- ===================================================================

-- 1️⃣ Vérifier si la fonction existe
SELECT '1️⃣ VÉRIFICATION FONCTION' as section;

SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Fonction notify_mission_accepted existe'
    ELSE '❌ Fonction notify_mission_accepted manquante'
  END as fonction_status
FROM pg_proc
WHERE proname = 'notify_mission_accepted';

-- 2️⃣ Vérifier si le trigger existe
SELECT '2️⃣ VÉRIFICATION TRIGGER' as section;

SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Trigger trigger_mission_accepted existe'
    ELSE '❌ Trigger trigger_mission_accepted manquant'
  END as trigger_status
FROM pg_trigger
WHERE tgname = 'trigger_mission_accepted';

-- ===================================================================
-- 🛠️ CORRECTION AUTOMATIQUE
-- ===================================================================

-- 3️⃣ Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_mission_accepted ON public.missions;

-- 4️⃣ Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS public.notify_mission_accepted() CASCADE;

-- 5️⃣ Créer la fonction pour notifier le client
CREATE OR REPLACE FUNCTION public.notify_mission_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que le statut passe à 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    -- Insérer une notification pour le client
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      mission_id,
      is_read,
      created_at
    ) VALUES (
      NEW.client_id,
      'mission_accepted',
      'Mission acceptée',
      'Un artisan a accepté votre demande et arrive bientôt !',
      NEW.id,
      false,
      NOW()
    );
    
    RAISE NOTICE '✅ Notification créée pour le client %', NEW.client_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6️⃣ Créer le trigger
CREATE TRIGGER trigger_mission_accepted
  AFTER UPDATE ON public.missions
  FOR EACH ROW
  WHEN (NEW.status = 'accepted')
  EXECUTE FUNCTION public.notify_mission_accepted();

-- ===================================================================
-- ✅ VÉRIFICATION FINALE
-- ===================================================================

SELECT '🎯 VÉRIFICATION FINALE' as section;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_mission_accepted') 
    THEN '✅' ELSE '❌' 
  END as fonction,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_mission_accepted') 
    THEN '✅' ELSE '❌' 
  END as trigger,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'notifications'
    ) THEN '✅' ELSE '❌' 
  END as realtime_notifications,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'missions'
    ) THEN '✅' ELSE '❌' 
  END as realtime_missions;

-- ===================================================================
-- 🧪 TEST MANUEL (optionnel)
-- ===================================================================

SELECT '🧪 POUR TESTER' as section;
SELECT 'Vous pouvez maintenant tester en acceptant une mission dans l''app' as instruction;
SELECT 'La notification devrait apparaître instantanément côté client' as expected;
