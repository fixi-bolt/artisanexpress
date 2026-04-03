-- ==============================================
-- 🔍 VÉRIFICATION ET CORRECTION DES TYPES UTILISATEURS
-- ==============================================

-- 1️⃣ Vérifier tous les utilisateurs et leurs types
SELECT 
  '📊 UTILISATEURS ACTUELS' AS section,
  u.id,
  u.email,
  u.name,
  u.user_type,
  c.id IS NOT NULL AS has_client_profile,
  a.id IS NOT NULL AS has_artisan_profile,
  ad.id IS NOT NULL AS has_admin_profile
FROM public.users u
LEFT JOIN public.clients c ON u.id = c.id
LEFT JOIN public.artisans a ON u.id = a.id
LEFT JOIN public.admins ad ON u.id = ad.id
ORDER BY u.created_at DESC;

-- 2️⃣ Détecter les incohérences
SELECT 
  '⚠️ INCOHÉRENCES DÉTECTÉES' AS section,
  u.id,
  u.email,
  u.user_type,
  CASE 
    WHEN u.user_type = 'client' AND c.id IS NULL THEN 'Client sans profil client'
    WHEN u.user_type = 'artisan' AND a.id IS NULL THEN 'Artisan sans profil artisan'
    WHEN u.user_type = 'admin' AND ad.id IS NULL THEN 'Admin sans profil admin'
    WHEN u.user_type = 'client' AND a.id IS NOT NULL THEN 'Client avec profil artisan'
    WHEN u.user_type = 'artisan' AND c.id IS NOT NULL THEN 'Artisan avec profil client'
    ELSE 'Autre incohérence'
  END AS probleme
FROM public.users u
LEFT JOIN public.clients c ON u.id = c.id
LEFT JOIN public.artisans a ON u.id = a.id
LEFT JOIN public.admins ad ON u.id = ad.id
WHERE 
  (u.user_type = 'client' AND c.id IS NULL) OR
  (u.user_type = 'artisan' AND a.id IS NULL) OR
  (u.user_type = 'admin' AND ad.id IS NULL) OR
  (u.user_type = 'client' AND a.id IS NOT NULL) OR
  (u.user_type = 'artisan' AND c.id IS NOT NULL);

-- 3️⃣ Corriger automatiquement les profils manquants
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '🔧 Correction des profils manquants...';
  
  -- Créer les profils clients manquants
  FOR rec IN
    SELECT u.id, u.email
    FROM public.users u
    WHERE u.user_type = 'client'
    AND NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.id = u.id)
  LOOP
    RAISE NOTICE '  ➕ Création profil client pour %', rec.email;
    INSERT INTO public.clients (id)
    VALUES (rec.id)
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
  
  -- Créer les profils artisans manquants
  FOR rec IN
    SELECT u.id, u.email
    FROM public.users u
    WHERE u.user_type = 'artisan'
    AND NOT EXISTS (SELECT 1 FROM public.artisans a WHERE a.id = u.id)
  LOOP
    RAISE NOTICE '  ➕ Création profil artisan pour %', rec.email;
    
    INSERT INTO public.artisans (
      id, category, hourly_rate, travel_fee, intervention_radius, is_available
    )
    VALUES (rec.id, 'Non spécifié', 50.00, 25.00, 20, true)
    ON CONFLICT (id) DO NOTHING;
    
    -- Créer le wallet associé
    INSERT INTO public.wallets (artisan_id, balance, pending_balance, total_earnings, total_withdrawals, currency)
    VALUES (rec.id, 0.00, 0.00, 0.00, 0.00, 'EUR')
    ON CONFLICT (artisan_id) DO NOTHING;
  END LOOP;
  
  -- Créer les profils admins manquants
  FOR rec IN
    SELECT u.id, u.email
    FROM public.users u
    WHERE u.user_type = 'admin'
    AND NOT EXISTS (SELECT 1 FROM public.admins ad WHERE ad.id = u.id)
  LOOP
    RAISE NOTICE '  ➕ Création profil admin pour %', rec.email;
    INSERT INTO public.admins (id, role, permissions)
    VALUES (rec.id, 'moderator', '{}')
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
  
  RAISE NOTICE '✅ Correction terminée';
END $$;

-- 4️⃣ Vérifier les métadonnées auth.users vs public.users
SELECT 
  '🔍 VÉRIFICATION AUTH VS PUBLIC' AS section,
  au.id,
  au.email,
  au.raw_user_meta_data->>'user_type' AS auth_user_type,
  pu.user_type AS public_user_type,
  CASE 
    WHEN au.raw_user_meta_data->>'user_type' IS NULL THEN '⚠️ Pas de user_type dans auth'
    WHEN pu.user_type IS NULL THEN '⚠️ Pas dans public.users'
    WHEN au.raw_user_meta_data->>'user_type' != pu.user_type THEN '⚠️ Types différents'
    ELSE '✅ OK'
  END AS statut
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;

-- 5️⃣ Rapport final
SELECT 
  '📊 STATISTIQUES FINALES' AS section,
  (SELECT COUNT(*) FROM auth.users) AS total_auth,
  (SELECT COUNT(*) FROM public.users) AS total_public,
  (SELECT COUNT(*) FROM public.users WHERE user_type = 'client') AS total_clients,
  (SELECT COUNT(*) FROM public.users WHERE user_type = 'artisan') AS total_artisans,
  (SELECT COUNT(*) FROM public.users WHERE user_type = 'admin') AS total_admins,
  (SELECT COUNT(*) FROM public.clients) AS profils_clients,
  (SELECT COUNT(*) FROM public.artisans) AS profils_artisans,
  (SELECT COUNT(*) FROM public.wallets) AS wallets_artisans;
