-- ========================================
-- 🔧 CORRECTION: Insertion du profil utilisateur manquant
-- ========================================

-- Insérer l'utilisateur manquant dans la table users
INSERT INTO users (id, email, name, user_type, rating, review_count)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'userType', 'client'),
  0.00,
  0
FROM auth.users
WHERE id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0'
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0'
  );

-- Insérer dans la table clients si c'est un client
INSERT INTO clients (id)
SELECT 
  u.id
FROM users u
WHERE u.id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0'
  AND u.user_type = 'client'
  AND NOT EXISTS (
    SELECT 1 FROM clients WHERE id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0'
  );

-- Insérer dans la table artisans si c'est un artisan
INSERT INTO artisans (id, category, hourly_rate, travel_fee, intervention_radius, specialties)
SELECT 
  u.id,
  COALESCE((SELECT raw_user_meta_data->>'category' FROM auth.users WHERE id = u.id), 'general'),
  50.00,
  25.00,
  20,
  ARRAY[]::TEXT[]
FROM users u
WHERE u.id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0'
  AND u.user_type = 'artisan'
  AND NOT EXISTS (
    SELECT 1 FROM artisans WHERE id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0'
  );

-- Créer le wallet si c'est un artisan
INSERT INTO wallets (artisan_id, balance, pending_balance, total_earnings, total_withdrawals, currency)
SELECT 
  a.id,
  0.00,
  0.00,
  0.00,
  0.00,
  'EUR'
FROM artisans a
WHERE a.id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0'
  AND NOT EXISTS (
    SELECT 1 FROM wallets WHERE artisan_id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0'
  );

-- Vérifier que l'utilisateur existe maintenant
SELECT 
  u.id,
  u.email,
  u.name,
  u.user_type,
  CASE 
    WHEN EXISTS(SELECT 1 FROM clients WHERE id = u.id) THEN 'Client profile exists'
    WHEN EXISTS(SELECT 1 FROM artisans WHERE id = u.id) THEN 'Artisan profile exists'
    ELSE 'No profile found'
  END as profile_status
FROM users u
WHERE u.id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0';
