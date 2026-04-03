-- 🔧 CORRECTION: Créer manuellement l'utilisateur manquant
-- Ce script crée l'entrée manquante dans la table users pour l'utilisateur authentifié

-- 1️⃣ Insérer l'utilisateur dans la table users
-- Remplacer les valeurs par les informations réelles de l'utilisateur
DO $$
DECLARE
  v_user_id UUID := 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0';
  v_email TEXT;
  v_user_type TEXT := 'client'; -- Changez en 'artisan' si nécessaire
BEGIN
  -- Récupérer l'email depuis auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_user_id;
  
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non trouvé dans auth.users avec l''ID: %', v_user_id;
  END IF;
  
  RAISE NOTICE '📧 Email trouvé: %', v_email;
  
  -- Insérer dans la table users
  INSERT INTO public.users (id, email, name, user_type, rating, review_count)
  VALUES (
    v_user_id,
    v_email,
    COALESCE(split_part(v_email, '@', 1), 'Utilisateur'),
    v_user_type,
    0.00,
    0
  )
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE '✅ Utilisateur créé dans users avec ID: %', v_user_id;
  
  -- Créer le profil client ou artisan selon le type
  IF v_user_type = 'client' THEN
    INSERT INTO public.clients (id)
    VALUES (v_user_id)
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE '✅ Profil client créé';
  ELSIF v_user_type = 'artisan' THEN
    INSERT INTO public.artisans (
      id,
      category,
      hourly_rate,
      travel_fee,
      intervention_radius,
      is_available,
      completed_missions,
      specialties,
      is_suspended
    )
    VALUES (
      v_user_id,
      'Plombier', -- Changez selon la catégorie désirée
      50.00,
      25.00,
      20,
      true,
      0,
      ARRAY[]::TEXT[],
      false
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE '✅ Profil artisan créé';
    
    -- Créer le wallet pour l'artisan
    INSERT INTO public.wallets (
      artisan_id,
      balance,
      pending_balance,
      total_earnings,
      total_withdrawals,
      currency
    )
    VALUES (
      v_user_id,
      0.00,
      0.00,
      0.00,
      0.00,
      'EUR'
    )
    ON CONFLICT (artisan_id) DO NOTHING;
    
    RAISE NOTICE '✅ Wallet créé pour l''artisan';
  END IF;
  
  RAISE NOTICE '✅✅✅ Correction terminée avec succès!';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur lors de la création de l''utilisateur: %', SQLERRM;
END $$;

-- 2️⃣ Vérifier que l'utilisateur existe maintenant
SELECT 
  u.id,
  u.email,
  u.name,
  u.user_type,
  CASE 
    WHEN c.id IS NOT NULL THEN 'Client profile exists'
    WHEN a.id IS NOT NULL THEN 'Artisan profile exists'
    ELSE 'No profile found'
  END as profile_status
FROM public.users u
LEFT JOIN public.clients c ON u.id = c.id
LEFT JOIN public.artisans a ON u.id = a.id
WHERE u.id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0';
