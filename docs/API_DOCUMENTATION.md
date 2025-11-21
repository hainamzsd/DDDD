# API Documentation - LocationID Tracker (C06)

## Overview

This document describes all API endpoints, service methods, and data contracts used in the LocationID Tracker mobile application. The app communicates with a Supabase backend (PostgreSQL + PostGIS + Storage + Auth).

**Base URL:** Configured via `EXPO_PUBLIC_SUPABASE_URL` environment variable
**Authentication:** Supabase Auth with JWT tokens (auto-managed by SDK)
**Security:** Row Level Security (RLS) enforced on all database tables

---

## Table of Contents

1. [Authentication Service](#authentication-service)
2. [Survey Service](#survey-service)
3. [Reference Data Service](#reference-data-service)
4. [Data Export Service](#data-export-service)
5. [Type Definitions](#type-definitions)
6. [Error Handling](#error-handling)

---

## Authentication Service

**File:** `services/auth.ts`

### 1. Sign In with ID Number

Converts a 12-digit police officer ID to email format and authenticates with Supabase.

**Method:** `signInWithIdNumber(idNumber: string, password: string): Promise<Profile>`

**Request:**
```typescript
{
  idNumber: string;  // 12-digit police ID (e.g., "123456789012")
  password: string;  // Officer's password
}
```

**Process:**
1. Validates ID number format (12 digits)
2. Converts to email: `{idNumber}@police.gov.vn`
3. Calls Supabase Auth API
4. Fetches profile from `profiles` table

**Response:**
```typescript
{
  id: string;              // UUID from auth.users
  idNumber: string;        // Original 12-digit ID
  fullName: string;        // Officer's full name
  phoneNumber?: string;    // Contact phone
  unitName?: string;       // Assigned police unit
  rank?: string;           // Police rank
  createdAt: string;       // ISO timestamp
}
```

**Errors:**
- `"Mã cán bộ phải có đúng 12 chữ số"` - Invalid ID format
- `"Mã cán bộ hoặc mật khẩu không đúng"` - Auth failure
- `"Không tìm thấy thông tin cán bộ"` - Profile not found

**Example:**
```typescript
import { signInWithIdNumber } from '../services/auth';

const profile = await signInWithIdNumber('123456789012', 'Test@123456');
// Returns: { id: '...', idNumber: '123456789012', fullName: 'Nguyễn Văn A', ... }
```

---

### 2. Sign Out

Logs out the current user and clears session.

**Method:** `signOut(): Promise<void>`

**Request:** None

**Response:** `void`

**Errors:** Throws on Supabase error

**Example:**
```typescript
await signOut();
```

---

### 3. Get Current Profile

Fetches the authenticated user's profile.

**Method:** `getProfile(): Promise<Profile | null>`

**Request:** None (uses current session)

**Response:** `Profile | null`

**Database Query:**
```sql
SELECT id, email, full_name, phone_number, unit_name, rank, created_at
FROM profiles
WHERE id = auth.uid()
LIMIT 1;
```

**Example:**
```typescript
const profile = await getProfile();
if (profile) {
  console.log(profile.fullName);
}
```

---

### 4. Check Session

Verifies if a valid session exists.

**Method:** `checkSession(): Promise<boolean>`

**Request:** None

**Response:** `boolean` - `true` if session is valid

**Example:**
```typescript
const isLoggedIn = await checkSession();
```

---

## Survey Service

**File:** `services/survey.ts`

### 1. Submit Survey

Creates a new survey location record with all associated data.

**Method:** `submitSurvey(survey: Survey, photos: Photo[], vertices?: Vertex[]): Promise<string>`

**Request:**
```typescript
{
  survey: {
    id: string;                    // Client-generated UUID
    objectType: string;            // Object type (house, shop, etc.)
    objectId: string;              // Local object identifier
    gpsCoordinates?: {
      latitude: number;
      longitude: number;
      altitude?: number;
      accuracy?: number;
    };
    locationName?: string;         // Name of location
    ownerName?: string;            // Owner/representative name
    ownerIdNumber?: string;        // Owner ID (9 or 12 digits)
    address?: {
      streetNumber?: string;
      streetName?: string;
      hamlet?: string;
      commune?: string;
      district?: string;
      province?: string;
    };
    landUseTypeCode?: string;      // Land use category code
    notes?: string;                // Additional notes
    status: 'draft' | 'pending' | 'synced';
    createdAt: string;             // ISO timestamp
  };
  photos: Array<{
    id: string;                    // Photo UUID
    localUri: string;              // File URI on device
    type: 'photo' | 'video';
    capturedAt: string;            // ISO timestamp
  }>;
  vertices?: Array<{               // Optional boundary polygon
    id: string;                    // Vertex UUID
    latitude: number;
    longitude: number;
    order: number;                 // Vertex sequence
  }>;
}
```

**Process:**
1. Creates `survey_locations` record with PostGIS point
2. Uploads photos to Supabase Storage (`survey-photos` bucket)
3. Creates `survey_media` records with file paths
4. If vertices provided, creates `rough_area` polygon and `survey_vertices` records

**Response:** `string` - Location ID (UUID)

**Database Operations:**

**Insert Location:**
```sql
INSERT INTO survey_locations (
  id, object_type, object_id, location_name, owner_name, owner_id_number,
  gps_point, street_number, street_name, hamlet, commune, district, province,
  land_use_type_code, notes, created_by, created_at
) VALUES (
  $1, $2, $3, $4, $5, $6,
  ST_GeographyFromText('POINT($longitude $latitude)'),
  $7, $8, $9, $10, $11, $12, $13, $14, auth.uid(), $15
);
```

**Insert Media:**
```sql
INSERT INTO survey_media (location_id, file_path, media_type, captured_at)
VALUES ($1, $2, $3, $4);
```

**Update Polygon:**
```sql
UPDATE survey_locations
SET rough_area = ST_GeomFromGeoJSON($geojson)
WHERE id = $1;
```

**Insert Vertices:**
```sql
INSERT INTO survey_vertices (location_id, latitude, longitude, vertex_order)
VALUES ($1, $2, $3, $4);
```

**Errors:**
- `"GPS coordinates are required"` - Missing coordinates
- `"Failed to submit survey: {error}"` - Supabase error

**Example:**
```typescript
const locationId = await submitSurvey(
  {
    id: 'uuid-1',
    objectType: 'house',
    objectId: 'H001',
    gpsCoordinates: { latitude: 21.0285, longitude: 105.8542, accuracy: 10 },
    locationName: 'Nhà ông A',
    ownerName: 'Nguyễn Văn A',
    ownerIdNumber: '123456789',
    landUseTypeCode: 'ONT',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  [
    { id: 'photo-1', localUri: 'file:///...', type: 'photo', capturedAt: '...' }
  ],
  [
    { id: 'v1', latitude: 21.0285, longitude: 105.8542, order: 0 },
    { id: 'v2', latitude: 21.0286, longitude: 105.8543, order: 1 },
    { id: 'v3', latitude: 21.0287, longitude: 105.8542, order: 2 },
  ]
);
```

---

### 2. Get Locations by User

Fetches all survey locations created by the authenticated user.

**Method:** `getLocationsByUser(): Promise<SurveyLocation[]>`

**Request:** None (uses current user ID)

**Response:**
```typescript
Array<{
  id: string;
  objectType: string;
  objectId: string;
  locationName?: string;
  ownerName?: string;
  ownerIdNumber?: string;
  gpsPoint?: {
    latitude: number;
    longitude: number;
  };
  address?: {
    streetNumber?: string;
    streetName?: string;
    hamlet?: string;
    commune?: string;
    district?: string;
    province?: string;
  };
  landUseTypeCode?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  media: Array<{
    id: string;
    filePath: string;
    mediaType: 'photo' | 'video';
    capturedAt: string;
  }>;
  vertices: Array<{
    id: string;
    latitude: number;
    longitude: number;
    vertexOrder: number;
  }>;
}>
```

**Database Query:**
```sql
SELECT
  sl.*,
  ST_Y(sl.gps_point::geometry) as latitude,
  ST_X(sl.gps_point::geometry) as longitude,
  sm.id as media_id,
  sm.file_path,
  sm.media_type,
  sm.captured_at,
  sv.id as vertex_id,
  sv.latitude as vertex_lat,
  sv.longitude as vertex_lon,
  sv.vertex_order
FROM survey_locations sl
LEFT JOIN survey_media sm ON sl.id = sm.location_id
LEFT JOIN survey_vertices sv ON sl.id = sv.location_id
WHERE sl.created_by = auth.uid()
ORDER BY sl.created_at DESC;
```

**Example:**
```typescript
const locations = await getLocationsByUser();
console.log(`Found ${locations.length} surveys`);
```

---

## Reference Data Service

**File:** `services/referenceData.ts`

### 1. Get Land Use Types

Fetches cadastral land use categories with local caching.

**Method:** `getLandUseTypes(): Promise<LandUseType[]>`

**Request:** None

**Response:**
```typescript
Array<{
  id: string;
  code: string;           // Category code (e.g., 'ONT', 'TMD', 'NNP')
  name: string;           // Vietnamese name
  category: string;       // Main category (residential, commercial, etc.)
  description?: string;   // Detailed description
  displayOrder: number;   // Sort order
  isActive: boolean;      // Status flag
}>
```

**Caching:**
- **Key:** `@land_use_types_cache`
- **Duration:** Persistent (until app data cleared)
- **Strategy:** Returns cached data immediately if available, fetches from server in background

**Database Query:**
```sql
SELECT id, code, name, category, description, display_order, is_active
FROM ref_land_use_types
WHERE is_active = true
ORDER BY display_order ASC;
```

**Example:**
```typescript
const landUseTypes = await getLandUseTypes();
const residential = landUseTypes.filter(t => t.category === 'residential');
```

---

### 2. Get Administrative Units

Fetches Vietnamese administrative divisions (provinces, districts, communes).

**Method:** `getAdminUnits(): Promise<AdminUnit[]>`

**Request:** None

**Response:**
```typescript
Array<{
  id: string;
  code: string;           // Official admin code
  name: string;           // Vietnamese name
  nameEn?: string;        // English name
  fullName: string;       // Full official name
  fullNameEn?: string;
  codeName: string;       // URL-safe code
  provinceCode?: string;  // Parent province code (for districts)
  districtCode?: string;  // Parent district code (for communes)
  level: 'province' | 'district' | 'commune';
}>
```

**Caching:**
- **Key:** `@admin_units_cache`
- **Duration:** Persistent
- **Data Source:** Originally fetched from `provinces.open-api.vn` API

**Database Query:**
```sql
SELECT id, code, name, name_en, full_name, full_name_en, code_name,
       province_code, district_code, admin_level
FROM ref_admin_units
ORDER BY code ASC;
```

**Example:**
```typescript
const units = await getAdminUnits();
const provinces = units.filter(u => u.level === 'province');
const hanoi = units.find(u => u.code === '01');
const hanoiDistricts = units.filter(u => u.provinceCode === '01' && u.level === 'district');
```

---

## Data Export Service

**File:** `services/dataExport.ts`

### Export All Data

Creates a JSON backup file containing all survey data.

**Method:** `exportAllData(): Promise<string>`

**Request:** None

**Response:** `string` - File path to exported JSON

**Export Format:**
```typescript
{
  exportDate: string;              // ISO timestamp
  metadata: {
    totalSyncedSurveys: number;
    totalPendingSurveys: number;
    totalDrafts: number;
  };
  syncedSurveys: Array<{
    id: string;
    objectType: string;
    objectId: string;
    locationName?: string;
    ownerName?: string;
    ownerIdNumber?: string;
    gpsPoint?: { latitude: number; longitude: number };
    address?: { ... };
    landUseTypeCode?: string;
    notes?: string;
    createdAt: string;
    media: Array<{ filePath: string; mediaType: string; capturedAt: string }>;
    vertices: Array<{ latitude: number; longitude: number; vertexOrder: number }>;
  }>;
  pendingSurveys: Array<{
    // Same structure as syncedSurveys
  }>;
  drafts: string[];  // Array of draft IDs
}
```

**File Naming:** `LocationID_Backup_{timestamp}.json`

**Example:**
```typescript
const filePath = await exportAllData();
// Returns: "file:///data/user/0/.../LocationID_Backup_20250121120000.json"
```

---

## Type Definitions

### Core Types

**File:** `types/survey.ts`

```typescript
// User Profile
interface Profile {
  id: string;
  idNumber: string;
  fullName: string;
  phoneNumber?: string;
  unitName?: string;
  rank?: string;
  createdAt: string;
}

// GPS Coordinates
interface GPSCoordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
}

// Address
interface Address {
  streetNumber?: string;
  streetName?: string;
  hamlet?: string;
  commune?: string;
  district?: string;
  province?: string;
}

// Survey
interface Survey {
  id: string;
  objectType: string;
  objectId: string;
  gpsCoordinates?: GPSCoordinates;
  locationName?: string;
  ownerName?: string;
  ownerIdNumber?: string;
  address?: Address;
  landUseTypeCode?: string;
  notes?: string;
  status: 'draft' | 'pending' | 'synced';
  createdAt: string;
}

// Photo
interface Photo {
  id: string;
  localUri: string;
  type: 'photo' | 'video';
  capturedAt: string;
}

// Polygon Vertex
interface Vertex {
  id: string;
  latitude: number;
  longitude: number;
  order: number;
}

// Land Use Type
interface LandUseType {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

// Administrative Unit
interface AdminUnit {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  fullName: string;
  fullNameEn?: string;
  codeName: string;
  provinceCode?: string;
  districtCode?: string;
  level: 'province' | 'district' | 'commune';
}

// Sync Queue Item
interface QueueItem {
  id: string;
  type: 'survey' | 'media' | 'polygon';
  surveyId: string;
  data: any;
  retryCount: number;
  maxRetries: number;
  lastAttempt?: string;
  error?: string;
  createdAt: string;
}
```

### Database Types

**File:** `types/database.ts`

Auto-generated from Supabase schema. Key tables:

```typescript
interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone_number?: string;
          unit_name?: string;
          rank?: string;
          created_at: string;
          updated_at: string;
        };
      };
      survey_locations: {
        Row: {
          id: string;
          object_type: string;
          object_id: string;
          location_name?: string;
          owner_name?: string;
          owner_id_number?: string;
          gps_point?: unknown;  // PostGIS GEOGRAPHY(Point, 4326)
          rough_area?: unknown; // PostGIS GEOMETRY(Polygon, 4326)
          street_number?: string;
          street_name?: string;
          hamlet?: string;
          commune?: string;
          district?: string;
          province?: string;
          land_use_type_code?: string;
          notes?: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
      };
      survey_media: {
        Row: {
          id: string;
          location_id: string;
          file_path: string;
          media_type: 'photo' | 'video';
          captured_at: string;
          created_at: string;
        };
      };
      survey_vertices: {
        Row: {
          id: string;
          location_id: string;
          latitude: number;
          longitude: number;
          vertex_order: number;
          created_at: string;
        };
      };
      ref_land_use_types: {
        Row: {
          id: string;
          code: string;
          name: string;
          category: string;
          description?: string;
          display_order: number;
          is_active: boolean;
          created_at: string;
        };
      };
      ref_admin_units: {
        Row: {
          id: string;
          code: string;
          name: string;
          name_en?: string;
          full_name: string;
          full_name_en?: string;
          code_name: string;
          province_code?: string;
          district_code?: string;
          admin_level: string;
          created_at: string;
        };
      };
    };
  };
}
```

---

## Error Handling

### Error Response Format

All service methods throw errors with Vietnamese messages for user display.

**Pattern:**
```typescript
try {
  const result = await someService();
} catch (error: any) {
  console.error('Error:', error);
  Alert.alert('Lỗi', error.message || 'Đã xảy ra lỗi không xác định');
}
```

### Common Error Messages

**Authentication:**
- `"Mã cán bộ phải có đúng 12 chữ số"`
- `"Mã cán bộ hoặc mật khẩu không đúng"`
- `"Không tìm thấy thông tin cán bộ"`
- `"Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."`

**Survey Submission:**
- `"GPS coordinates are required"`
- `"Failed to submit survey: {details}"`
- `"Failed to upload photo {fileName}: {details}"`
- `"Failed to create polygon: {details}"`

**Network:**
- `"Không có kết nối mạng"`
- `"Lỗi kết nối. Vui lòng thử lại."`

**Data Loading:**
- `"Không thể tải dữ liệu. Vui lòng thử lại."`
- `"Dữ liệu không hợp lệ"`

### Network Error Detection

**Pattern:**
```typescript
function isNetworkError(error: any): boolean {
  return (
    error.message?.includes('network') ||
    error.message?.includes('timeout') ||
    error.message?.includes('connection') ||
    error.code === 'NETWORK_ERROR'
  );
}
```

### Retry Logic

Implemented in `syncStore.ts` for offline sync:

```typescript
{
  maxRetries: 5,
  retryCount: 0,
  retryDelay: exponentialBackoff(retryCount), // 1s, 2s, 4s, 8s, 16s
}
```

---

## API Rate Limits

Supabase free tier limits:
- **Database:** 500MB storage, unlimited API requests
- **Auth:** 50,000 MAUs
- **Storage:** 1GB, 2GB bandwidth
- **Realtime:** 200 concurrent connections

**Note:** For production, consider upgrading to Pro tier or implementing request throttling.

---

## Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled. Example policies:

```sql
-- Officers can only read their own surveys
CREATE POLICY "Users can view own surveys"
ON survey_locations FOR SELECT
USING (auth.uid() = created_by);

-- Officers can only insert their own surveys
CREATE POLICY "Users can create own surveys"
ON survey_locations FOR INSERT
WITH CHECK (auth.uid() = created_by);
```

### Authentication Tokens

- JWT tokens auto-managed by Supabase SDK
- Stored in AsyncStorage with encryption (platform-specific)
- Auto-refresh enabled (configured in `services/supabase.ts`)
- Tokens expire after 1 hour (default), refreshed automatically

### HTTPS

- All API requests use HTTPS (enforced by Supabase)
- Storage URLs use signed URLs with expiration
- No sensitive data in URL parameters

---

## Testing Endpoints

### Local Development

**Environment:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Test User

```typescript
// Create test user in Supabase Auth Dashboard
Email: 123456789012@police.gov.vn
Password: Test@123456

// Create matching profile
INSERT INTO profiles (id, email, full_name, phone_number, unit_name)
VALUES (
  (SELECT id FROM auth.users WHERE email = '123456789012@police.gov.vn'),
  '123456789012@police.gov.vn',
  'Nguyễn Văn Test',
  '0901234567',
  'Công an xã Test'
);
```

### cURL Examples

**Login (via Supabase client only - no direct cURL):**

The app uses Supabase SDK which handles authentication internally. Direct HTTP API calls for auth are not recommended.

**Get Locations (with JWT token):**
```bash
curl -X GET 'https://your-project.supabase.co/rest/v1/survey_locations' \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-jwt-token"
```

---

## Changelog

### Version 1.0.0 (2025-01-21)

- Initial API documentation
- Documented all service methods and data contracts
- Added error handling patterns
- Included security considerations

---

## Support

For issues or questions:
- Check `CLAUDE.md` for project overview
- Review `DATA_MODEL.md` for database schema
- See code comments in `services/` directory
- Refer to Supabase documentation: https://supabase.com/docs
