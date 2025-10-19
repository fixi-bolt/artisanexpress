# 🔧 Fix: Trigger Already Exists Error

## Problem
You're getting: `ERROR: 42710: trigger "update_users_updated_at" for relation "users" already exists`

This happens when you try to run the schema script multiple times.

## Solution (2 Options)

### Option 1: Clean Installation (RECOMMENDED)
Run these scripts in Supabase SQL Editor in this exact order:

1. **First**, run `database/clean-install.sql`
   - This drops all existing triggers, policies, indexes, tables, and functions
   - ⚠️ **WARNING**: This will delete all your data!

2. **Then**, run `database/schema-optimized.sql`
   - This recreates everything fresh with the optimized schema

### Option 2: Quick Fix (Skip existing triggers)
If you want to keep your data and just fix the trigger issue:

```sql
-- Drop only the problematic triggers
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

-- Now recreate the function and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_artisans_updated_at BEFORE UPDATE ON artisans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON missions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON withdrawals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Steps to Execute

### For Supabase Dashboard:

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the SQL from the option you chose above
5. Click **Run** or press `Ctrl/Cmd + Enter`

## Verification

After running the script, verify everything is working:

```sql
-- Check if triggers exist
SELECT 
  trigger_name, 
  event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

You should see all the `update_*_updated_at` triggers listed.

## Need Help?

If you still get errors, check:
- ✅ Make sure you're connected to the correct Supabase project
- ✅ Make sure you have admin privileges
- ✅ Run the clean install script first if tables have structural issues
