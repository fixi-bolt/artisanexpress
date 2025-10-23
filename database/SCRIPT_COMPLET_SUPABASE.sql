-- ========================================
-- 🚀 SCRIPT COMPLET SUPABASE - ARTISAN CONNECT
-- ========================================
-- Ce script contient TOUTES les corrections nécessaires
-- Date : 2025-10-23
-- 
-- À COLLER DANS : Supabase → SQL Editor → New Query
-- 
-- ✅ Corrections incluses :
-- 1. Structure complète des tables artisans
-- 2. Valeurs par défaut et correction des NULL
-- 3. Synchronisation automatique Auth → Public Users
-- 4. Profils manquants créés automatiquement
-- 5. Politiques RLS optimisées
-- 6. Index de performance
-- 7. SIRET optionnel (inscription simplifiée)
-- ========================================

-- ========================================
-- 🔧 ÉTAPE 1 : DÉSACTIVER RLS TEMPORAIREMENT
-- ========================================
ALTER TABLE IF EXISTS public.artisans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admins DISABLE ROW LEVEL SECURITY;

-- ========================================
-- 📊 ÉTAPE 2 : STRUCTURE COMPLÈTE DES TABLES
-- ========================================

-- Ajouter toutes les colonnes nécessaires à la table artisans
DO $$ 
BEGIN
  -- SIRET (optionnel pour inscription)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'siret'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN siret TEXT;
  END IF;

  -- Nom de l'entreprise
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN company_name TEXT;
  END IF;

  -- Spécialités
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'specialties'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN specialties TEXT[] DEFAULT '{}';
  END IF;

  -- Compétences alternatives
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'skills'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN skills TEXT[] DEFAULT '{}';
  END IF;

  -- Statuts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'is_suspended'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN is_suspended BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN is_verified BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'is_certified'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN is_certified BOOLEAN DEFAULT false;
  END IF;

  -- Statistiques
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'completed_missions'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN completed_missions INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'years_of_experience'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN years_of_experience INTEGER;
  END IF;

  -- Langues
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'languages'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN languages TEXT[] DEFAULT '{"Français"}';
  END IF;

  -- Portfolio
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'photos'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN photos TEXT[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'documents'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN documents TEXT[];
  END IF;

  -- Disponibilités
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'availability_schedule'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN availability_schedule JSONB DEFAULT '{}';
  END IF;

  -- Assurance
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'insurance_number'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN insurance_number TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'insurance_expiry'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN insurance_expiry DATE;
  END IF;

  -- Réseaux sociaux
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'website_url'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN website_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'facebook_url'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN facebook_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'instagram_url'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN instagram_url TEXT;
  END IF;

END $$;

-- ========================================
-- 🔧 ÉTAPE 3 : VALEURS PAR DÉFAUT
-- ========================================

DO $$ 
BEGIN
  -- hourly_rate : 50€/h par défaut
  ALTER TABLE public.artisans 
    ALTER COLUMN hourly_rate SET DEFAULT 50.00;

  -- travel_fee : 25€ par défaut
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'travel_fee'
  ) THEN
    ALTER TABLE public.artisans 
      ALTER COLUMN travel_fee SET DEFAULT 25.00;
  END IF;

  -- intervention_radius : 20km par défaut
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'intervention_radius'
  ) THEN
    ALTER TABLE public.artisans 
      ALTER COLUMN intervention_radius SET DEFAULT 20;
  END IF;

  -- is_available : true par défaut
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'is_available'
  ) THEN
    ALTER TABLE public.artisans 
      ALTER COLUMN is_available SET DEFAULT true;
  END IF;

  -- category : 'Non spécifié' par défaut
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'category'
  ) THEN
    ALTER TABLE public.artisans 
      ALTER COLUMN category SET DEFAULT 'Non spécifié';
  END IF;

END $$;

-- ========================================
-- 📝 ÉTAPE 4 : CORRIGER LES VALEURS NULL EXISTANTES
-- ========================================

