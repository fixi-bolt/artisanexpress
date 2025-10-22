-- ==============================================
-- 🧠 SUPABASE - FIX COMPLET & AUTO-RÉPARATION
-- Version: Optimisée avec fix immédiat
-- ==============================================

-- ==============================================
-- 1️⃣ FONCTION TRIGGER : Création auto user
-- ==============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    RAISE NOTICE '⚠️ Utilisateur déjà existant (%).', NEW.email;
    RETURN NEW;
  END IF;

  INSERT INTO public.users (id, email, name, user_type, rating, review_count)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'User'
    ),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'client'),
    0.00,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  IF COALESCE(NEW.raw_user_meta_data->>'user_type', 'client') = 'client' THEN
    INSERT INTO public.clients (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE '✅ Profil client créé pour %', NEW.email;

  ELSIF COALESCE(NEW.raw_user_meta_data->>'user_type', 'client') = 'artisan' THEN
    INSERT INTO public.artisans (id, category, hourly_rate, travel_fee, intervention_radius)
    VALUES (NEW.id, 'Non spécifié', 50.00, 25.00, 20)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.wallets (artisan_id, balance, pending_balance, total_earnings, total_withdrawals, currency)
    VALUES (NEW.id, 0.00, 0.00, 0.00, 0.00, 'EUR')
    ON CONFLICT (artisan_id) DO NOTHING;
    RAISE NOTICE '✅ Profil artisan + wallet créés pour %', NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth;

-- ==============================================
-- 2️⃣ TRIGGER
-- ==============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ==============================================
-- 3️⃣ POLICIES RLS (sécurisées)
-- ==============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

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

-- 👁️ SELECT optimisé: voir son profil + tous les artisans
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
-- 4️⃣ FIX IMMÉDIAT: Utilisateur 972f58ff
-- ==============================================
DO $$
DECLARE
  v_user_id UUID := '972f58ff-b099-47d0-92ec-de3ae442a011';
  v_email TEXT;
  v_user_type TEXT;
BEGIN
  RAISE NOTICE '🔍 Recherche utilisateur %...', v_user_id;

  SELECT email, COALESCE(raw_user_meta_data->>'user_type', 'client')
  INTO v_email, v_user_type
  FROM auth.users
  WHERE id = v_user_id;

  IF v_email IS NULL THEN
    RAISE NOTICE '❌ Utilisateur % introuvable dans auth.users', v_user_id;
    RETURN;
  END IF;

  RAISE NOTICE '📧 Email trouvé: % (type: %)', v_email, v_user_type;

  INSERT INTO public.users (id, email, name, user_type, rating, review_count)
  VALUES (
    v_user_id,
    v_email,
    split_part(v_email, '@', 1),
    v_user_type,
    0.00,
    0
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      user_type = EXCLUDED.user_type,
      updated_at = CURRENT_TIMESTAMP;

  IF v_user_type = 'client' THEN
    INSERT INTO public.clients (id)
    VALUES (v_user_id)
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE '✅ Profil client créé/mis à jour';
    
  ELSIF v_user_type = 'artisan' THEN
    INSERT INTO public.artisans (id, category, hourly_rate, travel_fee, intervention_radius)
    VALUES (v_user_id, 'Plombier', 50.00, 25.00, 20)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.wallets (artisan_id, balance, pending_balance, total_earnings, total_withdrawals, currency)
    VALUES (v_user_id, 0.00, 0.00, 0.00, 0.00, 'EUR')
    ON CONFLICT (artisan_id) DO NOTHING;
    RAISE NOTICE '✅ Profil artisan créé/mis à jour';
  END IF;

  RAISE NOTICE '🎉 Utilisateur % complètement réparé!', v_email;
END $$;

-- ==============================================
-- 5️⃣ AUTO-RÉPARATION GLOBALE
-- ==============================================
DO $$
DECLARE
  rec RECORD;
  v_user_type TEXT;
  v_repaired INTEGER := 0;
BEGIN
  RAISE NOTICE '🔍 Recherche utilisateurs manquants...';

  FOR rec IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    v_user_type := COALESCE(rec.raw_user_meta_data->>'user_type', 'client');
    
    INSERT INTO public.users (id, email, name, user_type, rating, review_count)
    VALUES (
      rec.id,
      rec.email,
      split_part(rec.email, '@', 1),
      v_user_type,
      0.00,
      0
    )
    ON CONFLICT (id) DO NOTHING;

    IF v_user_type = 'client' THEN
      INSERT INTO public.clients (id) VALUES (rec.id) ON CONFLICT (id) DO NOTHING;
    ELSIF v_user_type = 'artisan' THEN
      INSERT INTO public.artisans (id, category, hourly_rate, travel_fee, intervention_radius)
      VALUES (rec.id, 'Non spécifié', 50.00, 25.00, 20)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.wallets (artisan_id, balance, pending_balance, total_earnings, total_withdrawals, currency)
      VALUES (rec.id, 0.00, 0.00, 0.00, 0.00, 'EUR')
      ON CONFLICT (artisan_id) DO NOTHING;
    END IF;
    
    v_repaired := v_repaired + 1;
    RAISE NOTICE '🛠️ Réparé: % (%)', rec.email, v_user_type;
  END LOOP;

  RAISE NOTICE '✅ Réparation terminée: % utilisateur(s) réparé(s)', v_repaired;
END $$;

-- ==============================================
-- 6️⃣ VÉRIFICATION: Utilisateur 972f58ff
-- ==============================================
SELECT 
  '🔍 VÉRIFICATION UTILISATEUR 972f58ff' AS section,
  u.id,
  u.email,
  u.user_type,
  u.name,
  c.id IS NOT NULL AS has_client_profile,
  a.id IS NOT NULL AS has_artisan_profile,
  w.artisan_id IS NOT NULL AS has_wallet
FROM public.users u
LEFT JOIN public.clients c ON u.id = c.id
LEFT JOIN public.artisans a ON u.id = a.id
LEFT JOIN public.wallets w ON u.id = w.artisan_id
WHERE u.id = '972f58ff-b099-47d0-92ec-de3ae442a011';

-- ==============================================
-- 7️⃣ RAPPORT GLOBAL
-- ==============================================
SELECT 
  '📊 STATISTIQUES GLOBALES' AS section,
  (SELECT COUNT(*) FROM auth.users) AS auth_users,
  (SELECT COUNT(*) FROM public.users) AS public_users,
  (SELECT COUNT(*) FROM public.clients) AS clients,
  (SELECT COUNT(*) FROM public.artisans) AS artisans,
  (SELECT COUNT(*) FROM public.wallets) AS wallets;

SELECT 
  '🔧 TRIGGER STATUS' AS section,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

SELECT 
  '🔒 RLS POLICIES' AS section,
  policyname,
  cmd AS operation
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- ==============================================
-- ✅ FIN - Instructions
-- ==============================================
-- 1. Copie ce script dans l'éditeur SQL de Supabase
-- 2. Exécute-le complètement
-- 3. Vérifie les résultats dans les rapports
-- 4. Reconnecte-toi à l'app
-- ==============================================
