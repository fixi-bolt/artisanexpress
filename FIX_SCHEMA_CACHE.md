# 🔧 FIX: Schema Cache Error - "Could not find 'photo' column"

## ❌ Problem
Supabase's PostgREST API has a stale schema cache. The `photo` column exists in your database but the API layer doesn't know about it yet.

## ✅ Solution (3 Methods - Try in Order)

### Method 1: Reload Schema via SQL (FASTEST)
1. Go to your Supabase project dashboard
2. Click **SQL Editor**
3. Copy and run this command:
```sql
NOTIFY pgrst, 'reload schema';
```
4. Wait 5 seconds
5. Test signup again ✅

---

### Method 2: Restart PostgREST via Dashboard (RECOMMENDED)
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
2. Scroll to bottom of the page
3. Click **"Restart PostgREST"** or **"Reload Schema"** button
4. Wait 30 seconds
5. Test signup again ✅

---

### Method 3: Full Database Restart (NUCLEAR OPTION)
1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/settings/general
2. Click **"Pause Project"**
3. Wait 1 minute
4. Click **"Resume Project"**
5. Wait 2 minutes for everything to restart
6. Test signup again ✅

---

## 🔍 Why This Happens
Supabase uses PostgREST to expose your database as a REST API. PostgREST caches your database schema for performance. When you modify the schema (add/remove columns), the cache becomes stale.

## 🚀 Quick Test
After reloading, this should work:
```typescript
// This was failing before:
await supabase.from('users').insert({
  id: userId,
  email: 'test@example.com',
  name: 'Test User',
  user_type: 'client',
  phone: null,
  photo: null  // ✅ This column will now be recognized
});
```

## ⚡ Prevention
For future schema changes, always reload the cache immediately:
1. Run your migration SQL
2. Immediately run: `NOTIFY pgrst, 'reload schema';`
3. Or click "Restart PostgREST" in dashboard

---

## 📝 Current Status
Your database schema is correct. The `users` table has these columns:
- ✅ id
- ✅ email
- ✅ name
- ✅ phone
- ✅ photo ← This column EXISTS but cache is stale
- ✅ user_type
- ✅ rating
- ✅ review_count
- ✅ created_at
- ✅ updated_at

The problem is NOT your code or database. It's just the API cache.
