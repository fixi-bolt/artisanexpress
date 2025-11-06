-- ============================================================================
-- FIX: Le client ne voit pas quand l'artisan accepte la mission
-- ============================================================================

-- ÉTAPE 1: Supprimer et recréer le trigger avec is_read (pas "read")
DROP TRIGGER IF EXISTS trg_notify_mission_accepted ON public.missions;
DROP FUNCTION IF EXISTS public.notify_client_on_mission_accepted();

CREATE OR REPLACE FUNCTION public.notify_client_on_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_client_id uuid;
  v_mission_title text;
  v_artisan_name text;
BEGIN
  -- Trigger uniquement quand status passe à 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    -- Récupère les infos
    SELECT m.client_id, m.title, u.name
    INTO v_client_id, v_mission_title, v_artisan_name
    FROM public.missions m
    LEFT JOIN public.users u ON m.artisan_id = u.id
    WHERE m.id = NEW.id;
    
    -- Vérification sécurité
    IF v_client_id IS NULL THEN
      RAISE NOTICE '[TRIGGER] client_id NULL pour mission %', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Insertion de la notification avec is_read (PAS read)
    BEGIN
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
        'Mission acceptée !',
        COALESCE(v_artisan_name, 'Un artisan') || ' arrive bientôt pour "' || COALESCE(v_mission_title, 'votre mission') || '"',
        NEW.id,
        false,
        NOW()
      );
      
      RAISE NOTICE '[TRIGGER] ✅ Notification créée pour client % (mission %)', v_client_id, NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[TRIGGER] ❌ Erreur insertion notification: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
CREATE TRIGGER trg_notify_mission_accepted
  AFTER UPDATE ON public.missions
  FOR EACH ROW
  WHEN (NEW.status = 'accepted')
  EXECUTE FUNCTION public.notify_client_on_mission_accepted();

-- ÉTAPE 2: Vérifier que is_read existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'is_read'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN is_read boolean DEFAULT false;
    RAISE NOTICE '✅ Colonne is_read ajoutée';
  ELSE
    RAISE NOTICE '✅ Colonne is_read existe déjà';
  END IF;
END $$;

-- ÉTAPE 3: Supprimer l'ancienne colonne "read" si elle existe encore
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'read'
  ) THEN
    -- Migrer les données d'abord
    UPDATE public.notifications SET is_read = read WHERE is_read IS NULL OR is_read = false;
    
    -- Supprimer la colonne
    ALTER TABLE public.notifications DROP COLUMN IF EXISTS read;
    RAISE NOTICE '✅ Ancienne colonne "read" supprimée après migration';
  END IF;
END $$;

-- ÉTAPE 4: Test rapide
DO $$
BEGIN
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '✅ Script exécuté avec succès !';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'Pour tester:';
  RAISE NOTICE '1. Un artisan accepte une mission';
  RAISE NOTICE '2. Vérifier avec:';
  RAISE NOTICE '   SELECT * FROM notifications WHERE type = ''mission_accepted'' ORDER BY created_at DESC LIMIT 5;';
  RAISE NOTICE '════════════════════════════════════════';
END $$;
