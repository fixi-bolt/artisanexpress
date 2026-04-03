# 🔧 Fix Signup JSON Parse Error

## Problem
Getting "JSON Parse error: Unexpected character: o" when trying to create an account.

## Root Cause
The Supabase database has Row Level Security (RLS) enabled, but missing INSERT policies for the `users`, `artisans`, `clients`, and `wallets` tables. This prevents user creation during signup.

## Solution

### Step 1: Run the SQL Fix Script
Go to your Supabase dashboard and execute this SQL:

1. Open https://supabase.com/dashboard
2. Select your project: **ejjlaccuauzdempjktpt**
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy and paste the content from `database/fix-signup-rls.sql`
6. Click **Run** or press `Ctrl+Enter` / `Cmd+Enter`

### Step 2: Verify the Policies

After running the script, verify the policies were created:

```sql
-- Check users table policies
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Check artisans table policies
SELECT * FROM pg_policies WHERE tablename = 'artisans';

-- Check clients table policies  
SELECT * FROM pg_policies WHERE tablename = 'clients';

-- Check wallets table policies
SELECT * FROM pg_policies WHERE tablename = 'wallets';
```

You should see INSERT policies for each table.

### Step 3: Test Signup

1. Restart your Expo app: `npx expo start --clear`
2. Navigate to the auth screen
3. Try to create a new account (Client or Artisan)
4. Check the console logs for detailed signup progress

## Expected Console Logs

When signup is successful, you should see:
```
🔵 Starting signup for: test@example.com client
✅ Auth user created with ID: xxx-xxx-xxx
🔵 Inserting user profile...
✅ User profile created
🔵 Creating client profile...
✅ Client profile created
✅✅✅ User signup complete: test@example.com client
✅ User profile loaded: Test User client
```

## Alternative: Temporary Disable RLS (NOT RECOMMENDED for production)

If you want to test quickly (ONLY for development):

```sql
-- Temporarily disable RLS on specific tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE artisans DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
```

⚠️ **WARNING**: Never disable RLS in production! Always re-enable it after testing.

To re-enable:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artisans ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
```

## What Changed in Code

I updated `contexts/AuthContext.tsx` to properly handle error messages:
- Errors from Supabase are now converted to Error objects with clear messages
- This prevents the "JSON Parse error" that occurs when error objects aren't properly serialized

## Troubleshooting

### Still getting JSON parse errors?
1. Check browser/app console for detailed error logs
2. Verify Supabase credentials in `.env` are correct
3. Make sure the SQL script was executed successfully
4. Try clearing app cache: `npx expo start --clear`

### User created but profile not loaded?
Check that the RLS SELECT policies exist:
```sql
SELECT * FROM pg_policies WHERE tablename = 'users' AND cmd = 'SELECT';
```

### Getting "duplicate key value violates unique constraint"?
The user was partially created. Delete the auth user in Supabase:
1. Go to **Authentication** > **Users** in Supabase dashboard
2. Find and delete the incomplete user
3. Try signup again

## Next Steps

After signup works:
1. Test login functionality
2. Test profile updates
3. Verify all user types (client, artisan, admin)
4. Test on both web and mobile

---

✅ **Your app is now ready for user registration!**
