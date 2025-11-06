-- ============================================================================
-- FIX: Correction de la publication Realtime (syntaxe correcte)
-- ============================================================================

-- ÉTAPE 1: Retirer notifications de la publication (si elle y est)
DO $$
BEGIN
  -- Vérifier si notifications est dans la publication
  IF EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    -- Retirer la table de la publication
    ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
    RAISE NOTICE '✅ Table notifications retirée de supabase_realtime';
  ELSE
    RAISE NOTICE 'ℹ️ Table notifications pas dans supabase_realtime';
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
    RAISE NOTICE '✅ Table missions retirée de supabase_realtime';
  ELSE
    RAISE NOTICE 'ℹ️ Table missions pas dans supabase_realtime';
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
BEGIN
  -- Vérifier les tables dans la publication
  SELECT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) INTO notifications_in_pub;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'missions'
  ) INTO missions_in_pub;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '📊 VÉRIFICATION REALTIME';
  RAISE NOTICE '════════════════════════════════════════';
  
  IF notifications_in_pub THEN
    RAISE NOTICE '✅ notifications dans supabase_realtime';
  ELSE
    RAISE WARNING '❌ notifications MANQUANTE';
  END IF;
  
  IF missions_in_pub THEN
    RAISE NOTICE '✅ missions dans supabase_realtime';
  ELSE
    RAISE WARNING '❌ missions MANQUANTE';
  END IF;
  
  RAISE NOTICE '════════════════════════════════════════';
  
  -- Afficher toutes les tables dans la publication
  RAISE NOTICE '';
  RAISE NOTICE 'Tables dans supabase_realtime :';
  FOR r IN (
    SELECT schemaname, tablename 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime'
    ORDER BY tablename
  ) LOOP
    RAISE NOTICE '  - %.%', r.schemaname, r.tablename;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Configuration Realtime terminée !';
END $$;
