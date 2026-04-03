# 🔧 FIX: User Profile Missing Error

## Problem
User exists in Supabase Auth but not in the `users` table.
Error: `User profile not found. Please contact support.`

## Solution

### Step 1: Run the SQL Fix Script

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `nkxucjhavjfsogzpitry`
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the entire content from: `database/FIX_MISSING_USER_FINAL.sql`
6. Click **Run** (or press Cmd+Enter / Ctrl+Enter)

### Step 2: Verify the Fix

After running the script, you should see:
- ✅ User profile created in users table
- ✅ Client profile created
- ✅✅✅ User setup complete!

### Step 3: Test the App

1. Refresh your app
2. The login should now work without errors
3. The user profile should load correctly

## What This Does

1. **Creates the missing user profile** for user ID `a52ede25-7947-48cb-9c3b-5ae865a6d8a0`
2. **Creates a trigger** that automatically creates user profiles when new users sign up
3. **Sets proper permissions** so the app can create and read user data
4. **Verifies** that everything is working

## Prevention

The trigger `on_auth_user_created` will now automatically:
- Create a `users` table entry when someone signs up
- Create a `clients` table entry by default
- Prevent this error from happening again

## If It Still Doesn't Work

1. **Clear your app cache**:
   - On web: Clear browser cache and refresh
   - On mobile: Close and reopen the app

2. **Check Supabase logs**:
   - Go to Supabase Dashboard
   - Click on "Logs" in the left sidebar
   - Look for any errors

3. **Restart Supabase** (if needed):
   - Go to Project Settings → General
   - Scroll to "Pause project" section
   - Pause and unpause the project

## Need More Help?

If the error persists, check:
- Is the user ID correct? `a52ede25-7947-48cb-9c3b-5ae865a6d8a0`
- Does the user exist in `auth.users`?
- Are there any RLS policy errors?

Run this query to check:
```sql
SELECT * FROM auth.users WHERE id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0';
SELECT * FROM users WHERE id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0';
SELECT * FROM clients WHERE id = 'a52ede25-7947-48cb-9c3b-5ae865a6d8a0';
```
