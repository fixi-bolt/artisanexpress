-- =============================================
-- FIX REALTIME CHANNEL ERROR - SOLUTION COMPLÈTE
-- =============================================
-- Ce script corrige l'erreur "Realtime channel error!"
-- en configurant correctement les publications
-- =============================================

-- Étape 1 : Vérifier que les tables existent
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        RAISE EXCEPTION 'La table notifications n''existe pas!';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'missions') THEN
        RAISE EXCEPTION 'La table missions n''existe pas!';
    END IF;
    
    RAISE NOTICE '✅ Tables vérifiées';
END $$;

-- Étape 2 : Retirer les tables de la publication (ignorer les erreurs)
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.notifications;
    RAISE NOTICE '✅ notifications retirée de la publication';
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'ℹ️ notifications n''était pas dans la publication';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Erreur en retirant notifications: %', SQLERRM;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.missions;
    RAISE NOTICE '✅ missions retirée de la publication';
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'ℹ️ missions n''était pas dans la publication';
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Erreur en retirant missions: %', SQLERRM;
END $$;

-- Étape 3 : Configurer REPLICA IDENTITY pour le realtime
DO $$
BEGIN
    ALTER TABLE public.notifications REPLICA IDENTITY FULL;
    ALTER TABLE public.missions REPLICA IDENTITY FULL;
    RAISE NOTICE '✅ REPLICA IDENTITY configuré';
END $$;

-- Étape 4 : Ajouter les tables à la publication realtime
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.missions;
    RAISE NOTICE '✅ Tables ajoutées à la publication realtime';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'ℹ️ Tables déjà dans la publication';
END $$;

-- Étape 5 : Activer le realtime sur les tables dans l'interface Supabase
-- IMPORTANT: Allez dans Database > Replication et activez realtime pour:
-- ✓ notifications
-- ✓ missions

-- Étape 6 : Vérifier la configuration
SELECT 
    schemaname,
    tablename,
    'ℹ️ Configuré pour realtime' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('notifications', 'missions')
ORDER BY tablename;

-- =============================================
-- RÉSULTAT ATTENDU
-- =============================================
-- Vous devriez voir 2 lignes :
-- public | missions      | ℹ️ Configuré pour realtime
-- public | notifications | ℹ️ Configuré pour realtime
-- =============================================

-- Vérification supplémentaire
DO $$
DECLARE
    notification_count INTEGER;
    mission_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO notification_count 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications';
    
    SELECT COUNT(*) INTO mission_count 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'missions';
    
    IF notification_count = 0 THEN
        RAISE WARNING '⚠️ notifications n''est PAS dans la publication realtime!';
    ELSE
        RAISE NOTICE '✅ notifications est dans la publication realtime';
    END IF;
    
    IF mission_count = 0 THEN
        RAISE WARNING '⚠️ missions n''est PAS dans la publication realtime!';
    ELSE
        RAISE NOTICE '✅ missions est dans la publication realtime';
    END IF;
END $$;
