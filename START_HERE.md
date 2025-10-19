# 🚀 START HERE - Get ArtisanNow Running in 10 Minutes

**Current Status:** Everything is configured, just need to set up the database!

---

## ⚡ Quick Checklist

### ✅ Step 1: Database Setup (5 minutes)

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard/project/ejjlaccuauzdempjktpt/sql
   - Click the green "+ New query" button

2. **Run Schema**
   - Open file `database/schema.sql` in your code editor
   - Copy everything (Ctrl+A, Ctrl+C)
   - Paste in Supabase SQL Editor
   - Click "Run" button (or Ctrl+Enter)
   - Wait for "Success ✅" message

3. **Verify Tables**
   - Click "Table Editor" in left sidebar
   - You should see 14 tables: users, artisans, clients, missions, etc.
   - ✅ If you see them, you're done!

---

### ✅ Step 2: Start the App (1 minute)

Open your terminal and run:

```bash
npx expo start --clear
```

**Look for this in the console:**
```
🔧 Supabase Config Check:
  URL: ✅ Set
  Key: ✅ Set
```

✅ **Checkmarks mean success!**

---

### ✅ Step 3: Test Registration (3 minutes)

1. **Open the app**
   - Press `w` for web browser
   - OR scan QR code with Expo Go app

2. **Register a test account**
   - Click "Commencer" (Start)
   - Choose "Client" or "Artisan"
   - Fill in:
     - **Email**: test@test.com
     - **Password**: test123456
     - **Name**: Test User
   - Click register button

3. **Verify it worked**
   - Check: https://supabase.com/dashboard/project/ejjlaccuauzdempjktpt/auth/users
   - You should see your new user!

---

## 🆘 If Something Goes Wrong

### Problem 1: "supabaseUrl is required"
**Solution:** Restart with clear cache
```bash
npx expo start --clear
```

### Problem 2: "relation 'users' does not exist"
**Solution:** You skipped Step 1 - go back and run `schema.sql`

### Problem 3: "row level security policy violation"
**Solution:** Run the fix:
1. Go to Supabase SQL Editor
2. Open `database/fix-rls-policies.sql`
3. Copy all and paste in SQL Editor
4. Click "Run"

---

## ✅ Success! What's Next?

Once everything works:

### Test Features:
- ✅ Create a mission (as client)
- ✅ View missions (as artisan)
- ✅ Accept a mission
- ✅ Use the chat
- ✅ Process a payment

### Add Sample Data (Optional):
1. Go to Supabase SQL Editor
2. Open `database/seed.sql`
3. Run it to get test accounts:
   - **Client**: client1@test.com / password123
   - **Artisan**: artisan1@test.com / password123

---

## 📚 More Help?

- **Quick Guide**: `QUICK_FIX_GUIDE.md`
- **Detailed Guide**: `SUPABASE_SETUP_GUIDE.md`
- **Current Status**: `CURRENT_SETUP_STATUS.md`

---

## 🎯 That's It!

Follow the 3 steps above and you'll have a working app in 10 minutes.

**Questions? Check the troubleshooting section or the other guides!** 🚀
