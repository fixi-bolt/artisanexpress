-- ========================================
-- FIX RLS POLICIES FOR SIGNUP
-- ========================================
-- This script adds missing INSERT policies to allow user registration

-- Drop existing INSERT policies if they exist
DROP POLICY IF EXISTS users_insert_own ON users;
DROP POLICY IF EXISTS artisans_insert_own ON artisans;
DROP POLICY IF EXISTS clients_insert_own ON clients;
DROP POLICY IF EXISTS admins_insert_own ON admins;
DROP POLICY IF EXISTS wallets_insert_own ON wallets;

-- Users: Allow insert for authenticated users (during signup)
CREATE POLICY users_insert_own ON users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Artisans: Allow insert for own profile
CREATE POLICY artisans_insert_own ON artisans FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Clients: Allow insert for own profile
CREATE POLICY clients_insert_own ON clients FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Admins: Allow insert for own profile (only if already admin)
CREATE POLICY admins_insert_own ON admins FOR INSERT 
WITH CHECK (
  auth.uid() = id AND 
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND user_type = 'admin')
);

-- Wallets: Allow insert for own wallet
CREATE POLICY wallets_insert_own ON wallets FOR INSERT 
WITH CHECK (auth.uid() = artisan_id);

-- ========================================
-- ✅ SIGNUP FIX APPLIED
-- ========================================
