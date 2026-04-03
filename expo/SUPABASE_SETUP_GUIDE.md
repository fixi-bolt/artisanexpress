# 🚀 Supabase Setup Guide - ArtisanNow

## Current Status
✅ Environment variables configured in `.env`  
✅ Supabase client configured in `lib/supabase.ts`  
✅ Database schema ready in `database/schema.sql`  
⏳ Database needs to be set up in Supabase dashboard

## Your Supabase Credentials
- **URL**: https://ejjlaccuauzdempjktpt.supabase.co
- **Anon Key**: `eyJhbGciOiJ...` (already set in .env)
- **Service Role Key**: `sbp_a5b266...` (already set in .env)

---

## Step 1: Set Up Database Schema

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Login and select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Schema**
   - Copy the entire contents of `database/schema.sql`
   - Paste into the SQL editor
   - Click "Run" button
   - Wait for all tables to be created (should see ✅ Success)

4. **Verify Tables Created**
   - Click "Table Editor" in left sidebar
   - You should see these tables:
     - ✅ users
     - ✅ artisans
     - ✅ clients
     - ✅ admins
     - ✅ payment_methods
     - ✅ missions
     - ✅ transactions
     - ✅ reviews
     - ✅ notifications
     - ✅ chat_messages
     - ✅ subscriptions
     - ✅ wallets
     - ✅ withdrawals
     - ✅ invoices

---

## Step 2: Seed Sample Data (Optional)

To test the app with sample data:

1. **Open SQL Editor** again
2. **Copy contents** of `database/seed.sql`
3. **Run the seed script**
4. This will create:
   - 2 test clients
   - 3 test artisans
   - Several test missions
   - Sample transactions

---

## Step 3: Restart Your App

The environment variables are already set, so you just need to restart:

```bash
# Stop the current Expo server (Ctrl+C)

# Clear cache and restart
npx expo start --clear
```

When the app starts, you should see in the console:
```
🔧 Supabase Config Check:
  URL: ✅ Set
  Key: ✅ Set
```

---

## Step 4: Test Authentication

1. **Register a new account**
   - Open the app
   - Go to Register/Sign Up
   - Create a test account with:
     - Email: test@test.com
     - Password: test123456
     - Name: Test User
     - Type: Client or Artisan

2. **Check Supabase Dashboard**
   - Go to Authentication > Users
   - You should see your new user
   - Go to Table Editor > users
   - Your user profile should be there

3. **Login with the account**
   - Logout
   - Login with the same credentials
   - You should be logged in successfully

---

## Troubleshooting

### Error: "supabaseUrl is required"
**Solution**: 
- Make sure you've restarted with `npx expo start --clear`
- Environment variables need a clean restart to be picked up

### Error: "relation 'users' does not exist"
**Solution**:
- The database schema hasn't been run yet
- Go to Step 1 above and run `database/schema.sql`

### Error: "new row violates row level security policy"
**Solution**:
- This means RLS is enabled (good!) but policies need adjustment
- For testing, you can temporarily disable RLS:
  ```sql
  ALTER TABLE users DISABLE ROW LEVEL SECURITY;
  ALTER TABLE artisans DISABLE ROW LEVEL SECURITY;
  -- etc for other tables
  ```
- Or fix the policies to allow inserts during signup

### Auth Works But User Profile Doesn't Load
**Solution**:
- Check console for errors
- Make sure the `users` table has data
- The AuthContext tries to load from `users`, `artisans`, or `clients` tables
- Verify the user_type matches the table (e.g., 'artisan' user needs row in artisans table)

---

## Next Steps

Once Supabase is working:

1. ✅ Test registration and login
2. ✅ Test creating a mission (for clients)
3. ✅ Test viewing available missions (for artisans)
4. ✅ Test accepting a mission (for artisans)
5. ✅ Test chat functionality
6. ✅ Test payments (with Stripe test keys)

---

## Quick Reference

### Supabase Dashboard Links
- **Project Home**: https://supabase.com/dashboard/project/ejjlaccuauzdempjktpt
- **SQL Editor**: https://supabase.com/dashboard/project/ejjlaccuauzdempjktpt/sql
- **Table Editor**: https://supabase.com/dashboard/project/ejjlaccuauzdempjktpt/editor
- **Authentication**: https://supabase.com/dashboard/project/ejjlaccuauzdempjktpt/auth/users
- **API Settings**: https://supabase.com/dashboard/project/ejjlaccuauzdempjktpt/settings/api

### Test Credentials (after seeding)
- **Client**: client1@test.com / password123
- **Artisan**: artisan1@test.com / password123
- **Admin**: admin@test.com / password123

---

## Support

If you encounter any issues:
1. Check the Supabase logs (Dashboard > Logs)
2. Check the app console for errors
3. Make sure all tables were created successfully
4. Verify RLS policies are correct for your use case
