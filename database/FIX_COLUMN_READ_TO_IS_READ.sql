-- ============================================================================
-- FIX RAPIDE : Corriger la colonne 'read' → 'is_read' dans notifications
-- ============================================================================
-- Ce script corrige l'erreur : column "read" does not exist
-- ============================================================================

-- ÉTAPE 1 : Supprimer toutes les anciennes fonctions
DROP FUNCTION IF EXISTS public.notify_mission_accepted() CASCADE;
DROP FUNCTION IF EXISTS public.notify_client_on_mission_accepted() CASCADE;

-- ÉTAPE 2 : Vérifier/créer la colonne is_read
DO $$
BEGIN
  -- Ajouter is_read si elle n'existe pas
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
  
  -- Migrer les données de 'read' vers 'is_read' si la colonne 'read' existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'read'
  ) THEN
    UPDATE public.notifications SET is_read = read WHERE is_read IS NULL;
    RAISE NOTICE '✅ Migration read → is_read effectuée';
  END IF;
END $$;

-- ÉTAPE 3 : Créer la fonction trigger avec la bonne colonne
CREATE OR REPLACE FUNCTION public.notify_client_mission_accepted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_id uuid;
  v_mission_title text;
  v_artisan_name text;
  v_notification_id uuid;
BEGIN
  -- Vérifier que c'est un changement vers 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    
    -- Récupérer les informations
    SELECT 
      m.client_id, 
      m.title, 
      COALESCE(u.name, 'Un artisan')
    INTO 
      v_client_id, 
      v_mission_title, 
      v_artisan_name
    FROM public.missions m
    LEFT JOIN public.users u ON m.artisan_id = u.id
    WHERE m.id = NEW.id;
    
    -- Sécurité
    IF v_client_id IS NULL THEN
      RAISE WARNING '[notify_client_mission_accepted] client_id NULL pour mission %', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Insérer la notification avec is_read (pas read)
    BEGIN
      INSERT INTO public.notifications (
        id,
        user_id,
        type,
        title,
        message,
        mission_id,
        is_read,
        created_at
      ) VALUES (
        gen_random_uuid(),
        v_client_id,
        'mission_accepted',
        'Mission acceptée !',
        v_artisan_name || ' arrive bientôt pour "' || COALESCE(v_mission_title, 'votre mission') || '"',
        NEW.id,
        false,
        NOW()
      ) RETURNING id INTO v_notification_id;
      
      RAISE NOTICE '[notify_client_mission_accepted] ✅ Notification créée (ID: %) pour client % (mission %)', 
        v_notification_id, v_client_id, NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[notify_client_mission_accepted] ❌ Erreur insertion notification: %', SQLERRM;
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- ÉTAPE 4 : Supprimer tous les anciens triggers
DROP TRIGGER IF EXISTS trg_notify_mission_accepted ON public.missions;
DROP TRIGGER IF EXISTS notify_client_on_mission_accepted ON public.missions;
DROP TRIGGER IF EXISTS trg_notify_client_mission_accepted ON public.missions;

-- ÉTAPE 5 : Créer le nouveau trigger
CREATE TRIGGER trg_notify_client_mission_accepted
  AFTER UPDATE ON public.missions
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted'))
  EXECUTE FUNCTION public.notify_client_mission_accepted();

-- ÉTAPE 6 : Vérifications
DO $$
DECLARE
  trigger_exists boolean;
  function_exists boolean;
  col_is_read boolean;
BEGIN
  -- Vérifier le trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_notify_client_mission_accepted'
  ) INTO trigger_exists;
  
  -- Vérifier la fonction
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'notify_client_mission_accepted'
  ) INTO function_exists;
  
  -- Vérifier la colonne is_read
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'is_read'
  ) INTO col_is_read;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ VÉRIFICATIONS';
  RAISE NOTICE '========================================';
  
  IF trigger_exists THEN
    RAISE NOTICE '✅ Trigger actif';
  ELSE
    RAISE WARNING '❌ Trigger MANQUANT';
  END IF;
  
  IF function_exists THEN
    RAISE NOTICE '✅ Fonction créée';
  ELSE
    RAISE WARNING '❌ Fonction MANQUANTE';
  END IF;
  
  IF col_is_read THEN
    RAISE NOTICE '✅ Colonne is_read présente';
  ELSE
    RAISE WARNING '❌ Colonne is_read MANQUANTE';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅✅✅ CORRECTION TERMINÉE';
  RAISE NOTICE '';
  RAISE NOTICE '📋 TEST À FAIRE :';
  RAISE NOTICE '1. Acceptez une mission comme artisan';
  RAISE NOTICE '2. Le client doit recevoir la notification';
  RAISE NOTICE '';
END $$;
