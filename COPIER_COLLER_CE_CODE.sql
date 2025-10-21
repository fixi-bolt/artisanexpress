-- ⚠️ IMPORTANT: Copiez TOUT ce code et collez-le dans l'éditeur SQL de Supabase
-- Puis cliquez sur "Run" ou appuyez sur Ctrl+Enter

DO $$
DECLARE
  auth_user_id UUID := 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0';
  auth_user_email TEXT;
  user_exists BOOLEAN;
BEGIN
  SELECT email INTO auth_user_email FROM auth.users WHERE id = auth_user_id;
  
  IF auth_user_email IS NULL THEN
    RAISE NOTICE 'Utilisateur introuvable dans auth.users';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Email trouvé: %', auth_user_email;
  
  SELECT EXISTS(SELECT 1 FROM users WHERE id = auth_user_id) INTO user_exists;
  
  IF user_exists THEN
    RAISE NOTICE 'Utilisateur existe déjà dans public.users';
  ELSE
    RAISE NOTICE 'Création du profil utilisateur...';
    
    INSERT INTO users (id, email, name, user_type, rating, review_count)
    VALUES (
      auth_user_id,
      auth_user_email,
      COALESCE(split_part(auth_user_email, '@', 1), 'Utilisateur'),
      'client',
      0.00,
      0
    );
    
    INSERT INTO clients (id) VALUES (auth_user_id);
    
    RAISE NOTICE 'Profil utilisateur créé avec succès!';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
