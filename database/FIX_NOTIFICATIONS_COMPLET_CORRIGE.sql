-- ============================================================================
-- SCRIPT COMPLET : Correction des notifications mission acceptée
-- ============================================================================
-- Ce script :
-- 1. Crée la table push_tokens (si manquante)
-- 2. Ajoute/corrige la colonne is_read dans notifications
-- 3. Crée un trigger SQL qui insère automatiquement une notification
--    quand un artisan accepte une mission
-- 4. Configure les bonnes policies RLS
-- ============================================================================

-- =============================================================================
-- ÉTAPE 1 : Créer la table push_tokens
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text CHECK (platform IN ('ios', 'android', 'web')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Index pour recherche rapide par user_id
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);

-- RLS pour push_tokens
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own push tokens" ON public.push_tokens;
CREATE POLICY "Users can read own push tokens" ON public.push_tokens
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own push tokens" ON public.push_tokens;
CREATE POLICY "Users can insert own push tokens" ON public.push_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own push tokens" ON public.push_tokens;
CREATE POLICY "Users can update own push tokens" ON public.push_tokens
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own push tokens" ON public.push_tokens;
CREATE POLICY "Users can delete own push tokens" ON public.push_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- ÉTAPE 2 : Ajouter la colonne is_read si elle n'existe pas
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'is_read'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN is_read boolean DEFAULT false;
    RAISE NOTICE 'Colonne is_read ajoutée à notifications';
  END IF;
END $$;

-- Mise à jour des anciennes notifications (si la colonne 'read' existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'read'
  ) THEN
    UPDATE public.notifications SET is_read = read WHERE is_read IS NULL;
    RAISE NOTICE 'Migration read → is_read effectuée';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 3 : Fonction trigger pour créer notification automatiquement
-- =============================================================================

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
    
    -- Insertion de la notification
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

-- =============================================================================
-- ÉTAPE 4 : Créer/recréer le trigger
-- =============================================================================

DROP TRIGGER IF EXISTS trg_notify_mission_accepted ON public.missions;

CREATE TRIGGER trg_notify_mission_accepted
  AFTER UPDATE ON public.missions
  FOR EACH ROW
  WHEN (NEW.status = 'accepted')
  EXECUTE FUNCTION public.notify_client_on_mission_accepted();

-- =============================================================================
-- ÉTAPE 5 : Vérifications et diagnostics
-- =============================================================================

-- Vérifier que le trigger existe
DO $$
DECLARE
  trigger_exists boolean;
  notif_count integer;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_notify_mission_accepted'
  ) INTO trigger_exists;
  
  IF trigger_exists THEN
    RAISE NOTICE '✅ Trigger trg_notify_mission_accepted existe';
  ELSE
    RAISE WARNING '❌ Trigger trg_notify_mission_accepted MANQUANT';
  END IF;
  
  -- Compter les notifications
  SELECT COUNT(*) INTO notif_count FROM public.notifications;
  RAISE NOTICE '📊 Nombre total de notifications: %', notif_count;
  
  RAISE NOTICE '✅✅✅ Script exécuté avec succès !';
  RAISE NOTICE 'Prochaines étapes :';
  RAISE NOTICE '1. Accepter une mission depuis l''app artisan';
  RAISE NOTICE '2. Vérifier que la notification apparaît avec :';
  RAISE NOTICE '   SELECT * FROM notifications WHERE type = ''mission_accepted'' ORDER BY created_at DESC LIMIT 1;';
END $$;
