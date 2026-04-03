-- ========================================
-- 🔧 FIX MISSING USER - COMPLETE SOLUTION
-- ========================================
-- Run this in Supabase SQL Editor
-- This will create the missing user and fix the trigger

-- Step 1: Get the user's auth information
DO $$
DECLARE
  auth_user_id UUID := 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0';
  auth_user_email TEXT;
  auth_user_name TEXT;
BEGIN
  -- Get email from auth.users
  SELECT email INTO auth_user_email
  FROM auth.users
  WHERE id = auth_user_id;

  IF auth_user_email IS NULL THEN
    RAISE EXCEPTION 'User not found in auth.users with ID: %', auth_user_id;
  END IF;

  -- Extract name from email
  auth_user_name := COALESCE(split_part(auth_user_email, '@', 1), 'Utilisateur');

  RAISE NOTICE 'Found user: % <%>', auth_user_name, auth_user_email;

  -- Step 2: Insert into users table
  INSERT INTO users (id, email, name, user_type, rating, review_count)
  VALUES (
    auth_user_id,
    auth_user_email,
    auth_user_name,
    'client',  -- Default to client
    0.00,
    0
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name;

  RAISE NOTICE '✅ User profile created in users table';

  -- Step 3: Insert into clients table
  INSERT INTO clients (id)
  VALUES (auth_user_id)
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE '✅ Client profile created';

  RAISE NOTICE '✅✅✅ User setup complete! User ID: %', auth_user_id;
END $$;

-- ========================================
-- 🔧 CREATE TRIGGER FOR AUTO USER CREATION
-- ========================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create function to handle new user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into users table
  INSERT INTO users (id, email, name, user_type, rating, review_count)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'user_type',
      'client'
    ),
    0.00,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert into clients table by default
  INSERT INTO clients (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ========================================
-- 🔧 GRANT NECESSARY PERMISSIONS
-- ========================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON clients TO authenticated;
GRANT SELECT, INSERT, UPDATE ON artisans TO authenticated;
GRANT SELECT, INSERT, UPDATE ON admins TO authenticated;

-- ========================================
-- ✅ VERIFICATION
-- ========================================

DO $$
DECLARE
  user_exists BOOLEAN;
  client_exists BOOLEAN;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM users WHERE id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0')
  INTO user_exists;

  -- Check if client exists
  SELECT EXISTS(SELECT 1 FROM clients WHERE id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0')
  INTO client_exists;

  IF user_exists AND client_exists THEN
    RAISE NOTICE '✅✅✅ SUCCESS! User profile is now complete.';
  ELSE
    IF NOT user_exists THEN
      RAISE WARNING '⚠️ User still missing in users table';
    END IF;
    IF NOT client_exists THEN
      RAISE WARNING '⚠️ Client profile still missing';
    END IF;
  END IF;
END $$;

-- Check the user profile
SELECT 
  u.id,
  u.email,
  u.name,
  u.user_type,
  c.id as client_id,
  'User profile exists' as status
FROM users u
LEFT JOIN clients c ON u.id = c.id
WHERE u.id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0';
