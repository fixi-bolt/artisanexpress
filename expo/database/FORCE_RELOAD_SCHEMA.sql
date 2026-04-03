-- ========================================
-- 🔄 FORCER LE RECHARGEMENT DU CACHE SUPABASE
-- ========================================

-- Cette commande force PostgreSQL et PostgREST à recharger leur cache du schéma
-- Exécutez ces commandes dans l'ordre dans l'éditeur SQL de Supabase

-- Étape 1: Notifier PostgREST de recharger le cache
NOTIFY pgrst, 'reload schema';

-- Étape 2: Actualiser les vues matérialisées (si elles existent)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT schemaname, matviewname 
             FROM pg_matviews 
             WHERE schemaname = 'public'
    LOOP
        EXECUTE 'REFRESH MATERIALIZED VIEW ' || quote_ident(r.schemaname) || '.' || quote_ident(r.matviewname);
    END LOOP;
END$$;

-- Étape 3: Invalider le cache des plans de requêtes
DISCARD PLANS;

-- Étape 4: Vérifier que les colonnes existent bien
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'users'
ORDER BY 
    ordinal_position;

-- ========================================
-- 🔧 SI LE PROBLÈME PERSISTE
-- ========================================
-- Parfois, le cache du navigateur ou de l'application Supabase peut causer des problèmes
-- Dans ce cas:
-- 1. Allez dans l'interface Supabase
-- 2. Project Settings > API
-- 3. Cliquez sur "Restart" pour redémarrer le service PostgREST
-- 4. Attendez 30 secondes
-- 5. Réessayez votre application

-- ========================================
-- ✅ VÉRIFICATION FINALE
-- ========================================
-- Cette requête doit retourner TRUE pour tous les champs importants
SELECT 
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') AS has_name_column,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'photo') AS has_photo_column,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') AS has_phone_column,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') AS has_email_column,
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_type') AS has_user_type_column;
