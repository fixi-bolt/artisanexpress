-- ========================================
-- 🔧 FIX: LOGIN PROFILE LOADING ISSUE
-- ========================================
-- This script fixes the "Error loading user profile" issue
-- that occurs after successful login
--
-- Run this in your Supabase SQL Editor
-- ========================================

-- Step 1: Check if SELECT policies exist for reading user profiles
-- Drop existing SELECT policies and recreate them properly

DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS artisans_select_own ON artisans;
DROP POLICY IF EXISTS clients_select_own ON clients;
DROP POLICY IF EXISTS admins_select_own ON admins;
DROP POLICY IF EXISTS payment_methods_select_own ON payment_methods;

-- ========================================
-- 📖 SELECT POLICIES (Read Access)
-- ========================================

-- Users: Allow users to read their own profile
CREATE POLICY users_select_own ON users 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Artisans: Allow reading own artisan profile
CREATE POLICY artisans_select_own ON artisans 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Clients: Allow reading own client profile
CREATE POLICY clients_select_own ON clients 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Admins: Allow reading own admin profile
CREATE POLICY admins_select_own ON admins 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Payment methods: Allow clients to read their own payment methods
CREATE POLICY payment_methods_select_own ON payment_methods 
FOR SELECT 
TO authenticated
USING (auth.uid() = client_id);

-- ========================================
-- 🔍 DIAGNOSTIC QUERY
-- ========================================
-- After running this script, you can check if a user profile exists
-- by running this query (replace 'YOUR_USER_ID' with actual user ID):
--
-- SELECT * FROM users WHERE id = 'YOUR_USER_ID';
--
-- If no rows are returned, the user exists in auth but not in the users table
-- You'll need to either:
-- 1. Create the user profile manually
-- 2. Delete the auth user and sign up again
-- ========================================

-- ========================================
-- ✅ POLICIES UPDATED!
-- ========================================
-- Now try logging in again. 
-- Check the console logs to see detailed error messages.
-- ========================================
