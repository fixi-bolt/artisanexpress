-- ========================================
-- 🔧 FIX: ADD MISSING INSERT POLICIES
-- ========================================
-- This script adds the missing INSERT policies that allow user registration
-- 
-- ⚠️ IMPORTANT: Run this in your Supabase SQL Editor
-- 
-- INSTRUCTIONS:
-- 1. Go to https://supabase.com/dashboard
-- 2. Select your project
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Click "New Query"
-- 5. Copy and paste this ENTIRE file
-- 6. Click "Run"
-- 7. You should see "Success. No rows returned"
-- 8. Try signing up again!
-- ========================================

-- Drop existing INSERT policies if they exist
DROP POLICY IF EXISTS users_insert_own ON users;
DROP POLICY IF EXISTS artisans_insert_own ON artisans;
DROP POLICY IF EXISTS clients_insert_own ON clients;
DROP POLICY IF EXISTS admins_insert_own ON admins;
DROP POLICY IF EXISTS wallets_insert_own ON wallets;

-- ========================================
-- 📝 INSERT POLICIES
-- ========================================

-- Users table: Allow authenticated users to insert their own profile during signup
-- When a user signs up with Supabase Auth, auth.uid() will be their new user ID
CREATE POLICY users_insert_own ON users 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Artisans table: Allow artisans to insert their own profile
CREATE POLICY artisans_insert_own ON artisans 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = id 
  AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'artisan')
);

-- Clients table: Allow clients to insert their own profile
CREATE POLICY clients_insert_own ON clients 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = id 
  AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'client')
);

-- Admins table: Allow admins to insert their own profile
CREATE POLICY admins_insert_own ON admins 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = id 
  AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
);

-- Wallets table: Allow artisans to insert their own wallet
CREATE POLICY wallets_insert_own ON wallets 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = artisan_id 
  AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'artisan')
);

-- ========================================
-- ✅ INSERT POLICIES SUCCESSFULLY ADDED!
-- ========================================
-- Your app should now allow:
-- - User registration (signup)
-- - Artisan profile creation
-- - Client profile creation
-- - Admin profile creation
-- - Wallet creation for artisans
-- 
-- No more "permission denied" errors!
-- ========================================
