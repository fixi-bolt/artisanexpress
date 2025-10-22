-- ==============================================
-- 🔧 FIX COMPLET - USER SYNC & AUTO-REPAIR v2
-- Script optimisé avec fix password_hash
-- ==============================================

-- ==============================================
-- 0️⃣ FIX PASSWORD_HASH (CRITIQUE)
-- ==============================================
ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE public.users ALTER COLUMN password_hash SET DEFAULT '';

-- ==============================================
-- 1️⃣ FONCTION TRIGGER (avec meilleure gestion)
-- ==============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Protection contre les doublons
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Insertion dans public.users
  INSERT INTO public.users (id, email, name, user_type, rating, review_count, password_hash)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'client'),
    0.00,
    0,
    ''  -- ✅ Ajout password_hash vide
  )
  ON CONFLICT (id) DO NOTHING;

  -- Création automatique du profil client/artisan
  IF COALESCE(NEW.raw_user_meta_data->>'user_type', 'client') = 'client' THEN
    INSERT INTO public.clients (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  ELSIF COALESCE(NEW.raw_user_meta_data->>'user_type', 'client') = 'artisan' THEN
    INSERT INTO public.artisans (id, category, hourly_rate, travel_fee, intervention_radius)
    VALUES (NEW.id, 'Non spécifié', 50.00, 25.00, 20)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.wallets (artisan_id, balance, pending_balance, total_earnings, total_withdrawals, currency)
    VALUES (NEW.id, 0.00, 0.00, 0.00, 0.00, 'EUR')
    ON CONFLICT (artisan_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- ==============================================
-- 2️⃣ RECRÉER LE TRIGGER
-- ==============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ==============================================
-- 3️⃣ POLICIES RLS (avec DROP avant CREATE)
-- ==============================================

-- Enable RLS si pas déjà fait
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- DROP puis CREATE pour être sûr
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow update for own profile" ON public.users;
DROP POLICY IF EXISTS "Allow select own or artisan profiles" ON public.users;

CREATE POLICY "Allow insert for authenticated users"
ON public.users
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- SELECT optimisé: voir son profil + tous les artisans
CREATE POLICY "Allow select own or artisan profiles"
ON public.users
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = id OR user_type = 'artisan');

CREATE POLICY "Allow update for own profile"
ON public.users
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ==============================================
-- 4️⃣ RÉPARATION UTILISATEUR SPÉCIFIQUE
-- ==============================================
DO $$
DECLARE
  v_user_id UUID := '972f58ff-b099-47d0-92ec-de3ae442a011';
  v_email TEXT;
  v_user_type TEXT;
BEGIN
  -- Récupérer les infos depuis auth.users
  SELECT email, COALESCE(raw_user_meta_data->>'user_type', 'client')
  INTO v_email, v_user_type
  FROM auth.users
  WHERE id = v_user_id;

  IF v_email IS NULL THEN
    RAISE NOTICE '❌ Utilisateur % introuvable dans auth.users', v_user_id;
    RETURN;
  END IF;

  RAISE NOTICE '🔍 Trouvé: % (type: %)', v_email, v_user_type;

  -- Créer dans public.users
  INSERT INTO public.users (id, email, name, user_type, rating, review_count, password_hash)
  VALUES (
    v_user_id,
    v_email,
    split_part(v_email, '@', 1),
    v_user_type,
    0.00,
    0,
    ''  -- ✅ password_hash vide
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      user_type = EXCLUDED.user_type;

  RAISE NOTICE '✅ User créé/mis à jour dans public.users';

  -- Créer le profil associé
  IF v_user_type = 'client' THEN
    INSERT INTO public.clients (id)
    VALUES (v_user_id)
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE '✅ Profil client créé';
    
  ELSIF v_user_type = 'artisan' THEN
    INSERT INTO public.artisans (id, category, hourly_rate, travel_fee, intervention_radius)
    VALUES (v_user_id, 'Non spécifié', 50.00, 25.00, 20)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.wallets (artisan_id, balance, pending_balance, total_earnings, total_withdrawals, currency)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00, 'EUR')
    ON CONFLICT (artisan_id) DO NOTHING;
    
    RAISE NOTICE '✅ Profil artisan + wallet créés';
  END IF;

END $$;

-- ==============================================
-- 5️⃣ AUTO-RÉPARATION TOUS USERS MANQUANTS
-- ==============================================
DO $$
DECLARE
  rec RECORD;
  v_user_type TEXT;
BEGIN
  RAISE NOTICE '🔍 Recherche des users manquants...';
  
  FOR rec IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    v_user_type := COALESCE(rec.raw_user_meta_data->>'user_type', 'client');
    
    RAISE NOTICE '🛠️ Réparation pour: % (type: %)', rec.email, v_user_type;

    -- Créer dans public.users
    INSERT INTO public.users (id, email, name, user_type, rating, review_count, password_hash)
    VALUES (
      rec.id,
      rec.email,
      split_part(rec.email, '@', 1),
      v_user_type,
      0.00,
      0,
      ''  -- ✅ password_hash vide
    )
    ON CONFLICT (id) DO NOTHING;

    -- Créer profil associé
    IF v_user_type = 'client' THEN
      INSERT INTO public.clients (id)
      VALUES (rec.id)
      ON CONFLICT (id) DO NOTHING;
      
    ELSIF v_user_type = 'artisan' THEN
      INSERT INTO public.artisans (id, category, hourly_rate, travel_fee, intervention_radius)
      VALUES (rec.id, 'Non spécifié', 50.00, 25.00, 20)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.wallets (artisan_id, balance, pending_balance, total_earnings, total_withdrawals, currency)
      VALUES (rec.id, 0.00, 0.00, 0.00, 0.00, 'EUR')
      ON CONFLICT (artisan_id) DO NOTHING;
    END IF;
  END LOOP;

  RAISE NOTICE '✅ Auto-réparation terminée';
END $$;

-- ==============================================
-- 6️⃣ RAPPORT FINAL DÉTAILLÉ
-- ==============================================
SELECT 
  '📊 STATISTIQUES' AS section,
  (SELECT COUNT(*) FROM auth.users) AS auth_users,
  (SELECT COUNT(*) FROM public.users) AS public_users,
  (SELECT COUNT(*) FROM public.clients) AS clients,
  (SELECT COUNT(*) FROM public.artisans) AS artisans,
  (SELECT COUNT(*) FROM public.wallets) AS wallets;

-- Vérification du trigger
SELECT 
  '🔧 TRIGGER' AS section,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Vérification policies
SELECT 
  '🔒 POLICIES' AS section,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Vérification user spécifique
SELECT 
  '👤 USER 972f58ff...' AS section,
  u.id,
  u.email,
  u.user_type,
  c.id IS NOT NULL AS has_client_profile,
  a.id IS NOT NULL AS has_artisan_profile,
  w.artisan_id IS NOT NULL AS has_wallet
FROM public.users u
LEFT JOIN public.clients c ON u.id = c.id
LEFT JOIN public.artisans a ON u.id = a.id
LEFT JOIN public.wallets w ON u.id = w.artisan_id
WHERE u.id = '972f58ff-b099-47d0-92ec-de3ae442a011';

-- ==============================================
-- ✅ SCRIPT TERMINÉ
-- ==============================================
-- 1. Copie ce script dans le SQL Editor de Supabase
-- 2. Exécute-le complètement (bouton RUN)
-- 3. Vérifie les résultats dans les rapports
-- 4. Reconnecte-toi à l'application
-- ==============================================