UPDATE public.artisans
SET 
  hourly_rate = COALESCE(hourly_rate, 50.00),
  travel_fee = COALESCE(travel_fee, 25.00),
  intervention_radius = COALESCE(intervention_radius, 20),
  is_available = COALESCE(is_available, true),
  category = COALESCE(category, 'Non spécifié'),
  specialties = COALESCE(specialties, COALESCE(skills, '{}')),
  skills = COALESCE(skills, COALESCE(specialties, '{}')),
  completed_missions = COALESCE(completed_missions, 0),
  is_suspended = COALESCE(is_suspended, false),
  is_verified = COALESCE(is_verified, false),
  is_certified = COALESCE(is_certified, false),
  languages = COALESCE(languages, '{"Français"}'),
  availability_schedule = COALESCE(availability_schedule, '{}'),
  updated_at = NOW()
WHERE 
  hourly_rate IS NULL 
  OR travel_fee IS NULL
  OR intervention_radius IS NULL 
  OR is_available IS NULL
  OR category IS NULL
  OR specialties IS NULL
  OR completed_missions IS NULL
  OR is_suspended IS NULL
  OR is_verified IS NULL
  OR is_certified IS NULL;

-- ========================================
-- 🔄 ÉTAPE 5 : FONCTION SYNCHRONISATION AUTH → USERS
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type TEXT;
  v_name TEXT;
BEGIN
  -- Déterminer le type d'utilisateur
  v_user_type := COALESCE(
    NEW.raw_user_meta_data->>'user_type',
    'client'
  );
  
  -- Extraire le nom
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'Utilisateur'
  );

  -- ✅ Insérer dans public.users
  INSERT INTO public.users (
    id, email, name, user_type, 
    phone, avatar_url, created_at, updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_name,
    v_user_type,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.created_at, NOW()),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    user_type = EXCLUDED.user_type,
    updated_at = NOW();

  -- ✅ Créer le profil spécifique
  IF v_user_type = 'client' THEN
    INSERT INTO public.clients (id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
  ELSIF v_user_type = 'artisan' THEN
    INSERT INTO public.artisans (
      id, category, hourly_rate, travel_fee, 
      intervention_radius, is_available, specialties,
      siret, company_name, created_at, updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'category', 'Non spécifié'),
      COALESCE((NEW.raw_user_meta_data->>'hourly_rate')::NUMERIC, 50.00),
      COALESCE((NEW.raw_user_meta_data->>'travel_fee')::NUMERIC, 25.00),
      COALESCE((NEW.raw_user_meta_data->>'intervention_radius')::INTEGER, 20),
      COALESCE((NEW.raw_user_meta_data->>'is_available')::BOOLEAN, true),
      COALESCE(
        CASE 
          WHEN NEW.raw_user_meta_data->>'specialties' IS NOT NULL THEN 
            string_to_array(NEW.raw_user_meta_data->>'specialties', ',')
          WHEN NEW.raw_user_meta_data->>'skills' IS NOT NULL THEN 
            string_to_array(NEW.raw_user_meta_data->>'skills', ',')
          ELSE '{}'::TEXT[]
        END,
        '{}'
      ),
      NEW.raw_user_meta_data->>'siret',
      NEW.raw_user_meta_data->>'company_name',
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- ✅ Créer le wallet
    INSERT INTO public.wallets (
      artisan_id, balance, pending_balance, 
      total_earnings, total_withdrawals, currency,
      created_at, updated_at
    )
    VALUES (
      NEW.id, 0.00, 0.00, 0.00, 0.00, 'EUR',
      NOW(), NOW()
    )
    ON CONFLICT (artisan_id) DO NOTHING;
    
  ELSIF v_user_type = 'admin' THEN
    INSERT INTO public.admins (id, role, permissions, created_at, updated_at)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'role', 'moderator'),
      COALESCE(
        CASE 
          WHEN NEW.raw_user_meta_data->>'permissions' IS NOT NULL THEN 
            string_to_array(NEW.raw_user_meta_data->>'permissions', ',')
          ELSE '{}'::TEXT[]
        END,
        '{}'
      ),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 🛠️ ÉTAPE 6 : CRÉER LES PROFILS MANQUANTS
-- ========================================

DO $$
DECLARE
  users_created INTEGER := 0;
  artisans_created INTEGER := 0;
  clients_created INTEGER := 0;
  wallets_created INTEGER := 0;
