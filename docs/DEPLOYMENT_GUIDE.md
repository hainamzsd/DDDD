# LocationID Tracker (C06) - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the LocationID Tracker mobile application to production. It covers Supabase backend setup, database migrations, reference data seeding, storage configuration, mobile app builds, and user acceptance testing preparation.

**Target Audience:** DevOps engineers, System administrators, Project managers

**Prerequisites:**
- Access to Supabase account with project creation permissions
- Node.js 18+ and npm installed
- Expo CLI installed (`npm install -g expo-cli`)
- EAS CLI installed (`npm install -g eas-cli`)
- Git access to the repository
- Android/iOS development certificates (for app store distribution)

---

## Table of Contents

1. [Pre-Deployment Checklist](#1-pre-deployment-checklist)
2. [Supabase Project Setup](#2-supabase-project-setup)
3. [Database Migration](#3-database-migration)
4. [Reference Data Seeding](#4-reference-data-seeding)
5. [Storage Configuration](#5-storage-configuration)
6. [Authentication Setup](#6-authentication-setup)
7. [Environment Configuration](#7-environment-configuration)
8. [Mobile App Build](#8-mobile-app-build)
9. [User Acceptance Testing Setup](#9-user-acceptance-testing-setup)
10. [Production Monitoring](#10-production-monitoring)
11. [Rollback Procedures](#11-rollback-procedures)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript compilation errors resolved (`npm run type-check`)
- [ ] All tests passing (222/222 tests)
- [ ] Code review completed (see `docs/CODE_REVIEW.md`)
- [ ] No security vulnerabilities in dependencies (`npm audit`)

### Documentation
- [ ] CLAUDE.md updated with latest architecture
- [ ] API documentation current (`docs/API_DOCUMENTATION.md`)
- [ ] Data model documented (`docs/DATA_MODEL.md`)
- [ ] Compliance requirements reviewed (`docs/COMPLIANCE_REQUIREMENTS.md`)

### Legal & Compliance
- [ ] Data privacy policy reviewed by legal counsel (`docs/DATA_PRIVACY_POLICY.md`)
- [ ] Regulatory compliance verified (`docs/CADASTRAL_REGULATIONS.md`)
- [ ] Data processing agreements signed (if using Supabase Singapore)
- [ ] User consent forms prepared (Vietnamese language)

### Infrastructure
- [ ] Supabase account created and payment method added
- [ ] Domain name registered (if using custom domain)
- [ ] SSL certificates obtained
- [ ] Backup strategy defined
- [ ] Disaster recovery plan documented

### Team Readiness
- [ ] DevOps team trained on deployment procedures
- [ ] Support team briefed on common issues
- [ ] UAT participants identified (commune police officers)
- [ ] Escalation procedures documented

---

## 2. Supabase Project Setup

### 2.1 Create New Project

1. **Log in to Supabase Dashboard:**
   - Go to https://app.supabase.com
   - Sign in with your account

2. **Create New Organization (if needed):**
   - Click "New Organization"
   - Name: "Vietnamese Police Department" (or appropriate name)
   - Select billing plan (Pro recommended for production)

3. **Create New Project:**
   - Click "New Project"
   - Name: `locationid-tracker-prod`
   - Database Password: Generate strong password (save to password manager)
   - Region: **Singapore (Southeast Asia)** (closest to Vietnam for low latency)
   - Pricing Plan: Pro ($25/month) or Team ($599/month for production)

4. **Wait for Project Initialization:**
   - Takes 2-3 minutes
   - Database, API, and Storage will be provisioned automatically

### 2.2 Note Critical Information

Save these values securely (you'll need them for environment configuration):

```
Project URL: https://[project-id].supabase.co
Anon (public) Key: eyJhbGc...
Service Role Key: eyJhbGc... (keep secret!)
Database Password: [generated password]
Database Host: db.[project-id].supabase.co
Database Port: 5432
Database Name: postgres
```

**Security Note:** Never commit the Service Role Key to version control. Use environment variables or secret management systems.

### 2.3 Enable PostGIS Extension

1. **Go to Database > Extensions:**
   - Click "Database" in left sidebar
   - Click "Extensions" tab
   - Search for "postgis"
   - Click "Enable" next to PostGIS

2. **Verify Installation:**
   - Go to SQL Editor
   - Run: `SELECT PostGIS_Version();`
   - Should return version (e.g., "3.3 USE_GEOS=1 USE_PROJ=1")

### 2.4 Configure Database Settings

1. **Set Timezone to Vietnam:**
   ```sql
   ALTER DATABASE postgres SET timezone TO 'Asia/Ho_Chi_Minh';
   ```

2. **Enable UUID Extension:**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

3. **Configure Connection Pooling:**
   - Go to Database > Settings
   - Set Max Connections: 100 (adjust based on expected load)
   - Enable Connection Pooler (for production scalability)

---

## 3. Database Migration

### 3.1 Run Main Schema Migration

1. **Open SQL Editor in Supabase Dashboard:**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

2. **Copy Schema SQL:**
   - Open `supabase/schema.sql` in the repository
   - Copy entire contents

3. **Execute Migration:**
   - Paste SQL into editor
   - Click "Run" button
   - Verify success (should see "Success. No rows returned")

4. **Verify Tables Created:**
   ```sql
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   ```

   Expected tables:
   - profiles
   - survey_missions
   - survey_locations
   - survey_media
   - survey_vertices
   - ref_object_types
   - ref_land_use_types
   - ref_admin_units

### 3.2 Run Cadastral Versions Migration

1. **Open New Query:**
   - SQL Editor > New Query

2. **Copy Migration SQL:**
   - Open `supabase/migration-cadastral-versions.sql`
   - Copy entire contents

3. **Execute Migration:**
   - Paste and run
   - Verify `ref_cadastral_versions` table created

### 3.3 Verify Schema

1. **Check Table Structure:**
   ```sql
   -- Verify survey_locations has all required fields
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'survey_locations'
   ORDER BY ordinal_position;
   ```

2. **Check Spatial Columns:**
   ```sql
   -- Verify PostGIS columns
   SELECT f_table_name, f_geometry_column, type, srid
   FROM geometry_columns
   WHERE f_table_schema = 'public';
   ```

   Expected:
   - survey_locations.gps_point (Point, 4326)
   - survey_locations.rough_area (Polygon, 4326)

3. **Check Indexes:**
   ```sql
   SELECT tablename, indexname, indexdef
   FROM pg_indexes
   WHERE schemaname = 'public'
   ORDER BY tablename;
   ```

4. **Check RLS Policies:**
   ```sql
   SELECT tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies
   WHERE schemaname = 'public';
   ```

### 3.4 Create Database Functions

Verify the `generate_location_identifier()` function exists:

```sql
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'generate_location_identifier';
```

If not present, it should have been created by `schema.sql`. Check for errors in migration logs.

---

## 4. Reference Data Seeding

### 4.1 Seed Administrative Units

**Option A: Use Seed File (Recommended for production)**

1. **Open SQL Editor:**
   - New Query in Supabase Dashboard

2. **Run Admin Units Seed:**
   - Open `supabase/seed-admin-units.sql`
   - Copy entire contents
   - Paste and run in SQL Editor
   - This populates provinces, districts, and communes

3. **Verify Data:**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE level = 'province') as provinces,
     COUNT(*) FILTER (WHERE level = 'district') as districts,
     COUNT(*) FILTER (WHERE level = 'commune') as communes
   FROM ref_admin_units;
   ```

   Expected counts:
   - Provinces: 63
   - Districts: ~700+
   - Communes: ~10,000+

**Option B: Fetch from API (Alternative)**

If you need to refresh from latest government data:

```bash
# From project root
cd scripts
node fetch-admin-units.js
```

This will:
1. Fetch latest data from provinces.open-api.vn
2. Generate SQL insert statements
3. Save to `supabase/seed-admin-units.sql`
4. Upload to Supabase automatically (if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set)

See `QUICK_START_ADMIN_UNITS.md` for detailed instructions.

### 4.2 Seed Land Use Types

1. **Open SQL Editor:**
   - New Query in Supabase Dashboard

2. **Run Land Use Types Seed:**
   - Open `supabase/seed-land-use-types-official.sql`
   - Copy entire contents
   - Paste and run

3. **Verify Official Codes:**
   ```sql
   SELECT category, code, name_vi
   FROM ref_land_use_types
   WHERE is_active = true
   ORDER BY category, code;
   ```

   Should see official codes:
   - NNG.LUA (Đất lúa nước)
   - PNN.DO.TT (Đất ở tại đô thị)
   - CSD.RST (Đất rừng sản xuất)
   - etc.

4. **Verify Category Distribution:**
   ```sql
   SELECT category, COUNT(*) as count
   FROM ref_land_use_types
   WHERE is_active = true
   GROUP BY category
   ORDER BY category;
   ```

   Expected categories:
   - NNG (Nông nghiệp): ~8 types
   - PNN (Phi nông nghiệp): ~30 types
   - CSD (Chưa sử dụng): ~5 types

### 4.3 Seed Object Types

1. **Open SQL Editor:**
   - New Query

2. **Insert Common Object Types:**
   ```sql
   INSERT INTO ref_object_types (code, name_vi, name_en, description, is_active) VALUES
     ('NHA_O', 'Nhà ở', 'Residential House', 'Nhà ở của hộ gia đình', true),
     ('CONG_SO', 'Công sở', 'Office Building', 'Tòa nhà văn phòng', true),
     ('CUA_HANG', 'Cửa hàng', 'Shop', 'Cửa hàng kinh doanh', true),
     ('NHA_XUONG', 'Nhà xưởng', 'Factory', 'Nhà xưởng sản xuất', true),
     ('TRUONG_HOC', 'Trường học', 'School', 'Cơ sở giáo dục', true),
     ('BENH_VIEN', 'Bệnh viện', 'Hospital', 'Cơ sở y tế', true),
     ('COT_DIEN', 'Cột điện', 'Electric Pole', 'Cột điện lực', true),
     ('CUM_DAU', 'Cụm đầu', 'Utility Pole Cluster', 'Cụm cột điện/nước', true),
     ('TUONG_RAO', 'Tường rào', 'Fence', 'Tường rào ranh giới', true),
     ('DUONG_PHAN_LO', 'Đường phân lô', 'Internal Road', 'Đường nội bộ phân lô', true)
   ON CONFLICT (code) DO NOTHING;
   ```

3. **Verify:**
   ```sql
   SELECT code, name_vi, name_en FROM ref_object_types WHERE is_active = true;
   ```

### 4.4 Create Initial Cadastral Version

1. **Insert Version Record:**
   ```sql
   INSERT INTO ref_cadastral_versions (version, release_date, description, source, change_count)
   VALUES (
     '1.0.0',
     '2025-01-15',
     'Dữ liệu danh mục địa chính ban đầu theo Luật Đất đai 2013 và Thông tư 02/2015/TT-BTNMT',
     'Bộ Tài nguyên và Môi trường',
     47
   )
   ON CONFLICT (version) DO NOTHING;
   ```

2. **Update Land Use Types with Version:**
   ```sql
   UPDATE ref_land_use_types
   SET version = '1.0.0'
   WHERE version IS NULL;
   ```

3. **Verify:**
   ```sql
   SELECT version, release_date, description, change_count
   FROM ref_cadastral_versions
   ORDER BY release_date DESC
   LIMIT 1;
   ```

---

## 5. Storage Configuration

### 5.1 Create Storage Bucket

1. **Go to Storage in Supabase Dashboard:**
   - Click "Storage" in left sidebar
   - Click "Create a new bucket"

2. **Configure Bucket:**
   - Name: `survey-photos`
   - Public: **No** (private bucket with RLS)
   - File size limit: 10 MB
   - Allowed MIME types: `image/jpeg`, `image/png`
   - Click "Create bucket"

### 5.2 Set Up Storage Policies

1. **Go to Storage > Policies:**
   - Select `survey-photos` bucket
   - Click "New Policy"

2. **Policy: Allow Users to Upload Their Own Photos**
   ```sql
   -- Policy Name: Users can upload their own photos
   CREATE POLICY "Users can upload their own photos"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (
     bucket_id = 'survey-photos' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

3. **Policy: Allow Users to View Their Own Photos**
   ```sql
   -- Policy Name: Users can view their own photos
   CREATE POLICY "Users can view their own photos"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (
     bucket_id = 'survey-photos' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

4. **Policy: Allow Users to Delete Their Own Photos**
   ```sql
   -- Policy Name: Users can delete their own photos
   CREATE POLICY "Users can delete their own photos"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (
     bucket_id = 'survey-photos' AND
     auth.uid()::text = (storage.foldername(name))[1]
   );
   ```

**Note:** Photos are organized by user ID: `photos/{user_id}/{survey_id}/{timestamp}.jpg`

### 5.3 Configure Storage Limits

1. **Go to Storage Settings:**
   - Click "Settings" in Storage section

2. **Set Quotas:**
   - Max file size: 10 MB (good for high-res photos)
   - Total storage: Start with 10 GB, scale as needed
   - Enable automatic cleanup of orphaned files (optional)

### 5.4 Test Storage Access

1. **Upload Test File:**
   ```javascript
   // Run in browser console on Supabase dashboard
   const { data, error } = await supabase.storage
     .from('survey-photos')
     .upload('test/test.jpg', new Blob(['test']), {
       contentType: 'image/jpeg'
     });
   console.log(data, error);
   ```

2. **Verify File Exists:**
   ```sql
   SELECT name, metadata, created_at
   FROM storage.objects
   WHERE bucket_id = 'survey-photos'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

---

## 6. Authentication Setup

### 6.1 Configure Auth Settings

1. **Go to Authentication > Settings:**
   - Click "Authentication" in left sidebar
   - Click "Settings" tab

2. **Configure Email Auth:**
   - Enable Email provider: **Yes**
   - Disable "Confirm email": **No** (since we're using synthetic emails)
   - Session timeout: 7 days (604800 seconds)
   - Refresh token rotation: **Enabled**

3. **Configure Password Requirements:**
   - Minimum length: 8 characters
   - Require uppercase: Yes
   - Require lowercase: Yes
   - Require number: Yes
   - Require special character: Recommended

4. **Configure Email Templates:**
   - Not needed (we're using synthetic emails `{id}@police.gov.vn`)

### 6.2 Create Service Accounts

For testing and administrative purposes:

1. **Go to Authentication > Users:**
   - Click "Add user"

2. **Create Admin User:**
   - Email: `admin@police.gov.vn`
   - Password: Generate strong password
   - Confirm Email: Yes
   - Click "Create user"

3. **Create Test Users:**
   ```sql
   -- Insert test police officers
   -- Note: Passwords must be set via Supabase Auth API or Dashboard

   -- User 1: Officer in Hanoi
   -- Email: 123456789012@police.gov.vn
   -- Password: TestOfficer1@2025

   -- User 2: Officer in Ho Chi Minh City
   -- Email: 234567890123@police.gov.vn
   -- Password: TestOfficer2@2025
   ```

4. **Create Corresponding Profiles:**
   ```sql
   -- Get user IDs first
   SELECT id, email FROM auth.users WHERE email LIKE '%@police.gov.vn';

   -- Insert profiles (replace {user_id} with actual IDs)
   INSERT INTO profiles (id, email, full_name, phone_number, police_unit, created_at, updated_at)
   VALUES
     ('{user_id_1}', '123456789012@police.gov.vn', 'Nguyễn Văn A', '0901234567', 'Công an Phường Trúc Bạch, Quận Ba Đình, Hà Nội', NOW(), NOW()),
     ('{user_id_2}', '234567890123@police.gov.vn', 'Trần Thị B', '0912345678', 'Công an Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh', NOW(), NOW());
   ```

### 6.3 Verify RLS Policies

1. **Test Profile Access:**
   ```sql
   -- Should return only the user's own profile
   SET request.jwt.claim.sub = '{user_id_1}';
   SELECT * FROM profiles;
   ```

2. **Test Survey Access:**
   ```sql
   -- Should return only surveys created by the user
   SET request.jwt.claim.sub = '{user_id_1}';
   SELECT * FROM survey_locations;
   ```

3. **Test Cross-User Access:**
   ```sql
   -- Should return 0 rows (can't see other users' data)
   SET request.jwt.claim.sub = '{user_id_1}';
   SELECT * FROM survey_locations WHERE created_by = '{user_id_2}';
   ```

---

## 7. Environment Configuration

### 7.1 Create Environment Files

**Development Environment (`.env.development`):**
```env
# Supabase Configuration (Development)
EXPO_PUBLIC_SUPABASE_URL=https://[dev-project-id].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# API Configuration
EXPO_PUBLIC_API_TIMEOUT=30000
EXPO_PUBLIC_MAX_PHOTO_SIZE=10485760

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=false
EXPO_PUBLIC_ENABLE_CRASH_REPORTING=false
```

**Staging Environment (`.env.staging`):**
```env
# Supabase Configuration (Staging)
EXPO_PUBLIC_SUPABASE_URL=https://[staging-project-id].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# API Configuration
EXPO_PUBLIC_API_TIMEOUT=30000
EXPO_PUBLIC_MAX_PHOTO_SIZE=10485760

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_CRASH_REPORTING=true
```

**Production Environment (`.env.production`):**
```env
# Supabase Configuration (Production)
EXPO_PUBLIC_SUPABASE_URL=https://[prod-project-id].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# API Configuration
EXPO_PUBLIC_API_TIMEOUT=30000
EXPO_PUBLIC_MAX_PHOTO_SIZE=10485760

# Feature Flags
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_CRASH_REPORTING=true
EXPO_PUBLIC_ENABLE_DEBUG_LOGS=false
```

### 7.2 Configure EAS Build Profiles

Edit `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_ENV": "development"
      }
    },
    "staging": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_ENV": "staging"
      },
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_ENV": "production"
      },
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "simulator": false
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD1234"
      }
    }
  }
}
```

### 7.3 Set Up Secrets

**For Expo Application Services (EAS):**

```bash
# Set production Supabase URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://[prod-project-id].supabase.co"

# Set production Supabase Anon Key
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGc..."

# Verify secrets
eas secret:list
```

**Security Notes:**
- Never commit `.env` files to version control
- Use different Supabase projects for dev/staging/production
- Rotate keys if exposed
- Use EAS secrets for sensitive values in CI/CD

---

## 8. Mobile App Build

### 8.1 Prepare for Build

1. **Update App Version:**
   Edit `app.json`:
   ```json
   {
     "expo": {
       "version": "1.0.0",
       "android": {
         "versionCode": 1
       },
       "ios": {
         "buildNumber": "1"
       }
     }
   }
   ```

2. **Update App Identifiers:**
   ```json
   {
     "expo": {
       "slug": "locationid-tracker",
       "name": "LocationID Tracker",
       "ios": {
         "bundleIdentifier": "vn.gov.police.locationid"
       },
       "android": {
         "package": "vn.gov.police.locationid"
       }
     }
   }
   ```

3. **Configure App Icons and Splash:**
   - Place icon at `assets/icon.png` (1024x1024)
   - Place splash at `assets/splash.png` (1242x2436)
   - Place adaptive icon at `assets/adaptive-icon.png` (1024x1024)

4. **Run Pre-Build Checks:**
   ```bash
   npm run type-check  # Verify TypeScript
   npm test            # Run all tests
   npm audit fix       # Fix security vulnerabilities
   ```

### 8.2 Build for Android (APK for Testing)

1. **Configure EAS CLI:**
   ```bash
   eas login
   eas init --id [your-project-id]
   ```

2. **Build Staging APK:**
   ```bash
   eas build --platform android --profile staging
   ```

3. **Download APK:**
   - EAS will provide download URL when complete
   - Share with UAT testers
   - Install via ADB or direct download on device

### 8.3 Build for iOS (TestFlight)

1. **Configure Provisioning:**
   ```bash
   # EAS will handle provisioning automatically
   eas build --platform ios --profile staging
   ```

2. **Submit to TestFlight:**
   ```bash
   eas submit --platform ios --profile production
   ```

3. **Add Testers:**
   - Go to App Store Connect
   - Add UAT testers' email addresses
   - They'll receive invitation to join TestFlight

### 8.4 Build for Production

**Android (Google Play Store):**
```bash
# Build AAB (Android App Bundle)
eas build --platform android --profile production

# Submit to Google Play Console
eas submit --platform android --profile production
```

**iOS (App Store):**
```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios --profile production
```

### 8.5 Verify Builds

1. **Check Build Logs:**
   - Go to https://expo.dev
   - View build logs for errors
   - Verify successful completion

2. **Test Installation:**
   - Download build to test device
   - Install and launch
   - Verify app opens without crashes

3. **Test Core Functionality:**
   - Login with test account
   - Capture GPS location
   - Take photo
   - Submit survey
   - Verify data appears in Supabase

---

## 9. User Acceptance Testing Setup

### 9.1 Prepare UAT Environment

1. **Create UAT Supabase Project:**
   - Separate from production
   - Name: `locationid-tracker-uat`
   - Follow same setup as production (sections 2-6)

2. **Seed with Test Data:**
   - Run all migrations
   - Seed reference data
   - Create test missions for specific communes

3. **Build UAT App:**
   ```bash
   eas build --platform android --profile staging
   ```

### 9.2 Create Test Users

Create accounts for UAT participants (commune police officers):

```sql
-- Insert UAT profiles (after creating auth users via Dashboard)
INSERT INTO profiles (id, email, full_name, phone_number, police_unit, created_at, updated_at)
VALUES
  ('{uat_user_1_id}', '111111111111@police.gov.vn', 'Nguyễn Văn UAT 1', '0901111111', 'Công an Xã Test 1, Huyện Test, Tỉnh Test', NOW(), NOW()),
  ('{uat_user_2_id}', '222222222222@police.gov.vn', 'Trần Thị UAT 2', '0902222222', 'Công an Xã Test 2, Huyện Test, Tỉnh Test', NOW(), NOW()),
  ('{uat_user_3_id}', '333333333333@police.gov.vn', 'Lê Văn UAT 3', '0903333333', 'Công an Xã Test 3, Huyện Test, Tỉnh Test', NOW(), NOW());
```

### 9.3 Prepare UAT Materials

**UAT Test Plan (Vietnamese):**

Create `docs/UAT_TEST_PLAN_VN.md`:

```markdown
# Kế hoạch Kiểm thử Chấp nhận Người dùng (UAT)
# LocationID Tracker (C06)

## Mục tiêu
Xác minh ứng dụng hoạt động đúng trong điều kiện thực tế với cán bộ công an xã.

## Người tham gia
- 3-5 cán bộ công an xã từ các tỉnh khác nhau
- 1 quản lý dự án
- 1 kỹ sư hỗ trợ kỹ thuật

## Thiết bị
- Điện thoại Android (Samsung/Oppo/Xiaomi phổ biến tại VN)
- Kết nối 4G/5G
- GPS được bật

## Kịch bản kiểm thử

### Kịch bản 1: Đăng nhập lần đầu
1. Mở ứng dụng
2. Nhập mã cán bộ 12 số
3. Nhập mật khẩu
4. Xác minh hiển thị Dashboard

### Kịch bản 2: Khảo sát hoàn chỉnh (Online)
1. Nhấn "Bắt đầu khảo sát mới"
2. Chọn loại đối tượng: "Nhà ở"
3. Bắt GPS (chờ độ chính xác < 10m)
4. Chụp ảnh 2-3 tấm
5. Nhập thông tin chủ nhà
6. Chọn loại đất: PNN.DO.TT
7. Vẽ polygon ranh giới (tùy chọn)
8. Xem lại và gửi
9. Xác minh thông báo thành công

### Kịch bản 3: Khảo sát ngoại tuyến
1. Tắt wifi và dữ liệu di động
2. Tạo khảo sát mới (như kịch bản 2)
3. Xác minh hiển thị "Chế độ ngoại tuyến"
4. Gửi khảo sát (lưu vào hàng đợi)
5. Bật lại kết nối
6. Xác minh đồng bộ tự động

### Kịch bản 4: Lưu nháp và tiếp tục
1. Bắt đầu khảo sát
2. Hoàn thành GPS và ảnh
3. Thoát ứng dụng (không gửi)
4. Mở lại ứng dụng
5. Vào "Bản nháp"
6. Tiếp tục khảo sát đã lưu
7. Hoàn thành và gửi

## Tiêu chí chấp nhận
- [ ] Đăng nhập thành công 100%
- [ ] GPS bắt được trong < 30 giây
- [ ] Ảnh chụp rõ nét và tải lên đúng
- [ ] Khảo sát online gửi thành công
- [ ] Khảo sát offline lưu và đồng bộ
- [ ] Nháp lưu và khôi phục chính xác
- [ ] Giao diện tiếng Việt dễ hiểu
- [ ] Không có lỗi crash/bug nghiêm trọng
```

### 9.4 Conduct UAT Sessions

1. **Schedule Sessions:**
   - Duration: 2 hours per participant
   - Location: Actual commune (field testing)
   - Record feedback in structured forms

2. **Provide Training:**
   - 30-minute walkthrough of app features
   - Demonstrate all workflows
   - Answer questions

3. **Execute Test Scenarios:**
   - Supervise participants as they complete scenarios
   - Note any confusion, errors, or usability issues
   - Record completion times

4. **Collect Feedback:**
   ```markdown
   # UAT Feedback Form

   **Participant:** [Name]
   **Unit:** [Police Unit]
   **Date:** [Date]

   ## Đánh giá chung
   - Dễ sử dụng: 1 2 3 4 5 (rất khó - rất dễ)
   - Giao diện rõ ràng: 1 2 3 4 5
   - Tốc độ phản hồi: 1 2 3 4 5
   - Hữu ích cho công việc: 1 2 3 4 5

   ## Vấn đề gặp phải
   1. [Mô tả vấn đề]
   2. [Mô tả vấn đề]

   ## Đề xuất cải tiến
   1. [Đề xuất]
   2. [Đề xuất]

   ## Có chấp nhận triển khai không?
   [ ] Có  [ ] Không  [ ] Có, sau khi sửa: ___________
   ```

### 9.5 Analyze UAT Results

1. **Aggregate Feedback:**
   - Compile all feedback forms
   - Identify common issues
   - Prioritize bugs and improvements

2. **Create Action Plan:**
   - Critical bugs → Fix before production
   - Usability issues → Schedule for next sprint
   - Nice-to-have features → Backlog

3. **Re-test if Needed:**
   - If critical issues found, fix and re-test
   - Get final sign-off from UAT participants

---

## 10. Production Monitoring

### 10.1 Set Up Logging

**Supabase Logs:**
1. Go to Logs in Supabase Dashboard
2. Enable API Logs, Auth Logs, Database Logs
3. Set retention: 7 days (upgrade for longer)

**Application Logs:**
```typescript
// Add to services/logger.ts
import * as Sentry from '@sentry/react-native';

export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
    // Send to Sentry or other service
  },
  error: (message: string, error: Error, data?: any) => {
    console.error(`[ERROR] ${message}`, error, data);
    Sentry.captureException(error, { extra: data });
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  }
};
```

### 10.2 Set Up Error Tracking

**Sentry Setup:**
```bash
npm install @sentry/react-native
```

```typescript
// In App.tsx
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://[sentry-key]@o[org-id].ingest.sentry.io/[project-id]',
  environment: process.env.EXPO_PUBLIC_ENV || 'development',
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Filter sensitive data
    if (event.user) {
      delete event.user.email;
    }
    return event;
  }
});
```

### 10.3 Set Up Performance Monitoring

**Monitor Key Metrics:**
1. App launch time
2. GPS capture time
3. Photo upload duration
4. Survey submission time
5. Sync queue processing time

**Supabase Database Performance:**
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- queries > 1 second
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 10.4 Set Up Alerts

**Supabase Alerts:**
1. Go to Database > Settings > Alerts
2. Configure alerts for:
   - High CPU usage (> 80%)
   - High memory usage (> 80%)
   - Disk space low (< 10%)
   - Connection pool exhaustion

**Application Alerts:**
```typescript
// Monitor sync queue health
if (syncStore.getQueue().filter(item => item.retryCount >= 5).length > 10) {
  logger.error('High number of failed syncs', {
    failedCount: syncStore.getQueue().filter(item => item.retryCount >= 5).length
  });
  // Send alert to ops team
}
```

### 10.5 Create Monitoring Dashboard

**Key Metrics to Track:**
- Daily Active Users (DAU)
- Surveys created per day
- Surveys successfully synced
- Photos uploaded per day
- Average GPS capture time
- Average sync time
- Error rate
- Crash rate

**Tools:**
- Grafana + Prometheus (self-hosted)
- Supabase Dashboard (built-in metrics)
- Sentry Performance Monitoring
- Google Analytics for Firebase

---

## 11. Rollback Procedures

### 11.1 App Rollback

**If mobile app has critical bug:**

1. **Revert to Previous Build:**
   ```bash
   # Download previous working build
   eas build:list --platform android --status finished

   # Re-submit to store
   eas submit --platform android --id [previous-build-id]
   ```

2. **Notify Users:**
   - Send in-app notification (if possible)
   - Email all users about rollback
   - Provide ETA for fix

### 11.2 Database Rollback

**If database migration causes issues:**

1. **Backup Current State:**
   ```bash
   # Use Supabase Dashboard > Database > Backups
   # Or pg_dump
   pg_dump -h db.[project-id].supabase.co -U postgres -d postgres > backup_pre_rollback.sql
   ```

2. **Restore Previous Backup:**
   ```sql
   -- Identify the last good backup point
   -- Restore via Supabase Dashboard > Database > Backups > Restore
   ```

3. **Verify Data Integrity:**
   ```sql
   -- Check critical tables
   SELECT COUNT(*) FROM survey_locations;
   SELECT COUNT(*) FROM profiles;

   -- Verify latest surveys
   SELECT id, created_at FROM survey_locations
   ORDER BY created_at DESC LIMIT 10;
   ```

### 11.3 Rollback Checklist

- [ ] Identify the issue and severity
- [ ] Notify stakeholders (users, management)
- [ ] Create backup of current state
- [ ] Execute rollback procedure
- [ ] Test rolled-back version
- [ ] Monitor for stability
- [ ] Document incident
- [ ] Post-mortem meeting
- [ ] Update deployment procedures to prevent recurrence

---

## 12. Troubleshooting

### 12.1 Common Issues

**Issue: Users Cannot Login**

Symptoms:
- "Mã cán bộ hoặc mật khẩu không đúng" error
- Auth token not persisting

Diagnosis:
1. Check Supabase Auth logs for failed attempts
2. Verify user exists in auth.users table
3. Check RLS policies on profiles table

Solution:
```sql
-- Verify user exists
SELECT id, email, created_at FROM auth.users
WHERE email = '{id_number}@police.gov.vn';

-- Check profile exists
SELECT * FROM profiles WHERE id = '{user_id}';

-- If profile missing, create it
INSERT INTO profiles (id, email, full_name, phone_number, police_unit)
VALUES ('{user_id}', '{email}', 'Tên cán bộ', 'Số điện thoại', 'Đơn vị');
```

**Issue: Photos Not Uploading**

Symptoms:
- Sync queue stuck
- Storage errors in logs

Diagnosis:
1. Check storage bucket policies
2. Verify file size < 10 MB
3. Check storage quota

Solution:
```sql
-- Check storage usage
SELECT
  bucket_id,
  COUNT(*) as file_count,
  SUM(CAST(metadata->>'size' AS INT)) / 1024 / 1024 as total_mb
FROM storage.objects
GROUP BY bucket_id;

-- Find large files
SELECT name, CAST(metadata->>'size' AS INT) / 1024 / 1024 as size_mb
FROM storage.objects
WHERE bucket_id = 'survey-photos'
ORDER BY size_mb DESC
LIMIT 10;
```

**Issue: Sync Queue Not Processing**

Symptoms:
- Surveys stuck in "pending" status
- Queue count increasing

Diagnosis:
1. Check network connectivity
2. Check Supabase API health
3. Review sync error logs

Solution:
```typescript
// Manually trigger sync
import { useSyncStore } from './store/syncStore';

const syncStore = useSyncStore.getState();
await syncStore.processSyncQueue(); // Force sync

// Clear failed items (last resort)
const queue = syncStore.getQueue();
queue.filter(item => item.retryCount >= 5).forEach(item => {
  syncStore.removeFromQueue(item.id);
});
```

**Issue: GPS Not Capturing**

Symptoms:
- "Không thể lấy vị trí GPS" error
- Accuracy never improves

Diagnosis:
1. Check device GPS is enabled
2. Verify app has location permissions
3. Check location services on device

Solution:
```typescript
// Check permissions
import * as Location from 'expo-location';

const { status } = await Location.getForegroundPermissionsAsync();
console.log('Permission status:', status);

// Request again if needed
if (status !== 'granted') {
  await Location.requestForegroundPermissionsAsync();
}

// Check GPS is actually enabled
const enabled = await Location.hasServicesEnabledAsync();
console.log('GPS enabled:', enabled);
```

### 12.2 Debug Mode

Enable debug logging in production (temporarily):

```typescript
// In services/supabase.ts
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      debug: true  // Enable for troubleshooting
    }
  }
);
```

### 12.3 Support Escalation

**Level 1 (Field Support):**
- Commune officers report issues to local IT support
- Common issues: login, GPS, camera permissions
- Resolution time: < 4 hours

**Level 2 (Technical Support):**
- IT support escalates to development team
- Issues: sync failures, data corruption, app crashes
- Resolution time: < 24 hours

**Level 3 (Critical Issues):**
- Security breaches, data loss, system outages
- Immediate escalation to project manager and DevOps
- Resolution time: < 2 hours

**Emergency Contact:**
- Project Manager: [Phone/Email]
- Lead Developer: [Phone/Email]
- Supabase Support: support@supabase.com

---

## Post-Deployment Checklist

After completing all deployment steps:

- [ ] All database migrations applied successfully
- [ ] Reference data seeded and verified
- [ ] Storage buckets configured with RLS policies
- [ ] Authentication working for test users
- [ ] Environment variables set correctly
- [ ] Mobile app builds successful (Android & iOS)
- [ ] UAT completed with sign-off
- [ ] Monitoring and logging operational
- [ ] Error tracking configured (Sentry)
- [ ] Rollback procedures documented
- [ ] Support team trained
- [ ] User documentation distributed (Vietnamese)
- [ ] Production launch announcement sent
- [ ] Post-launch monitoring period (1 week) scheduled

---

## Next Steps After Deployment

1. **Week 1: Intensive Monitoring**
   - Daily check of error logs
   - Monitor user feedback channels
   - Quick hotfixes for critical issues

2. **Week 2-4: Stabilization**
   - Collect user feedback
   - Prioritize improvements
   - Release minor updates

3. **Month 2+: Feature Development**
   - Implement requested features
   - Optimize performance
   - Scale infrastructure as needed

4. **Quarterly: Regulatory Updates**
   - Check for updated cadastral codes
   - Update land use classifications
   - Ensure continued compliance

---

## Resources

- **Supabase Documentation:** https://supabase.com/docs
- **Expo Documentation:** https://docs.expo.dev
- **EAS Build:** https://docs.expo.dev/build/introduction
- **Vietnamese Land Law 2013:** [Link to official source]
- **Circular 02/2015/TT-BTNMT:** [Link to official source]
- **Project GitHub:** [Repository URL]

---

**Document Version:** 1.0.0
**Last Updated:** 2025-01-21
**Author:** Development Team
**Review Status:** ✓ Ready for use
