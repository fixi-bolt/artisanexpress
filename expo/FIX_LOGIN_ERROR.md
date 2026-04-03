# 🔧 Fix: "Error loading user profile" Issue

## Problem
You're seeing this error when trying to log in:
```
❌ Error loading user profile: [object Object]
```

## Root Cause
Your users exist in Supabase Auth (authentication), but their profiles don't exist in your `users` table (database), OR the RLS policies are preventing profile access.

## Solution

### Step 1: Update RLS Policies

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**
5. Copy and paste the contents of `database/fix-login-profile-loading.sql`
6. Click **"Run"**
7. You should see **"Success. No rows returned"**

### Step 2: Check Existing Users

After updating the policies, check if your user profiles exist:

1. In Supabase Dashboard, go to **"Authentication" → "Users"**
2. Copy the **User ID** of the user you're trying to log in with
3. Go to **"Table Editor" → "users"** table
4. Search for that User ID

### Step 3: Handle Missing Profiles

#### Option A: Delete Auth User and Sign Up Again (Recommended)
This is the cleanest approach:

1. In Supabase Dashboard, go to **"Authentication" → "Users"**
2. Find the user that can't log in
3. Click the **three dots** (⋮) next to the user
4. Click **"Delete user"**
5. In your app, **sign up again** with the same email

#### Option B: Create Profile Manually (Advanced)
If you want to keep the auth user, create the profile manually:

1. Go to **"SQL Editor"** in Supabase
2. Run this query (replace the values):

```sql
-- Replace these values with actual data
INSERT INTO users (id, email, name, user_type, phone, photo)
VALUES (
  'PASTE_USER_ID_HERE',  -- Get from Authentication → Users
  'user@example.com',     -- User's email
  'User Name',            -- User's name
  'client',               -- or 'artisan' or 'admin'
  '+1234567890',         -- Optional phone
  NULL                    -- Optional photo URL
);

-- If user is a client, also create client profile:
INSERT INTO clients (id)
VALUES ('PASTE_USER_ID_HERE');

-- OR if user is an artisan, create artisan profile:
INSERT INTO artisans (id, category, hourly_rate, travel_fee, intervention_radius, specialties)
VALUES (
  'PASTE_USER_ID_HERE',
  'Plombier',  -- Category
  50,          -- Hourly rate
  25,          -- Travel fee
  20,          -- Intervention radius
  ARRAY['Réparation', 'Installation']  -- Specialties
);

-- And create wallet for artisan:
INSERT INTO wallets (artisan_id, balance, pending_balance, total_earnings, total_withdrawals)
VALUES ('PASTE_USER_ID_HERE', 0, 0, 0, 0);
```

### Step 4: Test Login

1. Open your app
2. Try logging in with the email and password
3. Check the console logs for detailed error messages
4. You should now see:
   ```
   ✅✅✅ User profile fully loaded: [Name] [Type]
   ```

## Prevention

To prevent this issue in the future, make sure:

1. ✅ RLS policies are correctly set up (Step 1 above)
2. ✅ The signup process creates all required profiles
3. ✅ Email verification is disabled (or handled properly)

## Still Having Issues?

Check the console logs in your app. With the improved error logging, you should now see:
- Error message
- Error code
- Error details
- Full error object

This will help identify the exact issue.

## Common Error Codes

- **42501**: Permission denied - RLS policy blocking access
- **PGRST116**: Row not found - User profile doesn't exist in database
- **23503**: Foreign key violation - Related table entry missing