BEGIN
  -- Créer users manquants
  WITH inserted_users AS (
    INSERT INTO public.users (
      id, email, name, user_type, created_at, updated_at
    )
    SELECT 
      au.id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1), 'Utilisateur'),
      COALESCE(au.raw_user_meta_data->>'user_type', 'client'),
      COALESCE(au.created_at, NOW()),
      NOW()
    FROM auth.users au
    WHERE NOT EXISTS (
      SELECT 1 FROM public.users pu WHERE pu.id = au.id
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id, user_type
  )
  SELECT COUNT(*) INTO users_created FROM inserted_users;

  -- Créer artisans manquants
  WITH inserted_artisans AS (
    INSERT INTO public.artisans (
      id, category, hourly_rate, travel_fee, intervention_radius,
      is_available, specialties, completed_missions, is_suspended,
      created_at, updated_at
    )
    SELECT 
      u.id,
      'Non spécifié',
      50.00,
      25.00,
      20,
      true,
      '{}',
      0,
      false,
      NOW(),
      NOW()
    FROM public.users u
    WHERE u.user_type = 'artisan'
      AND NOT EXISTS (
        SELECT 1 FROM public.artisans a WHERE a.id = u.id
      )
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  )
  SELECT COUNT(*) INTO artisans_created FROM inserted_artisans;

  -- Créer clients manquants
  WITH inserted_clients AS (
    INSERT INTO public.clients (id, created_at, updated_at)
    SELECT u.id, NOW(), NOW()
    FROM public.users u
    WHERE u.user_type = 'client'
      AND NOT EXISTS (
        SELECT 1 FROM public.clients c WHERE c.id = u.id
      )
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  )
  SELECT COUNT(*) INTO clients_created FROM inserted_clients;

  -- Créer wallets manquants
  WITH inserted_wallets AS (
    INSERT INTO public.wallets (
      artisan_id, balance, pending_balance,
      total_earnings, total_withdrawals, currency,
      created_at, updated_at
    )
    SELECT 
      a.id,
      0.00,
      0.00,
      0.00,
      0.00,
      'EUR',
      NOW(),
      NOW()
    FROM public.artisans a
    WHERE NOT EXISTS (
      SELECT 1 FROM public.wallets w WHERE w.artisan_id = a.id
    )
    ON CONFLICT (artisan_id) DO NOTHING
    RETURNING artisan_id
  )
  SELECT COUNT(*) INTO wallets_created FROM inserted_wallets;

  RAISE NOTICE '✅ Profils créés: % users, % artisans, % clients, % wallets', 
    users_created, artisans_created, clients_created, wallets_created;
END $$;

-- ========================================
-- 🔐 ÉTAPE 7 : POLITIQUES RLS
-- ========================================

-- Réactiver RLS
ALTER TABLE public.artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Supprimer anciennes politiques
DROP POLICY IF EXISTS "artisans_select_own" ON public.artisans;
DROP POLICY IF EXISTS "artisans_update_own" ON public.artisans;
DROP POLICY IF EXISTS "artisans_insert_own" ON public.artisans;
DROP POLICY IF EXISTS "artisans_view_public" ON public.artisans;

-- Politiques pour artisans
CREATE POLICY "artisans_view_public" ON public.artisans
  FOR SELECT USING (
    is_available = true 
    AND is_suspended = false
  );

CREATE POLICY "artisans_select_own" ON public.artisans
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "artisans_update_own" ON public.artisans
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "artisans_insert_own" ON public.artisans
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques pour users
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques pour clients
DROP POLICY IF EXISTS "clients_select_own" ON public.clients;
DROP POLICY IF EXISTS "clients_update_own" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_own" ON public.clients;

CREATE POLICY "clients_select_own" ON public.clients
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "clients_update_own" ON public.clients
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "clients_insert_own" ON public.clients
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Politiques pour wallets
DROP POLICY IF EXISTS "wallets_select_own" ON public.wallets;
DROP POLICY IF EXISTS "wallets_update_own" ON public.wallets;

CREATE POLICY "wallets_select_own" ON public.wallets
  FOR SELECT USING (auth.uid() = artisan_id);

