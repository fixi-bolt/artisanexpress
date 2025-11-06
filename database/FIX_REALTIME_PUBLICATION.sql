-- ============================================================================
-- FIX: Erreur "relation is already member of publication"
-- ============================================================================

-- ÉTAPE 1: Retirer les tables de la publication (si elles existent déjà)
DO $$
BEGIN
  -- Retirer notifications
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.notifications;
    RAISE NOTICE '✅ Table notifications retirée de supabase_realtime';
  ELSE
    RAISE NOTICE '⚠️  Table notifications pas dans la publication';
  END IF;

  -- Retirer missions
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'missions'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.missions;
    RAISE NOTICE '✅ Table missions retirée de supabase_realtime';
  ELSE
    RAISE NOTICE '⚠️  Table missions pas dans la publication';
  END IF;
END $$;

-- ÉTAPE 2: Réactiver la réplication pour les deux tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.missions;

-- ÉTAPE 3: Activer Row Level Security si nécessaire
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 4: S'assurer que REPLICA IDENTITY est configurée
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.missions REPLICA IDENTITY FULL;

-- ÉTAPE 5: Vérification finale
DO $$
DECLARE
  notifications_in_pub boolean;
  missions_in_pub boolean;
BEGIN
  -- Vérifier notifications
  SELECT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) INTO notifications_in_pub;

  -- Vérifier missions
  SELECT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'missions'
  ) INTO missions_in_pub;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '📊 ÉTAT DE LA PUBLICATION REALTIME';
  RAISE NOTICE '════════════════════════════════════════';
  
  IF notifications_in_pub THEN
    RAISE NOTICE '✅ notifications → supabase_realtime';
  ELSE
    RAISE WARNING '❌ notifications MANQUANTE dans supabase_realtime';
  END IF;

  IF missions_in_pub THEN
    RAISE NOTICE '✅ missions → supabase_realtime';
  ELSE
    RAISE WARNING '❌ missions MANQUANTE dans supabase_realtime';
  END IF;

  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

RAISE NOTICE '✅ Configuration Realtime corrigée !';
RAISE NOTICE '🔄 Redémarrez votre application pour prendre en compte les changements';
