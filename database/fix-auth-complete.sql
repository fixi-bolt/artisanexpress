-- ========================================
-- COMPLETE AUTH FIX FOR SIGNUP
-- ========================================
-- This script fixes all RLS policies to allow proper user registration

-- First, let's make sure we have the INSERT policies
DROP POLICY IF EXISTS users_insert_own ON users;
DROP POLICY IF EXISTS artisans_insert_own ON artisans;
DROP POLICY IF EXISTS clients_insert_own ON clients;
DROP POLICY IF EXISTS wallets_insert_own ON wallets;

-- Users: Allow insert for authenticated users (during signup)
-- The auth.uid() will be the new user's ID from Supabase Auth
CREATE POLICY users_insert_own ON users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Artisans: Allow insert for own profile
CREATE POLICY artisans_insert_own ON artisans FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Clients: Allow insert for own profile
CREATE POLICY clients_insert_own ON clients FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Wallets: Allow insert for own wallet
CREATE POLICY wallets_insert_own ON wallets FOR INSERT 
WITH CHECK (auth.uid() = artisan_id);

-- ========================================
-- ✅ COMPLETE AUTH FIX APPLIED
-- ========================================

-- To apply this fix:
-- 1. Go to your Supabase dashboard
-- 2. Click on "SQL Editor"
-- 3. Copy and paste this entire file
-- 4. Click "Run"
