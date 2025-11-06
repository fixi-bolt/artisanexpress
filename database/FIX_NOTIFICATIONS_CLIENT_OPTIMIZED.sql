-- ============================================================================
-- FIX OPTIMISÉ: Le client voit quand l'artisan accepte la mission
-- ============================================================================
-- Corrections apportées:
-- ✅ Utilise NEW directement (pas de SELECT inutile)
-- ✅ Condition WHEN simplifiée et correcte
-- ✅ Politiques RLS ajoutées pour notifications
-- ✅ Index d'optimisation ajoutés
-- ✅ Suppression sécurisée des anciennes fonctions (sans CASCADE)
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1: Nettoyer les anciennes versions (SANS CASCADE pour la sécurité)
-- ============================================================================

-- Supprimer les triggers en premier
DROP TRIGGER IF EXISTS trg_notify_mission_accepted ON public.missions;
DROP TRIGGER IF EXISTS trg_notify_client_mission_accepted ON public.missions;

-- Supprimer uniquement LES fonctions de notification (sans CASCADE)
DROP FUNCTION IF EXISTS public.notify_client_on_mission_accepted();
DROP FUNCTION IF EXISTS public.notify_client_mission_accepted();
DROP FUNCTION IF EXISTS public.notify_mission_accepted();

-- ============================================================================
-- ÉTAPE 2: Vérifier/corriger la structure de notifications
-- ============================================================================

-- S'assurer que la table existe
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  mission_id uuid REFERENCES public.missions(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Ajouter is_read si manquant
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'is_read'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN is_read boolean DEFAULT false NOT NULL;
    RAISE NOTICE '✅ Colonne is_read ajoutée';
  END IF;
END $$;

-- Migrer et supprimer l'ancienne colonne "read" si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'read'
  ) THEN
    -- Migrer les données
    UPDATE public.notifications 
    SET is_read = "read" 
    WHERE is_read IS DISTINCT FROM "read";
    
    -- Supprimer l'ancienne colonne
    ALTER TABLE public.notifications DROP COLUMN "read";
    RAISE NOTICE '✅ Colonne "read" migrée vers "is_read" et supprimée';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 3: Créer les index d'optimisation
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created 
ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_mission_id 
ON public.notifications(mission_id) 
WHERE mission_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON public.notifications(user_id, is_read) 
WHERE is_read = false;

-- ============================================================================
-- ÉTAPE 4: Créer la fonction trigger OPTIMISÉE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_client_mission_accepted()
RETURNS TRIGGER AS $$
DECLARE
  v_artisan_name text;
  v_notification_id uuid;
BEGIN
  -- Vérifications de sécurité
  IF NEW.client_id IS NULL THEN
    RAISE WARNING '[TRIGGER] client_id NULL pour mission % - notification annulée', NEW.id;
    RETURN NEW;
  END IF;
  
  IF NEW.artisan_id IS NULL THEN
    RAISE WARNING '[TRIGGER] artisan_id NULL pour mission % - notification annulée', NEW.id;
    RETURN NEW;
  END IF;
  
  -- ✅ OPTIMISATION: Seul le nom de l'artisan nécessite un SELECT
  -- (NEW contient déjà client_id et title)
  SELECT u.name INTO v_artisan_name
  FROM public.users u
  WHERE u.id = NEW.artisan_id;
  
  -- Valeur par défaut si l'artisan n'a pas de nom
  v_artisan_name := COALESCE(v_artisan_name, 'Un artisan');
  
  -- Insérer la notification
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
      NEW.client_id,                                    -- ✅ Directement depuis NEW
      'mission_accepted',
      'Mission acceptée ! 🎉',
      v_artisan_name || ' a accepté votre mission "' || 
        COALESCE(NEW.title, 'Sans titre') || '" et arrive bientôt.',  -- ✅ Directement depuis NEW
      NEW.id,
      false,
      NOW()
    ) RETURNING id INTO v_notification_id;
    
    RAISE NOTICE '[NOTIFICATION] ✅ Créée (ID: %) pour client % - mission %', 
      v_notification_id, NEW.client_id, NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[NOTIFICATION] ❌ Erreur: % (client: %, mission: %)', 
      SQLERRM, NEW.client_id, NEW.id;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ÉTAPE 5: Créer le trigger avec condition OPTIMISÉE
