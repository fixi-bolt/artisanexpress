-- ========================================
-- 🔧 CORRECTIONS FINALES - APPLICATION FONCTIONNELLE
-- ========================================
-- Ce script contient toutes les corrections nécessaires pour
-- garantir le bon fonctionnement de l'application au lancement
-- Date: 2025-01-23

-- ========================================
-- 1️⃣ VÉRIFIER ET CORRIGER LES COLONNES ARTISANS
-- ========================================

DO $$ 
BEGIN
  -- S'assurer que toutes les colonnes critiques existent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'intervention_radius'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN intervention_radius INTEGER DEFAULT 20 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT 50.00 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'travel_fee'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN travel_fee DECIMAL(10,2) DEFAULT 25.00 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'is_available'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN is_available BOOLEAN DEFAULT true NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'category'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN category TEXT DEFAULT 'Non spécifié' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'artisans' AND column_name = 'specialties'
  ) THEN
    ALTER TABLE public.artisans ADD COLUMN specialties TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- ========================================
-- 2️⃣ CORRIGER LES VALEURS NULL
-- ========================================

UPDATE public.artisans
SET 
  hourly_rate = COALESCE(hourly_rate, 50.00),
  travel_fee = COALESCE(travel_fee, 25.00),
  intervention_radius = COALESCE(intervention_radius, 20),
  is_available = COALESCE(is_available, true),
  category = COALESCE(category, 'Non spécifié'),
  specialties = COALESCE(specialties, '{}'),
  updated_at = NOW()
WHERE 
  hourly_rate IS NULL 
  OR travel_fee IS NULL
  OR intervention_radius IS NULL 
  OR is_available IS NULL
  OR category IS NULL
  OR specialties IS NULL;

-- ========================================
-- 3️⃣ FONCTION AUTO-CRÉATION PROFILS
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type TEXT;
  v_name TEXT;
BEGIN
  v_user_type := COALESCE(
    NEW.raw_user_meta_data->>'user_type',
    'client'
  );
  
  v_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'Utilisateur'
  );

  -- Créer dans public.users
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

  -- Créer profil selon le type
  IF v_user_type = 'client' THEN
    INSERT INTO public.clients (id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
    
  ELSIF v_user_type = 'artisan' THEN
    INSERT INTO public.artisans (
      id, category, hourly_rate, travel_fee, 
      intervention_radius, is_available, specialties,
      created_at, updated_at
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
          ELSE '{}'::TEXT[]
        END,
        '{}'
      ),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Créer wallet
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
-- 4️⃣ CRÉER LES PROFILS MANQUANTS
-- ========================================

-- Pour tous les artisans sans wallet
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
ON CONFLICT (artisan_id) DO NOTHING;

-- ========================================
-- 5️⃣ VÉRIFICATION FINALE
-- ========================================

DO $$
DECLARE
  v_total_artisans INTEGER;
  v_artisans_with_null INTEGER;
  v_artisans_with_wallets INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_artisans FROM public.artisans;
  
  SELECT COUNT(*) INTO v_artisans_with_null 
  FROM public.artisans 
  WHERE hourly_rate IS NULL 
    OR intervention_radius IS NULL 
    OR is_available IS NULL
    OR category IS NULL;

  SELECT COUNT(*) INTO v_artisans_with_wallets 
  FROM public.artisans a
  INNER JOIN public.wallets w ON w.artisan_id = a.id;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CORRECTIONS FINALES APPLIQUÉES';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔧 Total artisans: %', v_total_artisans;
  RAISE NOTICE '💰 Artisans avec wallet: %', v_artisans_with_wallets;
  RAISE NOTICE '❌ Artisans avec NULL: %', v_artisans_with_null;
  
  IF v_artisans_with_null > 0 THEN
    RAISE WARNING '⚠️  Il reste % artisans avec des valeurs NULL', v_artisans_with_null;
  ELSE
    RAISE NOTICE '✅ Tous les artisans ont des valeurs valides';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;
