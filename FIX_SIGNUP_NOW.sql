-- ========================================
-- 🔧 URGENT FIX: SIGNUP PERMISSION ERROR
-- ========================================
-- This script adds missing INSERT policies to allow user registration
-- 
-- INSTRUCTIONS:
-- 1. Go to your Supabase dashboard: https://supabase.com/dashboard
-- 2. Select your project
-- 3. Click on "SQL Editor" in the left sidebar
-- 4. Click "New Query"
-- 5. Copy and paste this ENTIRE file
-- 6. Click "Run" button
-- 7. You should see "Success. No rows returned"
-- 8. Try signing up again in your app!
--
-- ========================================

-- Drop existing INSERT policies if they exist
DROP POLICY IF EXISTS users_insert_own ON users;
DROP POLICY IF EXISTS artisans_insert_own ON artisans;
DROP POLICY IF EXISTS clients_insert_own ON clients;
DROP POLICY IF EXISTS wallets_insert_own ON wallets;

-- Users: Allow insert for authenticated users (during signup)
-- The auth.uid() will match the new user's ID from Supabase Auth
CREATE POLICY users_insert_own ON users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Artisans: Allow insert for own profile
CREATE POLICY artisans_insert_own ON artisans 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Clients: Allow insert for own profile
CREATE POLICY clients_insert_own ON clients 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Wallets: Allow insert for own wallet (artisans only)
CREATE POLICY wallets_insert_own ON wallets 
FOR INSERT 
WITH CHECK (auth.uid() = artisan_id);

-- ========================================
-- ✅ FIX APPLIED SUCCESSFULLY!
-- ========================================
-- Your app should now allow user registration
-- without "permission denied" errors
-- ========================================