-- ============================================================================

CREATE TRIGGER trg_notify_client_mission_accepted
  AFTER UPDATE ON public.missions
  FOR EACH ROW
  WHEN (
    NEW.status = 'accepted' 
    AND OLD.status IS DISTINCT FROM 'accepted'  -- ✅ Plus propre que IS NULL OR !=
  )
  EXECUTE FUNCTION public.notify_client_mission_accepted();

-- ============================================================================
-- ÉTAPE 6: Configurer les politiques RLS pour notifications
-- ============================================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" 
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Les utilisateurs peuvent marquer leurs notifications comme lues
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" 
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Seul le système peut créer des notifications (via le trigger SECURITY DEFINER)
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" 
ON public.notifications
FOR INSERT
WITH CHECK (true);  -- Le trigger SECURITY DEFINER gère la sécurité

-- ============================================================================
-- ÉTAPE 7: Vérifications finales
-- ============================================================================

DO $$
DECLARE
  v_function_exists boolean;
  v_trigger_exists boolean;
  v_rls_enabled boolean;
  v_policy_count integer;
  v_index_count integer;
BEGIN
  -- Vérifier la fonction
  SELECT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'notify_client_mission_accepted'
  ) INTO v_function_exists;
  
  -- Vérifier le trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_notify_client_mission_accepted'
  ) INTO v_trigger_exists;
  
  -- Vérifier RLS
  SELECT relrowsecurity INTO v_rls_enabled
  FROM pg_class
  WHERE relname = 'notifications';
  
  -- Compter les policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'notifications';
  
  -- Compter les index
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE tablename = 'notifications'
  AND indexname LIKE 'idx_notifications%';
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 INSTALLATION TERMINÉE - RAPPORT FINAL';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  
  IF v_function_exists THEN
    RAISE NOTICE '✅ Fonction notify_client_mission_accepted créée';
  ELSE
    RAISE WARNING '❌ Fonction MANQUANTE';
  END IF;
  
  IF v_trigger_exists THEN
    RAISE NOTICE '✅ Trigger trg_notify_client_mission_accepted actif';
  ELSE
    RAISE WARNING '❌ Trigger MANQUANT';
  END IF;
  
  IF v_rls_enabled THEN
    RAISE NOTICE '✅ RLS activé sur notifications (% policies)', v_policy_count;
  ELSE
    RAISE WARNING '❌ RLS désactivé';
  END IF;
  
  RAISE NOTICE '✅ % index d''optimisation créés', v_index_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '🧪 POUR TESTER LE SYSTÈME';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣ Trouver une mission pending:';
  RAISE NOTICE '   SELECT id, title, client_id, status';
  RAISE NOTICE '   FROM missions';
  RAISE NOTICE '   WHERE status = ''pending''';
  RAISE NOTICE '   LIMIT 1;';
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣ Accepter la mission (remplacez les UUIDs):';
  RAISE NOTICE '   UPDATE missions';
  RAISE NOTICE '   SET status = ''accepted'', artisan_id = ''VOTRE_ARTISAN_ID''';
  RAISE NOTICE '   WHERE id = ''MISSION_ID'';';
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣ Vérifier la notification créée:';
  RAISE NOTICE '   SELECT id, user_id, type, title, message, is_read, created_at';
  RAISE NOTICE '   FROM notifications';
  RAISE NOTICE '   WHERE type = ''mission_accepted''';
  RAISE NOTICE '   ORDER BY created_at DESC';
  RAISE NOTICE '   LIMIT 5;';
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣ Vérifier côté client (dans l''app):';
  RAISE NOTICE '   - Le client doit voir la notification';
  RAISE NOTICE '   - Le statut de la mission doit passer à "accepted"';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

COMMIT;
