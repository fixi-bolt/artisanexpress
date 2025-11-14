-- ============================================
-- FIX REALTIME - SCRIPT SIMPLE ET SÛR
-- ============================================
-- Copiez-collez ce script dans l'éditeur SQL de Supabase
-- ============================================

-- Étape 1 : Supprimer les tables de la publication (sans IF EXISTS)
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
EXCEPTION
    WHEN others THEN
        NULL;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.missions;
EXCEPTION
    WHEN others THEN
        NULL;
END $$;

-- Étape 2 : Configurer REPLICA IDENTITY
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.missions REPLICA IDENTITY FULL;

-- Étape 3 : Ajouter les tables à la publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.missions;

-- Étape 4 : Vérification
SELECT 
    tablename,
    'OK' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('notifications', 'missions');