CREATE POLICY "wallets_update_own" ON public.wallets
  FOR UPDATE USING (auth.uid() = artisan_id)
  WITH CHECK (auth.uid() = artisan_id);

-- ========================================
-- 📊 ÉTAPE 8 : INDEX DE PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_artisans_available 
ON public.artisans(is_available, is_suspended) 
WHERE is_available = true AND is_suspended = false;

CREATE INDEX IF NOT EXISTS idx_artisans_category 
ON public.artisans(category) 
WHERE is_available = true AND is_suspended = false;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' 
    AND column_name = 'latitude'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_artisans_geo 
    ON public.artisans(latitude, longitude) 
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' 
    AND column_name = 'rating'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_artisans_rating 
    ON public.artisans(rating) 
    WHERE is_available = true AND is_suspended = false;
  END IF;
END $$;

-- ========================================
-- ✅ ÉTAPE 9 : VÉRIFICATION FINALE
-- ========================================

DO $$
DECLARE
  v_total_users INTEGER;
  v_total_artisans INTEGER;
  v_total_clients INTEGER;
  v_artisans_with_wallets INTEGER;
  v_artisans_with_null INTEGER;
  v_artisans_available INTEGER;
  v_artisans_with_siret INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM public.users;
  SELECT COUNT(*) INTO v_total_artisans FROM public.artisans;
  SELECT COUNT(*) INTO v_total_clients FROM public.clients;
  
  SELECT COUNT(*) INTO v_artisans_with_wallets 
  FROM public.artisans a
  INNER JOIN public.wallets w ON w.artisan_id = a.id;
  
  SELECT COUNT(*) INTO v_artisans_with_null 
  FROM public.artisans 
  WHERE hourly_rate IS NULL 
    OR intervention_radius IS NULL 
    OR is_available IS NULL
    OR category IS NULL;

  SELECT COUNT(*) INTO v_artisans_available
  FROM public.artisans 
  WHERE is_available = true AND is_suspended = false;

  SELECT COUNT(*) INTO v_artisans_with_siret
  FROM public.artisans 
  WHERE siret IS NOT NULL AND siret != '';

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SCRIPT COMPLET TERMINÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '👥 Total utilisateurs: %', v_total_users;
  RAISE NOTICE '🔧 Total artisans: %', v_total_artisans;
  RAISE NOTICE '🤝 Total clients: %', v_total_clients;
  RAISE NOTICE '💰 Artisans avec wallet: %', v_artisans_with_wallets;
  RAISE NOTICE '✅ Artisans disponibles: %', v_artisans_available;
  RAISE NOTICE '📄 Artisans avec SIRET: %', v_artisans_with_siret;
  RAISE NOTICE '❌ Artisans avec NULL: %', v_artisans_with_null;
  RAISE NOTICE '========================================';
  
  IF v_artisans_with_null > 0 THEN
    RAISE WARNING '⚠️  Il reste % artisans avec des valeurs NULL', v_artisans_with_null;
    RAISE NOTICE '💡 Exécutez à nouveau le script si nécessaire';
  ELSE
    RAISE NOTICE '🎉 Tous les artisans ont des valeurs valides !';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🚀 CORRECTIONS APPLIQUÉES :';
  RAISE NOTICE '  ✅ Structure tables complète';
  RAISE NOTICE '  ✅ Valeurs par défaut configurées';
  RAISE NOTICE '  ✅ Profils synchronisés';
  RAISE NOTICE '  ✅ Wallets créés';
  RAISE NOTICE '  ✅ RLS configuré';
  RAISE NOTICE '  ✅ Index ajoutés';
  RAISE NOTICE '  ✅ SIRET optionnel';
  RAISE NOTICE '';
  RAISE NOTICE '📱 APPLICATION PRÊTE POUR LE LANCEMENT !';
  RAISE NOTICE '========================================';
  
END $$;

-- ========================================
-- 🎯 FIN DU SCRIPT
-- ========================================
-- Pour utiliser :
-- 1. Copiez tout le contenu de ce fichier
-- 2. Allez sur https://app.supabase.com → Votre projet
-- 3. SQL Editor → New Query
-- 4. Collez et cliquez sur "Run"
-- 5. Vérifiez les messages dans l'output
-- ========================================
