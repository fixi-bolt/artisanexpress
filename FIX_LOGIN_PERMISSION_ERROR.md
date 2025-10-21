# 🔧 Fix: Permission Denied Error

## Problem
You're getting this error when trying to sign up or login:
```
❌ Error loading user profile: permission denied for table users
```

## Root Cause
The Supabase database is missing **INSERT policies** that allow users to create their profiles during signup.

## Solution

### Step 1: Run the SQL Fix

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy the Fix Script**
   - Open the file: `database/FIX_RLS_INSERT_POLICIES.sql`
   - Copy ALL the content

4. **Run the Script**
   - Paste it into the SQL Editor
   - Click "Run" button
   - You should see: **"Success. No rows returned"**

### Step 2: Test Signup

1. **Clear old test accounts (optional)**
   - In Supabase Dashboard, go to "Authentication" > "Users"
   - Delete any test accounts you created

2. **Try signing up again**
   - Open your app
   - Try creating a new account
   - It should work now! ✅

## What This Fix Does

The SQL script adds these missing policies:
- ✅ `users_insert_own` - Allows users to create their profile
- ✅ `artisans_insert_own` - Allows artisans to create their profile
- ✅ `clients_insert_own` - Allows clients to create their profile  
- ✅ `wallets_insert_own` - Allows artisans to create their wallet

## Verification

After running the fix, you should be able to:
1. ✅ Sign up as a new client
2. ✅ Sign up as a new artisan
3. ✅ Login with existing accounts
4. ✅ See your profile load correctly

## Still Having Issues?

If you still see errors after running the fix:

1. **Check the Supabase logs**
   - Go to Supabase Dashboard > Logs
   - Look for any error messages

2. **Verify the policies were created**
   - Go to Supabase Dashboard > Database > Policies
   - Check that you see the new INSERT policies

3. **Clear app cache**
   - Stop your app
   - Run: `npx expo start --clear`

## Need Help?

If the issue persists, share:
- The exact error message from console logs
- Screenshot of your Supabase policies page
