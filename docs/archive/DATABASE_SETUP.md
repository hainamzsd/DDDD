# Database Setup Guide - LocationID Tracker

This guide will walk you through setting up the complete Supabase database for the LocationID Tracker application.

## Prerequisites

- [ ] Supabase account (sign up at https://supabase.com)
- [ ] Project created in Supabase
- [ ] Supabase URL and anon key (from project settings)

---

## Step 1: Configure Environment Variables

1. **Copy the `.env` file structure:**

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

2. **Get your credentials:**
   - Go to https://app.supabase.com
   - Select your project
   - Go to Settings → API
   - Copy "Project URL" and "anon public" key

3. **Update `.env` file** in the project root with your credentials

---

## Step 2: Create Database Schema

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Open the file `supabase/schema.sql` from this project
5. **Copy the entire contents** and paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. Wait for completion (should take 10-15 seconds)

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Run the schema
supabase db push --file supabase/schema.sql
```

### Expected Output

You should see:
```
✅ LocationID Tracker database schema created successfully!

Next steps:
1. Run the seed data script (seed.sql)
2. Create storage bucket "survey-photos" in Supabase Dashboard
3. Create a test user in Authentication
4. Generate TypeScript types
```

---

## Step 3: Insert Seed Data

1. In **SQL Editor**, create another **New Query**
2. Open the file `supabase/seed.sql`
3. **Copy the entire contents** and paste into the SQL Editor
4. Click **Run**

### Expected Output

```
✅ Seed data inserted successfully!

Data inserted:
- 20 object types
- 63 administrative units

Next steps:
1. Create a test user in Supabase Authentication
2. Insert a profile for that user
3. Generate TypeScript types
```

---

## Step 4: Create Storage Bucket

### Create the Bucket

1. Go to **Storage** in the Supabase dashboard
2. Click **New Bucket**
3. Configure:
   - **Name:** `survey-photos`
   - **Public:** ❌ No (private)
   - **File size limit:** 10 MB
   - **Allowed MIME types:** `image/jpeg`, `image/png`, `image/jpg`
4. Click **Create Bucket**

### Add Storage Policies

1. Click on the `survey-photos` bucket
2. Go to **Policies** tab
3. Click **New Policy**
4. Create three policies:

#### Policy 1: Upload Files
```sql
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'survey-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 2: View Files
```sql
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'survey-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 3: Delete Files
```sql
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'survey-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## Step 5: Create Test User

### Create Auth User

1. Go to **Authentication** in Supabase dashboard
2. Click **Add User** → **Create New User**
3. Enter:
   - **Email:** `123456789012@police.gov.vn`
   - **Password:** `Test@123456`
   - **Auto Confirm User:** ✅ Yes
4. Click **Create User**
5. **Copy the User ID** (UUID) that appears

### Create Profile

1. Go back to **SQL Editor**
2. Run this query (replace `YOUR_USER_ID` with the UUID you copied):

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
  'YOUR_USER_ID',  -- Replace with actual user ID
  '123456789012@police.gov.vn',
  'Nguyễn Văn A',
  '0987654321',
  'officer',
  'CA01',
  '00001',  -- Phường Phúc Xá
  '001',    -- Quận Ba Đình
  '01'      -- Hà Nội
);
```

3. Click **Run**

---

## Step 6: Verify Database Setup

Run these verification queries in **SQL Editor**:

### Check Tables
```sql
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected:** Should see 10+ tables including:
- profiles
- survey_locations
- survey_media
- survey_vertices
- ref_object_types
- ref_admin_units

### Check Seed Data
```sql
-- Check object types
SELECT COUNT(*) as object_types_count FROM public.ref_object_types;

-- Check admin units
SELECT COUNT(*) as admin_units_count FROM public.ref_admin_units;

-- Check test profile
SELECT * FROM public.profiles;
```

