-- ========================================
-- 🔧 CORRECTION DES RÔLES CLIENT / ARTISAN
-- ========================================
-- Ce script corrige le problème où tous les utilisateurs
-- voient la même interface au lieu d'avoir Client vs Artisan
-- ========================================

-- ÉTAPE 1 : Diagnostic - Voir l'état actuel
-- Copiez et exécutez cette partie d'abord pour voir le problème

SELECT 
  u.id,
  u.email,
  u.name,
  u.user_type as "Type actuel",
  CASE 
    WHEN EXISTS (SELECT 1 FROM artisans WHERE id = u.id) THEN '✅ Artisan'
    WHEN EXISTS (SELECT 1 FROM clients WHERE id = u.id) THEN '✅ Client'
    WHEN EXISTS (SELECT 1 FROM admins WHERE id = u.id) THEN '✅ Admin'
    ELSE '❌ Aucun profil'
  END as "Profil détecté",
  CASE 
    WHEN u.user_type IS NULL THEN '❌ NULL'
    WHEN u.user_type = '' THEN '❌ Vide'
    WHEN EXISTS (SELECT 1 FROM artisans WHERE id = u.id) AND u.user_type != 'artisan' THEN '⚠️ Incohérent'
    WHEN EXISTS (SELECT 1 FROM clients WHERE id = u.id) AND u.user_type != 'client' THEN '⚠️ Incohérent'
    ELSE '✅ OK'
  END as "Statut"
FROM users u
ORDER BY u.created_at DESC;


-- ========================================
-- ÉTAPE 2 : Correction automatique
-- Exécutez cette partie pour corriger tous les user_type
-- ========================================

UPDATE users u
SET user_type = CASE
  WHEN EXISTS (SELECT 1 FROM artisans WHERE id = u.id) THEN 'artisan'
  WHEN EXISTS (SELECT 1 FROM clients WHERE id = u.id) THEN 'client'
  WHEN EXISTS (SELECT 1 FROM admins WHERE id = u.id) THEN 'admin'
  ELSE u.user_type
END
WHERE u.user_type IS NULL 
   OR u.user_type = ''
   OR (
     EXISTS (SELECT 1 FROM artisans WHERE id = u.id) AND u.user_type != 'artisan'
   )
   OR (
     EXISTS (SELECT 1 FROM clients WHERE id = u.id) AND u.user_type != 'client'
   )
   OR (
     EXISTS (SELECT 1 FROM admins WHERE id = u.id) AND u.user_type != 'admin'
   );


-- ========================================
-- ÉTAPE 3 : Vérification
-- Exécutez cette partie pour confirmer que tout est OK
-- ========================================

SELECT 
  '🎉 Résultats de la correction' as "Message",
  COUNT(*) as "Nombre total d'utilisateurs",
  COUNT(*) FILTER (WHERE user_type = 'client') as "Clients",
  COUNT(*) FILTER (WHERE user_type = 'artisan') as "Artisans",
  COUNT(*) FILTER (WHERE user_type = 'admin') as "Admins",
  COUNT(*) FILTER (WHERE user_type IS NULL OR user_type = '') as "⚠️ Sans type"
FROM users;

-- Afficher le détail avec icônes
SELECT 
  email,
  name,
  user_type,
  CASE user_type
    WHEN 'client' THEN '👤 Client'
    WHEN 'artisan' THEN '👨‍🔧 Artisan'
    WHEN 'admin' THEN '👨‍💼 Admin'
    ELSE '❌ Non défini'
  END as "Rôle"
FROM users
ORDER BY created_at DESC;


-- ========================================
-- OPTIONNEL : Créer des profils manquants
-- Si vous avez des utilisateurs dans auth.users mais pas dans users
-- ========================================

-- Créer les profils manquants depuis auth.users
INSERT INTO users (id, email, name, user_type)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
  COALESCE(au.raw_user_meta_data->>'user_type', 'client') as user_type
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = au.id)
ON CONFLICT (id) DO NOTHING;

-- Créer les profils clients manquants
INSERT INTO clients (id)
SELECT id FROM users WHERE user_type = 'client'
AND NOT EXISTS (SELECT 1 FROM clients WHERE clients.id = users.id)
ON CONFLICT (id) DO NOTHING;

-- Créer les profils artisans manquants avec valeurs par défaut
INSERT INTO artisans (id, category, hourly_rate, travel_fee, intervention_radius, is_available)
SELECT 
  id, 
  'plumber' as category,
  50.00 as hourly_rate,
  25.00 as travel_fee,
  20 as intervention_radius,
  true as is_available
FROM users 
WHERE user_type = 'artisan'
AND NOT EXISTS (SELECT 1 FROM artisans WHERE artisans.id = users.id)
ON CONFLICT (id) DO NOTHING;

-- Créer les wallets pour les artisans
INSERT INTO wallets (artisan_id, balance, pending_balance, total_earnings, total_withdrawals, currency)
SELECT 
  id,
  0 as balance,
  0 as pending_balance,
  0 as total_earnings,
  0 as total_withdrawals,
  'EUR' as currency
FROM artisans
WHERE NOT EXISTS (SELECT 1 FROM wallets WHERE wallets.artisan_id = artisans.id)
ON CONFLICT (artisan_id) DO NOTHING;


-- ========================================
-- ÉTAPE FINALE : Vérification complète
-- ========================================

SELECT 
  '✅ Correction terminée' as "Statut",
  'Tous les utilisateurs ont maintenant un rôle correct' as "Message";

-- Afficher un résumé final
SELECT 
  u.email,
  u.user_type as "Type",
  CASE 
    WHEN EXISTS (SELECT 1 FROM clients WHERE id = u.id) THEN '✅'
    ELSE '❌'
  END as "Client?",
  CASE 
    WHEN EXISTS (SELECT 1 FROM artisans WHERE id = u.id) THEN '✅'
    ELSE '❌'
  END as "Artisan?",
  CASE 
    WHEN EXISTS (SELECT 1 FROM wallets WHERE artisan_id = u.id) THEN '✅'
    ELSE '-'
  END as "Wallet?"
FROM users u
ORDER BY u.created_at DESC;


-- ========================================
-- AIDE : Forcer un utilisateur spécifique
-- ========================================
-- Si vous voulez forcer un utilisateur à être Client :
/*
UPDATE users SET user_type = 'client' WHERE email = 'votre@email.com';
INSERT INTO clients (id) 
SELECT id FROM users WHERE email = 'votre@email.com'
ON CONFLICT (id) DO NOTHING;
*/

-- Si vous voulez forcer un utilisateur à être Artisan :
/*
UPDATE users SET user_type = 'artisan' WHERE email = 'artisan@email.com';
INSERT INTO artisans (id, category, hourly_rate, travel_fee, intervention_radius, is_available)
SELECT id, 'plumber', 50.00, 25.00, 20, true
FROM users WHERE email = 'artisan@email.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO wallets (artisan_id, balance, pending_balance, total_earnings, total_withdrawals, currency)
SELECT id, 0, 0, 0, 0, 'EUR'
FROM users WHERE email = 'artisan@email.com'
ON CONFLICT (artisan_id) DO NOTHING;
*/
