-- ========================================
-- 🔐 FIX ROW LEVEL SECURITY POLICIES
-- ========================================
-- Run this AFTER running schema.sql if you get RLS errors during signup

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS artisans_update_own ON artisans;
DROP POLICY IF EXISTS clients_select_own ON clients;
DROP POLICY IF EXISTS clients_update_own ON clients;

-- ========================================
-- USERS TABLE POLICIES
-- ========================================

-- Allow new users to insert their own profile during signup
CREATE POLICY users_insert_own ON users 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow users to read their own data
CREATE POLICY users_select_own ON users 
  FOR SELECT 
  USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY users_update_own ON users 
  FOR UPDATE 
  USING (auth.uid() = id);

-- ========================================
-- ARTISANS TABLE POLICIES
-- ========================================

-- Allow new artisans to insert their profile during signup
CREATE POLICY artisans_insert_own ON artisans 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Everyone can read artisan profiles (for browsing)
CREATE POLICY artisans_select_all ON artisans 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Only artisan can update their own profile
CREATE POLICY artisans_update_own ON artisans 
  FOR UPDATE 
  USING (auth.uid() = id);

-- ========================================
-- CLIENTS TABLE POLICIES
-- ========================================

-- Allow new clients to insert their profile during signup
CREATE POLICY clients_insert_own ON clients 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow clients to read their own data
CREATE POLICY clients_select_own ON clients 
  FOR SELECT 
  USING (auth.uid() = id);

-- Allow clients to update their own data
CREATE POLICY clients_update_own ON clients 
  FOR UPDATE 
  USING (auth.uid() = id);

-- ========================================
-- ADMINS TABLE POLICIES
-- ========================================

-- Allow new admins to insert their profile
CREATE POLICY admins_insert_own ON admins 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow admins to read their own data
CREATE POLICY admins_select_own ON admins 
  FOR SELECT 
  USING (auth.uid() = id);

-- ========================================
-- WALLETS TABLE POLICIES
-- ========================================

-- Allow new artisans to insert their wallet during signup
CREATE POLICY wallets_insert_own ON wallets 
  FOR INSERT 
  WITH CHECK (auth.uid() = artisan_id);

-- ========================================
-- ✅ RLS POLICIES FIXED
-- ========================================
-- Now signup should work correctly!
