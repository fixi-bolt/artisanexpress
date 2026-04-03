# 🚀 Quick Fix: Signup JSON Parse Error

## The Problem
"JSON Parse error: Unexpected character: o" when creating an account.

## The Solution (2 minutes)

### Step 1: Fix Database Policies (REQUIRED)
Go to Supabase SQL Editor and run this:

```sql
-- Allow users to insert their own profiles during signup
DROP POLICY IF EXISTS users_insert_own ON users;
DROP POLICY IF EXISTS artisans_insert_own ON artisans;
DROP POLICY IF EXISTS clients_insert_own ON clients;
DROP POLICY IF EXISTS wallets_insert_own ON wallets;

CREATE POLICY users_insert_own ON users FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY artisans_insert_own ON artisans FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY clients_insert_own ON clients FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY wallets_insert_own ON wallets FOR INSERT 
WITH CHECK (auth.uid() = artisan_id);
```

### Step 2: Restart Your App
```bash
npx expo start --clear
```

### Step 3: Test Signup
1. Go to auth screen
2. Select Client or Artisan
3. Fill in the form
4. Click "Créer mon compte"

## What Was Fixed

### 1. Database (RLS Policies)
- Added missing INSERT policies for users, artisans, clients, and wallets tables
- Users can now create their own profiles during signup

### 2. Error Handling (Code)
- Updated `contexts/AuthContext.tsx` to properly throw Error objects
- Updated `app/auth.tsx` to show detailed error logs
- Errors are now properly serialized as strings instead of raw objects

## Verify It Works

You should see these logs in console:
```
🔵 Starting signup for: test@example.com client
✅ Auth user created with ID: xxx
✅ User profile created
✅ Client profile created
✅✅✅ User signup complete
```

## If Still Not Working

1. **Check console logs** - Look for the detailed error messages
2. **Verify Supabase config** - Check `.env` has correct SUPABASE_URL and SUPABASE_ANON_KEY
3. **Check SQL execution** - Make sure the SQL ran without errors
4. **Clear cache** - Run `npx expo start --clear` again

## Common Issues

### "new row violates row-level security policy"
→ Run the SQL fix script above

### "duplicate key value violates unique constraint"
→ Delete the partial user in Supabase Auth panel and try again

### "User creation failed"
→ Check the console for detailed error logs

---

✅ **Done! Your signup should now work.**