### Check RLS Policies
```sql
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected:** Should see multiple RLS policies for each table

---

## Step 7: Update TypeScript Types (Optional)

If you have Supabase CLI installed and want the most accurate types:

```bash
# Generate types from your live database
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database-generated.ts
```

**Note:** The existing `types/database.ts` file already has all necessary types, so this step is optional.

---

## Step 8: Test the Connection

### Update `.env` File

Ensure your `.env` file has:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Test in App

1. Start the development server:
```bash
npm start
```

2. Open the app on your device/emulator

3. Try logging in:
   - **ID Number:** `123456789012`
   - **Password:** `Test@123456`

4. ✅ Success! You should see the Dashboard with user info

---

## Troubleshooting

### Issue: "relation does not exist"

**Solution:** The schema wasn't created properly
```bash
# Re-run the schema.sql file in SQL Editor
```

### Issue: "permission denied for table"

**Solution:** RLS policies aren't set up correctly
```bash
# Re-run the RLS policy sections from schema.sql
```

### Issue: Login fails with "Invalid login credentials"

**Solution:** User or profile not created correctly
```sql
-- Check if user exists in auth.users
SELECT id, email FROM auth.users WHERE email = '123456789012@police.gov.vn';

-- Check if profile exists
SELECT * FROM public.profiles;

-- If profile missing, insert it (see Step 5)
```

### Issue: "PostGIS extension not available"

**Solution:** Enable PostGIS extension
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Issue: Type errors in code

**Solution:**
1. Make sure database schema is created
2. Types in `types/database.ts` match the schema
3. Run type check: `npm run type-check`

---

## Verification Checklist

Before moving on, verify:

- [ ] All tables created (10+ tables)
- [ ] RLS policies enabled on all tables
- [ ] Seed data inserted (20 object types, 63 admin units)
- [ ] Storage bucket `survey-photos` created
- [ ] Storage policies added
- [ ] Test user created in Auth
- [ ] Test profile created in profiles table
- [ ] `.env` file updated with credentials
- [ ] App can connect and login successfully

---

## Next Steps

Once database is set up:

1. ✅ Test authentication in the app
2. ✅ Test creating a survey
3. ✅ Test GPS capture
4. ✅ Continue implementing remaining screens

---

## Advanced Configuration

### Add More Administrative Units

To add complete Vietnamese administrative data:

1. Get official data from Vietnamese government sources
2. Format as SQL INSERT statements
3. Run in SQL Editor

Example structure:
```sql
INSERT INTO public.ref_admin_units (code, name, level, parent_code, full_name, short_name)
SELECT * FROM (VALUES
  ('02', 'Hà Giang', 'PROVINCE', NULL, 'Tỉnh Hà Giang', 'Hà Giang'),
  ('04', 'Cao Bằng', 'PROVINCE', NULL, 'Tỉnh Cao Bằng', 'Cao Bằng')
  -- ... more provinces
) AS t(code, name, level, parent_code, full_name, short_name)
ON CONFLICT (code) DO NOTHING;
```

### Performance Optimization

For production use:

```sql
-- Add additional indexes
CREATE INDEX idx_survey_locations_created_at ON public.survey_locations(created_at DESC);
CREATE INDEX idx_survey_media_created_at ON public.survey_media(created_at DESC);

-- Analyze tables
ANALYZE public.survey_locations;
ANALYZE public.survey_media;
```

### Backup Database

```bash
# Using Supabase CLI
supabase db dump -f backup.sql

# Or use Supabase Dashboard → Database → Backups
```

---

## Support

If you encounter issues:

1. Check Supabase logs: Dashboard → Logs → Postgres Logs
2. Check browser console for API errors
3. Verify RLS policies are correct
4. Check that Auth user has matching profile

---

## Summary

You've successfully set up:
- ✅ 10+ PostgreSQL tables with PostGIS
- ✅ Row Level Security policies
- ✅ Reference data (object types, admin units)
- ✅ Storage bucket with policies
- ✅ Test user and profile
- ✅ Full database ready for the app

**The app is now ready to run with full database support!** 🎉
