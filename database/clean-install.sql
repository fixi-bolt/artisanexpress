-- ========================================
-- 🗄️ ARTISANNOW - CLEAN INSTALLATION SCRIPT
-- ========================================
-- This script safely drops and recreates all database objects
-- Run this in Supabase SQL Editor when you get "already exists" errors
-- ========================================

-- ========================================
-- 🧹 STEP 1: DROP EXISTING TRIGGERS
-- ========================================
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_artisans_updated_at ON artisans;
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
DROP TRIGGER IF EXISTS update_missions_updated_at ON missions;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON withdrawals;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;

-- ========================================
-- 🧹 STEP 2: DROP EXISTING POLICIES
-- ========================================
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS artisans_select_all ON artisans;
DROP POLICY IF EXISTS artisans_update_own ON artisans;
DROP POLICY IF EXISTS clients_select_own ON clients;
DROP POLICY IF EXISTS clients_update_own ON clients;
DROP POLICY IF EXISTS payment_methods_own ON payment_methods;
DROP POLICY IF EXISTS missions_select_client ON missions;
DROP POLICY IF EXISTS missions_insert_client ON missions;
DROP POLICY IF EXISTS missions_update_own ON missions;
DROP POLICY IF EXISTS transactions_select_own ON transactions;
DROP POLICY IF EXISTS reviews_select_all ON reviews;
DROP POLICY IF EXISTS reviews_insert_own ON reviews;
DROP POLICY IF EXISTS notifications_own ON notifications;
DROP POLICY IF EXISTS chat_messages_select_own ON chat_messages;
DROP POLICY IF EXISTS chat_messages_insert_own ON chat_messages;
DROP POLICY IF EXISTS subscriptions_own ON subscriptions;
DROP POLICY IF EXISTS wallets_own ON wallets;
DROP POLICY IF EXISTS withdrawals_own ON withdrawals;
DROP POLICY IF EXISTS invoices_select_own ON invoices;
DROP POLICY IF EXISTS audit_logs_admin_only ON audit_logs;

-- ========================================
-- 🧹 STEP 3: DROP EXISTING INDEXES
-- ========================================
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_type;
DROP INDEX IF EXISTS idx_artisans_category;
DROP INDEX IF EXISTS idx_artisans_available;
DROP INDEX IF EXISTS idx_artisans_location;
DROP INDEX IF EXISTS idx_payment_methods_client;
DROP INDEX IF EXISTS idx_missions_client;
DROP INDEX IF EXISTS idx_missions_artisan;
DROP INDEX IF EXISTS idx_missions_status;
DROP INDEX IF EXISTS idx_missions_category;
DROP INDEX IF EXISTS idx_missions_created;
DROP INDEX IF EXISTS idx_transactions_mission;
DROP INDEX IF EXISTS idx_transactions_client;
DROP INDEX IF EXISTS idx_transactions_artisan;
DROP INDEX IF EXISTS idx_transactions_status;
DROP INDEX IF EXISTS idx_reviews_mission;
DROP INDEX IF EXISTS idx_reviews_to_user;
DROP INDEX IF EXISTS idx_notifications_user;
DROP INDEX IF EXISTS idx_notifications_read;
DROP INDEX IF EXISTS idx_notifications_created;
DROP INDEX IF EXISTS idx_chat_messages_mission;
DROP INDEX IF EXISTS idx_chat_messages_sender;
DROP INDEX IF EXISTS idx_chat_messages_created;
DROP INDEX IF EXISTS idx_subscriptions_artisan;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_wallets_artisan;
DROP INDEX IF EXISTS idx_withdrawals_wallet;
DROP INDEX IF EXISTS idx_withdrawals_artisan;
DROP INDEX IF EXISTS idx_withdrawals_status;
DROP INDEX IF EXISTS idx_invoices_mission;
DROP INDEX IF EXISTS idx_invoices_client;
DROP INDEX IF EXISTS idx_invoices_artisan;
DROP INDEX IF EXISTS idx_invoices_status;
DROP INDEX IF EXISTS idx_audit_logs_user;
DROP INDEX IF EXISTS idx_audit_logs_entity;
DROP INDEX IF EXISTS idx_audit_logs_created;

-- ========================================
-- 🧹 STEP 4: DROP EXISTING TABLES (in correct order)
-- ========================================
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS withdrawals CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS missions CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS artisans CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ========================================
-- 🧹 STEP 5: DROP FUNCTIONS
-- ========================================
DROP FUNCTION IF EXISTS update_updated_at_column();

-- ========================================
-- ✅ NOW RUN THE MAIN SCHEMA
-- ========================================
-- After running this script successfully, 
-- run database/schema-optimized.sql to recreate everything fresh
-- ========================================
