-- ========================================
-- FIX POUR LES ERREURS RÉSEAU SUPABASE
-- ========================================
-- Ce script vérifie et corrige les problèmes potentiels côté base de données
-- qui pourraient causer des erreurs réseau

-- 1. Vérifier que les tables existent
DO $$
BEGIN
    -- Vérifier les tables principales
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        RAISE NOTICE 'Table users manquante - création nécessaire';
    ELSE
        RAISE NOTICE '✓ Table users existe';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'artisans') THEN
        RAISE NOTICE 'Table artisans manquante - création nécessaire';
    ELSE
        RAISE NOTICE '✓ Table artisans existe';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'clients') THEN
        RAISE NOTICE 'Table clients manquante - création nécessaire';
    ELSE
        RAISE NOTICE '✓ Table clients existe';
    END IF;
END $$;

-- 2. Vérifier les politiques RLS (Row Level Security)
-- Les politiques RLS mal configurées peuvent bloquer les requêtes

-- Désactiver temporairement RLS pour les tests
-- ⚠️ À NE PAS UTILISER EN PRODUCTION - uniquement pour diagnostic
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE artisans DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- 3. Vérifier que les index existent pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_artisans_category ON artisans(category);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_missions_client_id ON missions(client_id);
CREATE INDEX IF NOT EXISTS idx_missions_artisan_id ON missions(artisan_id);

-- 4. Nettoyer les sessions invalides (si la table existe)
-- Cette opération pourrait aider à résoudre les problèmes d'authentification
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'sessions') THEN
        -- Vérifier si la colonne expires_at existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'auth' AND table_name = 'sessions' AND column_name = 'expires_at'
        ) THEN
            DELETE FROM auth.sessions WHERE expires_at < NOW();
            RAISE NOTICE '✓ Sessions expirées nettoyées';
        ELSE
            RAISE NOTICE '✓ Table sessions existe mais colonne expires_at introuvable';
        END IF;
    ELSE
        RAISE NOTICE '✓ Table auth.sessions non disponible (normal sur certaines configurations)';
    END IF;
END $;

-- 5. Statistiques de la base de données
SELECT 
    tablename AS "Table",
    n_live_tup AS "Lignes",
    n_dead_tup AS "Lignes mortes",
    last_autovacuum AS "Dernier vacuum"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 6. Vérifier les contraintes de clés étrangères
SELECT
    tc.table_name AS "Table",
    kcu.column_name AS "Colonne",
    ccu.table_name AS "Référence",
    ccu.column_name AS "Colonne référencée"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ========================================
-- GUIDE DE DIAGNOSTIC
-- ========================================
/*

Si vous voyez toujours des erreurs "Network request failed", vérifiez:

1. **Configuration Supabase (Dashboard)**:
   - Allez dans Settings > API
   - Vérifiez que l'URL du projet est correcte
   - Vérifiez que la clé "anon" (public) est correcte
   - Vérifiez que la clé n'a pas expiré

2. **Configuration CORS**:
   - Allez dans Settings > API > CORS
   - Ajoutez votre domaine si nécessaire (pour le web)
   - Pour le développement local, ajoutez: http://localhost:*

3. **Politiques RLS**:
   - Les politiques RLS peuvent bloquer les requêtes
   - Vérifiez dans Authentication > Policies
   - Pour les tests, vous pouvez temporairement désactiver RLS:
     ALTER TABLE users DISABLE ROW LEVEL SECURITY;

4. **Quotas et limites**:
   - Vérifiez dans Settings > Usage
   - Assurez-vous de ne pas avoir atteint les limites de votre plan

5. **Status du service**:
   - Vérifiez sur https://status.supabase.com/
   - Assurez-vous que le service est opérationnel

6. **Variables d'environnement**:
   - Vérifiez que EXPO_PUBLIC_SUPABASE_URL est correct
   - Vérifiez que EXPO_PUBLIC_SUPABASE_ANON_KEY est correct
   - Redémarrez l'application après modification

7. **Réseau local**:
   - Si sur mobile, vérifiez que vous êtes sur le même réseau WiFi
   - Désactivez/réactivez le WiFi
   - Essayez avec les données mobiles

8. **Cache**:
   - Videz le cache de l'application
   - Redémarrez le serveur de développement Expo

*/

-- ========================================
-- COMMANDES UTILES POUR LE DIAGNOSTIC
-- ========================================
/*

-- Compter le nombre d'utilisateurs par type
SELECT user_type, COUNT(*) as count 
FROM users 
GROUP BY user_type;

-- Voir les utilisateurs récents
SELECT id, email, user_type, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- Vérifier les artisans
SELECT u.email, a.category, a.is_available 
FROM users u
JOIN artisans a ON u.id = a.id
LIMIT 10;

-- Vérifier les missions
SELECT id, client_id, status, created_at
FROM missions
ORDER BY created_at DESC
LIMIT 10;

*/
