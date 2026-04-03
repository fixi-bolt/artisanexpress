-- ============================================
-- FIX REALTIME PUBLICATION - VERSION CORRIGÉE
-- ============================================
-- Ce script corrige la configuration realtime
-- sans utiliser IF EXISTS (non supporté)
-- ============================================

-- Étape 1 : Supprimer les tables de la publication (ignore les erreurs si elles n'y sont pas)
DO $$ 
BEGIN
    -- Supprimer notifications de la publication
    ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
    RAISE NOTICE 'notifications supprimée de la publication';
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'notifications n''était pas dans la publication';
END $$;

DO $$ 
BEGIN
    -- Supprimer missions de la publication
    ALTER PUBLICATION supabase_realtime DROP TABLE public.missions;
    RAISE NOTICE 'missions supprimée de la publication';
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'missions n''était pas dans la publication';
END $$;

-- Étape 2 : Réactiver REPLICA IDENTITY pour les tables
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.missions REPLICA IDENTITY FULL;

-- Étape 3 : Ajouter les tables à la publication realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.missions;

-- Étape 4 : Vérifier la configuration
SELECT 
    schemaname,
    tablename,
    'Configuré pour realtime' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('notifications', 'missions');

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================
-- Vous devriez voir 2 lignes :
-- - public | notifications | Configuré pour realtime
-- - public | missions | Configuré pour realtime
-- ============================================
