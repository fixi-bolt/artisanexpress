-- ==============================================
-- FIX POUR PROFIL UTILISATEUR MANQUANT
-- ==============================================
-- Ce script corrige le problème où un utilisateur existe dans auth.users
-- mais pas dans public.users

-- 1. Vérifier si l'utilisateur existe dans auth mais pas dans users
DO $$
DECLARE
  auth_user_id UUID := 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0';
  auth_user_email TEXT;
  user_exists BOOLEAN;
BEGIN
  -- Récupérer l'email depuis auth.users
  SELECT email INTO auth_user_email
  FROM auth.users
  WHERE id = auth_user_id;
  
  IF auth_user_email IS NULL THEN
    RAISE NOTICE 'Utilisateur introuvable dans auth.users';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Email trouvé dans auth: %', auth_user_email;
  
  -- Vérifier si l'utilisateur existe dans public.users
  SELECT EXISTS(SELECT 1 FROM users WHERE id = auth_user_id) INTO user_exists;
  
  IF user_exists THEN
    RAISE NOTICE 'Utilisateur existe déjà dans public.users';
  ELSE
    RAISE NOTICE 'Utilisateur manquant dans public.users - création en cours...';
    
    -- Créer l'entrée dans users (ajustez user_type selon vos besoins)
    INSERT INTO users (id, email, name, user_type, rating, review_count)
    VALUES (
      auth_user_id,
      auth_user_email,
      COALESCE(split_part(auth_user_email, '@', 1), 'Utilisateur'),
      'client', -- Changez en 'artisan' ou 'admin' si nécessaire
      0.00,
      0
    );
    
    -- Créer l'entrée correspondante dans clients
    INSERT INTO clients (id)
    VALUES (auth_user_id);
    
    RAISE NOTICE 'Profil utilisateur créé avec succès!';
  END IF;
END $$;

-- 2. Vérifier et réparer le trigger pour éviter ce problème à l'avenir
-- Le trigger devrait créer automatiquement une entrée dans users après auth.users

-- Note: Les triggers automatiques nécessitent des permissions spéciales sur auth.users
-- Si vous ne pouvez pas créer de trigger sur auth.users, vous devez gérer
-- la création du profil dans votre code application (AuthContext.tsx)

-- 3. Recharger le cache du schéma (IMPORTANT après toute modification)
NOTIFY pgrst, 'reload schema';
