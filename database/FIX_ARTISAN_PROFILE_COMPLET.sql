-- ========================================
-- 🔧 CORRECTION COMPLÈTE DU PROFIL ARTISAN
-- ========================================
-- Ce script corrige les problèmes de profil artisan
-- notamment les colonnes manquantes et les valeurs NULL

-- ========================================
-- 1️⃣ S'ASSURER QUE TOUTES LES COLONNES EXISTENT
-- ========================================

-- Ajouter la colonne SIRET si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='artisans' AND column_name='siret'
  ) THEN
    ALTER TABLE artisans ADD COLUMN siret TEXT;
  END IF;
END $$;

-- Vérifier que toutes les colonnes nécessaires existent avec les bonnes valeurs par défaut
DO $$ 
BEGIN
  -- hourly_rate: s'assurer qu'il y a une valeur par défaut
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='artisans' AND column_name='hourly_rate' AND is_nullable='YES'
  ) THEN
    ALTER TABLE artisans ALTER COLUMN hourly_rate SET NOT NULL;
    ALTER TABLE artisans ALTER COLUMN hourly_rate SET DEFAULT 50.00;
  END IF;

  -- intervention_radius: s'assurer qu'il y a une valeur par défaut
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='artisans' AND column_name='intervention_radius' AND column_default IS NULL
  ) THEN
    ALTER TABLE artisans ALTER COLUMN intervention_radius SET DEFAULT 20;
  END IF;

  -- is_available: s'assurer qu'il y a une valeur par défaut
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='artisans' AND column_name='is_available' AND column_default IS NULL
  ) THEN
    ALTER TABLE artisans ALTER COLUMN is_available SET DEFAULT true;
  END IF;
END $$;

-- ========================================
-- 2️⃣ CORRIGER LES VALEURS NULL EXISTANTES
-- ========================================

-- Mettre des valeurs par défaut pour les artisans existants
UPDATE artisans
SET 
  hourly_rate = COALESCE(hourly_rate, 50.00),
  intervention_radius = COALESCE(intervention_radius, 20),
  is_available = COALESCE(is_available, true),
  travel_fee = COALESCE(travel_fee, 0.00),
  specialties = COALESCE(specialties, '{}'),
  completed_missions = COALESCE(completed_missions, 0),
  is_suspended = COALESCE(is_suspended, false)
WHERE 
  hourly_rate IS NULL 
  OR intervention_radius IS NULL 
  OR is_available IS NULL
  OR travel_fee IS NULL
  OR specialties IS NULL
  OR completed_missions IS NULL
  OR is_suspended IS NULL;

-- ========================================
-- 3️⃣ CRÉER/RECRÉER LA FONCTION DE SYNCHRONISATION AUTH → USERS
-- ========================================

