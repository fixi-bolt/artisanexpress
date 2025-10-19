-- ========================================
-- 🧹 CLEAN UP EXISTING SCHEMA
-- ========================================
-- Run this script first to clean up any existing database objects

-- Drop all policies first
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

-- Drop all triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_artisans_updated_at ON artisans;
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
DROP TRIGGER IF EXISTS update_missions_updated_at ON missions;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON withdrawals;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop all tables in correct order (respecting foreign keys)
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
-- ✅ CLEANUP COMPLETE
-- ========================================
-- Now you can run schema.sql to recreate everything
