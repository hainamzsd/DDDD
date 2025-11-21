# 🚀 Quick Start: Database Setup (15 Minutes)

## Step-by-Step Setup

### 1️⃣ Get Supabase Credentials (2 min)

```
1. Go to https://app.supabase.com
2. Select your project (or create new one)
3. Go to Settings → API
4. Copy:
   - Project URL
   - anon public key
```

### 2️⃣ Update Environment (30 sec)

Edit `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 3️⃣ Create Database Schema (3 min)

```
1. Supabase Dashboard → SQL Editor → New Query
2. Open: supabase/schema.sql
3. Copy all → Paste → Run
4. Wait ~15 seconds
✅ Should see "✅ schema created successfully!"
```

### 4️⃣ Add Seed Data (1 min)

```
1. SQL Editor → New Query
2. Open: supabase/seed.sql
3. Copy all → Paste → Run
✅ Should see "✅ Seed data inserted successfully!"
```

### 5️⃣ Create Storage Bucket (2 min)

```
1. Dashboard → Storage → New Bucket
2. Name: survey-photos
3. Public: NO (unchecked)
4. File size: 10 MB
5. MIME types: image/jpeg, image/png
6. Create Bucket

7. Click bucket → Policies tab
8. New Policy → Paste each policy from DATABASE_SETUP.md Step 4
9. Run all 3 policies (upload, view, delete)
```

### 6️⃣ Create Test User (3 min)

```
1. Dashboard → Authentication → Add User
2. Email: 123456789012@police.gov.vn
3. Password: Test@123456
4. Auto Confirm: YES
5. Create User
6. COPY the User ID (UUID)

7. SQL Editor → New Query → Paste:
```

```sql
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  phone_number,
  role,
  unit_code,
  ward_code,
  district_code,
  province_code
) VALUES (
  'PASTE-USER-ID-HERE',  -- ← Replace this
  '123456789012@police.gov.vn',
  'Nguyễn Văn A',
  '0987654321',
  'officer',
  'CA01',
  '00001',
  '001',
  '01'
);
```

### 7️⃣ Test Connection (1 min)

```bash
npm start
```

Try login:
- **ID:** `123456789012`
- **Password:** `Test@123456`

✅ **Success!** You should see the Dashboard

---

## Verification Commands

Run in SQL Editor to verify:

```sql
-- Check tables (should see 10+)
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check object types (should be 20)
SELECT COUNT(*) FROM ref_object_types;

-- Check admin units (should be 63)
SELECT COUNT(*) FROM ref_admin_units;

-- Check profile created
SELECT * FROM profiles;
```

---

## Troubleshooting

### ❌ Login fails

```sql
-- Check user exists
SELECT id, email FROM auth.users
WHERE email = '123456789012@police.gov.vn';

-- Check profile exists
SELECT * FROM profiles;
```

**Fix:** Re-run Step 6 with correct User ID

### ❌ "relation does not exist"

**Fix:** Re-run Step 3 (schema.sql)

### ❌ "permission denied"

**Fix:** Check RLS policies in schema.sql are created

### ❌ Storage upload fails

**Fix:** Re-run Step 5 storage policies

---

## Quick Reference

| What | Where |
|------|-------|
| Schema | `supabase/schema.sql` |
| Seed Data | `supabase/seed.sql` |
| Full Guide | `DATABASE_SETUP.md` |
| Type Errors | Will resolve after setup |

---

## Next Steps After Setup

1. ✅ TypeScript errors resolved (0 errors)
2. ✅ Continue building screens
3. ✅ Test GPS capture
4. ✅ Test photo upload
5. ✅ Deploy to production

---

**Total Time:** 15 minutes
**Difficulty:** Easy (copy/paste)
**Result:** Fully working app! 🎉