-- Cette fonction crée automatiquement un profil utilisateur lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type TEXT;
BEGIN
  -- Extraire le user_type depuis les métadonnées
  v_user_type := COALESCE(
    NEW.raw_user_meta_data->>'user_type',
    NEW.raw_user_meta_data->>'type',
    'client'
  );

  -- Insérer dans la table users
  INSERT INTO public.users (id, email, name, phone, user_type, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    v_user_type,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Si c'est un artisan, créer le profil artisan
  IF v_user_type = 'artisan' THEN
    INSERT INTO public.artisans (
      id, 
      category, 
      hourly_rate, 
      travel_fee, 
      intervention_radius, 
      is_available,
      specialties,
      completed_missions,
      is_suspended,
      created_at, 
      updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'category', 'handyman'),
      COALESCE((NEW.raw_user_meta_data->>'hourly_rate')::DECIMAL, 50.00),
      COALESCE((NEW.raw_user_meta_data->>'travel_fee')::DECIMAL, 0.00),
      COALESCE((NEW.raw_user_meta_data->>'intervention_radius')::INTEGER, 20),
      COALESCE((NEW.raw_user_meta_data->>'is_available')::BOOLEAN, true),
      COALESCE((NEW.raw_user_meta_data->>'specialties')::TEXT[], '{}'),
      0,
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Créer le wallet pour l'artisan
    INSERT INTO public.wallets (
      artisan_id,
      balance,
      pending_balance,
      total_earnings,
      total_withdrawals,
      currency,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      0.00,
      0.00,
      0.00,
      0.00,
      'EUR',
      NOW(),
      NOW()
    )
    ON CONFLICT (artisan_id) DO NOTHING;

  -- Si c'est un client, créer le profil client
  ELSIF v_user_type = 'client' THEN
    INSERT INTO public.clients (id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le nouveau trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 4️⃣ VÉRIFIER ET CRÉER LES PROFILS MANQUANTS
-- ========================================

-- Pour les utilisateurs auth existants sans profil dans public.users
INSERT INTO public.users (id, email, name, user_type, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'user_type', au.raw_user_meta_data->>'type', 'client'),
  au.created_at,
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Pour les artisans dans users sans profil dans artisans
INSERT INTO public.artisans (
  id,
  category,
  hourly_rate,
  travel_fee,
  intervention_radius,
  is_available,
  specialties,
  completed_missions,
  is_suspended,
  created_at,
  updated_at
)
SELECT 
  u.id,
  'handyman',
  50.00,
  0.00,
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
ON CONFLICT (id) DO NOTHING;

-- Pour les clients dans users sans profil dans clients
INSERT INTO public.clients (id, created_at, updated_at)
SELECT u.id, NOW(), NOW()
FROM public.users u
WHERE u.user_type = 'client'
  AND NOT EXISTS (
    SELECT 1 FROM public.clients c WHERE c.id = u.id
  )
ON CONFLICT (id) DO NOTHING;

-- Créer les wallets manquants pour tous les artisans
INSERT INTO public.wallets (
  artisan_id,
  balance,
  pending_balance,
  total_earnings,
  total_withdrawals,
  currency,
  created_at,
  updated_at
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
ON CONFLICT (artisan_id) DO NOTHING;

-- ========================================
-- 5️⃣ VÉRIFIER LES POLITIQUES RLS POUR ARTISANS
-- ========================================

-- S'assurer que les artisans peuvent lire leurs propres données
DROP POLICY IF EXISTS artisans_select_own ON artisans;
CREATE POLICY artisans_select_own ON artisans 
  FOR SELECT 
  USING (
    auth.uid() = id 
    OR is_available = true
  );

-- S'assurer que les artisans peuvent modifier leurs propres données
DROP POLICY IF EXISTS artisans_update_own ON artisans;
CREATE POLICY artisans_update_own ON artisans 
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- S'assurer que les artisans peuvent insérer leur profil (pour la création initiale)
DROP POLICY IF EXISTS artisans_insert_own ON artisans;
CREATE POLICY artisans_insert_own ON artisans 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ========================================
-- 6️⃣ CRÉER UN INDEX POUR AMÉLIORER LES PERFORMANCES
-- ========================================

-- Index pour la recherche par disponibilité
CREATE INDEX IF NOT EXISTS idx_artisans_available_not_suspended 
  ON artisans(is_available, is_suspended) 
  WHERE is_available = true AND is_suspended = false;

-- ========================================
-- ✅ VÉRIFICATION FINALE
-- ========================================

-- Afficher un résumé des données
DO $$
DECLARE
  v_total_users INTEGER;
  v_total_artisans INTEGER;
  v_total_clients INTEGER;
  v_artisans_with_null INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM users;
  SELECT COUNT(*) INTO v_total_artisans FROM artisans;
  SELECT COUNT(*) INTO v_total_clients FROM clients;
  
  SELECT COUNT(*) INTO v_artisans_with_null 
  FROM artisans 
  WHERE hourly_rate IS NULL 
    OR intervention_radius IS NULL 
    OR is_available IS NULL;

  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ CORRECTION TERMINÉE';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Total utilisateurs: %', v_total_users;
  RAISE NOTICE 'Total artisans: %', v_total_artisans;
  RAISE NOTICE 'Total clients: %', v_total_clients;
  RAISE NOTICE 'Artisans avec valeurs NULL: %', v_artisans_with_null;
  RAISE NOTICE '====================================';
END $$;
