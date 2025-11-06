-- ============================================================================
-- FIX: Correction de la publication Realtime (syntaxe corrigée)
-- ============================================================================

-- ÉTAPE 1: Retirer notifications de la publication (si elle y est)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
  END IF;
END $$;

-- ÉTAPE 2: Retirer missions de la publication (si elle y est)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'missions'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.missions;
  END IF;
END $$;

-- ÉTAPE 3: Ajouter les tables avec les bonnes configurations
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.missions;

-- ÉTAPE 4: Activer la réplication sur les colonnes importantes
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.missions REPLICA IDENTITY FULL;

-- ÉTAPE 5: Vérification finale
DO $$
DECLARE
  notifications_in_pub boolean;
  missions_in_pub boolean;
  r record;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) INTO notifications_in_pub;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'missions'
  ) INTO missions_in_pub;
  
  IF notifications_in_pub AND missions_in_pub THEN
    RAISE NOTICE 'Configuration Realtime OK';
  END IF;
  
  FOR r IN (
    SELECT schemaname, tablename 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime'
    ORDER BY tablename
  ) LOOP
    RAISE NOTICE 'Table active: %.%', r.schemaname, r.tablename;
  END LOOP;
END $$;
