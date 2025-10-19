# ⚡ Quick Fix Guide - Get Your App Running NOW

## 🎯 Current Status
✅ Supabase credentials configured in `.env`  
✅ Supabase client fixed in `lib/supabase.ts`  
⏳ Need to set up database and restart app

---

## 🚀 3-Step Quick Start

### Step 1: Set Up Supabase Database (5 minutes)

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/ejjlaccuauzdempjktpt
   ```

2. **Go to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "+ New query"

3. **Copy & Paste This**
   - Open file: `database/schema.sql`
   - Copy ALL contents (Ctrl+A, Ctrl+C)
   - Paste in SQL Editor
   - Click "Run" or press Ctrl+Enter
   - Wait for "Success ✅" message

4. **Verify Tables Created**
   - Click "Table Editor" in left sidebar
   - You should see 14 tables including: users, artisans, clients, missions, etc.

---

### Step 2: Restart Your App (1 minute)

```bash
# Stop the current server (Ctrl+C if running)

# Clear cache and restart
npx expo start --clear
```

**What you should see in console:**
```
🔧 Supabase Config Check:
  URL: ✅ Set
  Key: ✅ Set
```

✅ **If you see the checkmarks, Supabase is connected!**

❌ **If you see "Missing", the env vars aren't loaded - restart again**

---

### Step 3: Test the App (2 minutes)

1. **Open the app** (scan QR code or press `w` for web)

2. **You should see:**
   - Welcome screen with "ArtisanExpress"
   - "Commencer" button at bottom
   - NO red error screens

3. **Try to register:**
   - Click "Commencer"
   - Choose "Client" or "Artisan"
   - Fill in:
     - Email: test@test.com
     - Password: test123456
     - Name: Your Name
   - Click "S'inscrire"

4. **Check if it worked:**
   - Go to [Supabase Auth](https://supabase.com/dashboard/project/ejjlaccuauzdempjktpt/auth/users)
   - You should see your new user!
   - Go to [Table Editor > users](https://supabase.com/dashboard/project/ejjlaccuauzdempjktpt/editor)
   - Your user profile should be there

---

## 🆘 Troubleshooting

### Problem: "supabaseUrl is required"
**Fix:**
```bash
# Make sure .env has these lines (check with cat .env):
EXPO_PUBLIC_SUPABASE_URL=https://ejjlaccuauzdempjktpt.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Then force restart:
npx expo start --clear
```

### Problem: "relation 'users' does not exist"
**Fix:** You haven't run the database schema yet. Go back to Step 1.

### Problem: Hook order error
**Fix:** This should be resolved now. If it persists:
1. Clear cache: `npx expo start --clear`
2. Clear Metro bundler: `rm -rf node_modules/.cache`
3. Restart: `npx expo start --clear`

### Problem: "new row violates row level security"
**Fix:** The RLS policies are too strict for signup. Two options:

**Option A: Disable RLS temporarily** (quick test)
```sql
-- Run in Supabase SQL Editor
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE artisans DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
```

**Option B: Fix the policies** (proper solution)
```sql
-- Run in Supabase SQL Editor
-- Allow new users to insert their own profile
CREATE POLICY users_insert_own ON users 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY artisans_insert_own ON artisans 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY clients_insert_own ON clients 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);
```

---

## ✅ Success Checklist

- [ ] Supabase dashboard shows 14 tables
- [ ] App starts without errors
- [ ] Console shows "✅ Set" for URL and Key
- [ ] Welcome screen loads
- [ ] Can navigate to registration
- [ ] Registration creates user in Supabase
- [ ] Can login with created account

---

## 📚 Next Steps (After Everything Works)

1. **Seed sample data** (optional)
   - Run `database/seed.sql` in SQL Editor
   - Get test accounts to play with

2. **Test features:**
   - Create a mission (as client)
   - View missions (as artisan)
   - Accept mission
   - Chat
   - Payment

3. **Deploy** (when ready)
   - Follow `PHASE_9_DEPLOYMENT_GUIDE.md`

---

## 🎉 That's It!

If all steps work, your app is now:
- ✅ Connected to Supabase
- ✅ Database configured
- ✅ Auth working
- ✅ Ready to use

**Need help?** Check:
- `SUPABASE_SETUP_GUIDE.md` (detailed guide)
- Supabase logs in dashboard
- App console errors
