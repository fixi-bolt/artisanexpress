-- ============================================
-- FIX REALTIME - SCRIPT CORRIGÉ
-- ============================================
-- Ce script corrige l'erreur de syntaxe SQL
-- et configure correctement le realtime
-- ============================================

-- Étape 1 : Retirer les tables de la publication (gérer les erreurs)
DO $$ 
BEGIN
    -- Retirer notifications
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications';
    RAISE NOTICE '✅ notifications retirée de la publication';
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'ℹ️ notifications n''était pas dans la publication';
    WHEN OTHERS THEN
        RAISE NOTICE 'ℹ️ Erreur ignorée pour notifications: %', SQLERRM;
END $$;

DO $$ 
BEGIN
    -- Retirer missions
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.missions';
    RAISE NOTICE '✅ missions retirée de la publication';
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'ℹ️ missions n''était pas dans la publication';
    WHEN OTHERS THEN
        RAISE NOTICE 'ℹ️ Erreur ignorée pour missions: %', SQLERRM;
END $$;

-- Étape 2 : Configurer REPLICA IDENTITY
DO $$
BEGIN
    ALTER TABLE public.notifications REPLICA IDENTITY FULL;
    ALTER TABLE public.missions REPLICA IDENTITY FULL;
    RAISE NOTICE '✅ REPLICA IDENTITY configuré';
END $$;

-- Étape 3 : Ajouter les tables à la publication
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.missions;
    RAISE NOTICE '✅ Tables ajoutées à la publication realtime';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'ℹ️ Tables déjà dans la publication';
END $$;

-- Étape 4 : Vérification finale
DO $$
DECLARE
    v_notif_count INTEGER;
    v_mission_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '🔍 VÉRIFICATION DE LA CONFIGURATION';
    RAISE NOTICE '═══════════════════════════════════════';
    
    -- Compter les tables dans la publication
    SELECT COUNT(*) INTO v_notif_count
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications';
    
    SELECT COUNT(*) INTO v_mission_count
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'missions';
    
    -- Afficher les résultats
    IF v_notif_count > 0 THEN
        RAISE NOTICE '✓ notifications : ACTIVÉ';
    ELSE
        RAISE NOTICE '✗ notifications : NON ACTIVÉ';
    END IF;
    
    IF v_mission_count > 0 THEN
        RAISE NOTICE '✓ missions : ACTIVÉ';
    ELSE
        RAISE NOTICE '✗ missions : NON ACTIVÉ';
    END IF;
    
    RAISE NOTICE '═══════════════════════════════════════';
    
    IF v_notif_count > 0 AND v_mission_count > 0 THEN
        RAISE NOTICE '✅ REALTIME CONFIGURÉ AVEC SUCCÈS !';
    ELSE
        RAISE NOTICE '⚠️  CONFIGURATION INCOMPLÈTE';
    END IF;
    
    RAISE NOTICE '═══════════════════════════════════════';
    RAISE NOTICE '';
END $$;

-- Afficher les tables configurées
SELECT 
    tablename,
    'OK' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('notifications', 'missions')
ORDER BY tablename;

-- ============================================
-- ✅ FIN DU SCRIPT
-- ============================================
