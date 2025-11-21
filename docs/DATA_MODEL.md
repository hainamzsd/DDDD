# Data Model Documentation

## Overview

This document describes the complete data model for the LocationID Tracker (C06) application, including database schema, table relationships, and mappings to Vietnamese cadastral categories.

**Database:** PostgreSQL 14+ with PostGIS extension
**ORM/Client:** Supabase Client (@supabase/supabase-js)
**Local Storage:** AsyncStorage (React Native) for drafts and cache

---

## Table of Contents

1. [Core Tables](#core-tables)
2. [Reference Data Tables](#reference-data-tables)
3. [Table Relationships](#table-relationships)
4. [Spatial Data Types](#spatial-data-types)
5. [Cadastral Category Mappings](#cadastral-category-mappings)
6. [Local Storage Schema](#local-storage-schema)

---

## Core Tables

### 1. `profiles`

Stores officer profiles linked to Supabase Auth users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, REFERENCES auth.users(id) | User ID from Supabase Auth |
| `email` | TEXT | NOT NULL, UNIQUE | Email (format: 12-digit-ID@police.gov.vn) |
| `full_name` | TEXT | NOT NULL | Officer's full name (Vietnamese) |
| `phone_number` | TEXT | | Contact phone number |
| `police_unit` | TEXT | | Police unit/commune name |
| `rank` | TEXT | | Officer rank |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Profile creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**RLS Policy:** Users can only read/update their own profile (`auth.uid() = id`).

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE on `email`

---

### 2. `survey_missions`

Defines survey campaigns or missions (currently minimal, can be expanded).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Mission ID |
| `title` | TEXT | NOT NULL | Mission title |
| `description` | TEXT | | Mission description |
| `start_date` | DATE | | Mission start date |
| `end_date` | DATE | | Mission end date |
| `created_by` | UUID | REFERENCES profiles(id) | Creator user ID |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**RLS Policy:** Officers can view missions assigned to them (currently all missions visible).

---

### 3. `survey_locations`

Core table storing survey data for each location.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Survey record ID |
| `mission_id` | UUID | REFERENCES survey_missions(id) | Associated mission (nullable) |
| `created_by` | UUID | NOT NULL, REFERENCES profiles(id) | Officer who created survey |
| **GPS & Spatial Data** |
| `gps_point` | GEOGRAPHY(Point, 4326) | NOT NULL | GPS coordinates (longitude, latitude) |
| `gps_accuracy` | FLOAT | | GPS accuracy in meters |
| `rough_area` | GEOMETRY(Polygon, 4326) | | Optional polygon boundary |
| **Location Information** |
| `location_name` | TEXT | NOT NULL | Location name (e.g., "Nhà ông Nguyễn Văn A") |
| `province_code` | TEXT | | Province code (e.g., "01" for Hà Nội) |
| `district_code` | TEXT | | District code |
| `commune_code` | TEXT | | Commune/ward code |
| `hamlet_village` | TEXT | | Hamlet/village name |
| `street_address` | TEXT | | Street address |
| **Object Information** |
| `object_type_code` | TEXT | | Object type code (from ref_object_types) |
| `object_id_number` | TEXT | | Object identification number |
| **Owner Information** |
| `owner_name` | TEXT | | Owner/representative name |
| `owner_id_number` | TEXT | | Owner ID number (9 or 12 digits) |
| **Land Use** |
| `land_use_type_code` | TEXT | | Land use type code (from ref_land_use_types) |
| **Additional Data** |
| `notes` | TEXT | | Additional notes from officer |
| `status` | TEXT | DEFAULT 'draft' | Survey status (draft/pending/submitted/synced) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Survey creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |
| `synced_at` | TIMESTAMPTZ | | Timestamp when synced to server |

**RLS Policy:** Officers can only access their own surveys (`auth.uid() = created_by`).

**Indexes:**
- PRIMARY KEY on `id`
- GIST index on `gps_point` (spatial queries)
- GIST index on `rough_area` (spatial queries)
- Index on `created_by` (user queries)
- Index on `land_use_type_code` (filtering)

---

### 4. `survey_media`

Stores photos and videos captured during surveys.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Media record ID |
| `survey_location_id` | UUID | NOT NULL, REFERENCES survey_locations(id) ON DELETE CASCADE | Associated survey |
| `media_type` | TEXT | NOT NULL | Media type (photo/video) |
| `file_path` | TEXT | NOT NULL | Path in Supabase Storage (e.g., "photos/uuid/1234.jpg") |
| `thumbnail_path` | TEXT | | Thumbnail path (for videos) |
| `sequence_number` | INTEGER | | Order of photo in survey (1, 2, 3...) |
| `caption` | TEXT | | Optional caption |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Upload timestamp |

**RLS Policy:** Users can only access media for their own surveys.

**Storage Bucket:** `survey-photos` (public read, authenticated write)

**Indexes:**
- PRIMARY KEY on `id`
- Index on `survey_location_id` (joins)

---

### 5. `survey_vertices`

Stores individual vertices of polygon boundaries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Vertex record ID |
| `survey_location_id` | UUID | NOT NULL, REFERENCES survey_locations(id) ON DELETE CASCADE | Associated survey |
| `sequence` | INTEGER | NOT NULL | Vertex order (0, 1, 2...) |
| `latitude` | FLOAT | NOT NULL | Latitude (degrees) |
| `longitude` | FLOAT | NOT NULL | Longitude (degrees) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**RLS Policy:** Users can only access vertices for their own surveys.

**Indexes:**
- PRIMARY KEY on `id`
- Index on `survey_location_id` (joins)
- Composite index on `(survey_location_id, sequence)` (ordered retrieval)

---

## Reference Data Tables

### 6. `ref_object_types`

Reference table for object types (house, shop, building, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Object type ID |
| `code` | TEXT | NOT NULL, UNIQUE | Object type code (e.g., "NHA", "CUA_HANG") |
| `name` | TEXT | NOT NULL | Vietnamese name (e.g., "Nhà ở", "Cửa hàng") |
| `description` | TEXT | | Description |
| `is_active` | BOOLEAN | DEFAULT true | Active status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**RLS Policy:** Public read access (reference data).

**Examples:**
- `NHA` - Nhà ở (Residence)
- `CUA_HANG` - Cửa hàng (Shop)
- `NHA_XUONG` - Nhà xưởng (Factory/Workshop)

---

### 7. `ref_land_use_types`

Reference table for Vietnamese cadastral land use categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Land use type ID |
| `code` | TEXT | NOT NULL, UNIQUE | Official land use code |
| `category` | TEXT | NOT NULL | Main category (e.g., "residential", "commercial") |
| `name` | TEXT | NOT NULL | Vietnamese name |
| `description` | TEXT | | Description |
| `parent_code` | TEXT | REFERENCES ref_land_use_types(code) | Parent category (for hierarchical data) |
| `is_active` | BOOLEAN | DEFAULT true | Active status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**RLS Policy:** Public read access (reference data).

**Categories (Main Types):**
1. **residential** - Đất ở (Residential land)
2. **commercial** - Đất thương mại dịch vụ (Commercial/Service land)
3. **agricultural** - Đất nông nghiệp (Agricultural land)
4. **public** - Đất công cộng (Public land)
5. **industrial** - Đất sản xuất kinh doanh (Industrial land)
6. **infrastructure** - Đất cơ sở hạ tầng (Infrastructure land)
7. **defense** - Đất quốc phòng an ninh (Defense/Security land)
8. **other** - Đất khác (Other land)

**Hierarchical Structure:**
Each category has subtypes with `parent_code` referencing the main category code.

Example:
```
- THO (residential)
  - THO_RIENG (individual housing)
  - THO_CHUNG_CU (apartment)
  - THO_LIEN_KE (townhouse)
```

See [Cadastral Category Mappings](#cadastral-category-mappings) for complete list.

---

### 8. `ref_admin_units`

Vietnamese administrative unit hierarchy (Province → District → Commune).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Admin unit ID |
| `code` | TEXT | NOT NULL, UNIQUE | Official administrative code |
| `name` | TEXT | NOT NULL | Vietnamese name |
| `name_en` | TEXT | | English name (if available) |
| `type` | TEXT | NOT NULL | Unit type (province/district/commune) |
| `parent_code` | TEXT | REFERENCES ref_admin_units(code) | Parent unit code |
| `latitude` | FLOAT | | Center latitude |
| `longitude` | FLOAT | | Center longitude |
| `is_active` | BOOLEAN | DEFAULT true | Active status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**RLS Policy:** Public read access (reference data).

**Hierarchy:**
- **Provinces** (63): `parent_code` = NULL, `type` = 'province'
- **Districts** (~700): `parent_code` = province code, `type` = 'district'
- **Communes** (~10,000): `parent_code` = district code, `type` = 'commune'

**Data Source:** Populated from `provinces.open-api.vn` API via `scripts/fetch-admin-units.js`.

---

## Table Relationships

```
auth.users (Supabase Auth)
    ↓ (1:1)
profiles
    ↓ (1:N creates)
survey_locations
    ↓ (1:N)
    ├── survey_media (photos/videos)
    └── survey_vertices (polygon points)

survey_missions
    ↓ (1:N)
survey_locations (optional mission assignment)

ref_object_types ← (referenced by) survey_locations.object_type_code
ref_land_use_types ← (referenced by) survey_locations.land_use_type_code
ref_admin_units ← (referenced by) survey_locations.{province_code, district_code, commune_code}
```

---

## Spatial Data Types

### PostGIS Types Used

1. **GEOGRAPHY(Point, 4326)**
   - Used for: `survey_locations.gps_point`
   - Format: WGS84 (latitude/longitude)
   - Storage: Binary (efficient spatial queries)
   - Example: `ST_GeogFromText('POINT(105.8342 21.0278)')`

2. **GEOMETRY(Polygon, 4326)**
   - Used for: `survey_locations.rough_area`
   - Format: WGS84 polygon (closed ring)
   - Storage: Binary (efficient spatial queries)
   - Example: `ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[105.1,21.1],[105.2,21.1],[105.2,21.2],[105.1,21.2],[105.1,21.1]]]}')`

### Spatial Indexes

```sql
CREATE INDEX idx_survey_locations_gps_point
ON survey_locations USING GIST (gps_point);

CREATE INDEX idx_survey_locations_rough_area
ON survey_locations USING GIST (rough_area);
```

### Common Spatial Queries

**Find surveys within 1km radius:**
```sql
SELECT * FROM survey_locations
WHERE ST_DWithin(
  gps_point,
  ST_GeogFromText('POINT(105.8342 21.0278)'),
  1000  -- meters
);
```

**Calculate polygon area (sq meters):**
```sql
SELECT
  id,
  ST_Area(rough_area::geography) AS area_sq_meters
FROM survey_locations
WHERE rough_area IS NOT NULL;
```

---

## Cadastral Category Mappings

### Vietnamese Land Use Classification

Based on current Vietnamese land law and cadastral regulations, the `ref_land_use_types` table stores the following hierarchy:

#### 1. Residential Land (Đất ở)
- **Code Prefix:** THO
- **Subtypes:**
  - `THO_RIENG` - Đất ở riêng lẻ (Individual housing)
  - `THO_CHUNG_CU` - Đất ở tập thể (Apartment/collective housing)
  - `THO_LIEN_KE` - Đất ở liền kề (Townhouse)

#### 2. Commercial/Service Land (Đất thương mại dịch vụ)
- **Code Prefix:** TMDV
- **Subtypes:**
  - `TMDV_THUONG_MAI` - Đất thương mại (Commercial)
  - `TMDV_DICH_VU` - Đất dịch vụ (Service)
  - `TMDV_VAN_PHONG` - Đất văn phòng (Office)
  - `TMDV_KHU_VUI_CHOI` - Đất khu vui chơi giải trí (Entertainment)

#### 3. Agricultural Land (Đất nông nghiệp)
- **Code Prefix:** NNP
- **Subtypes:**
  - `NNP_LUA` - Đất trồng lúa (Paddy land)
  - `NNP_CAY_HANG_NAM` - Đất cây hàng năm khác (Annual crops)
  - `NNP_CAY_LAU_NAM` - Đất cây lâu năm (Perennial crops)
  - `NNP_RUNG_SAN_XUAT` - Đất rừng sản xuất (Production forest)
  - `NNP_NUOI_TRONG_THUY_SAN` - Đất nuôi trồng thủy sản (Aquaculture)
  - `NNP_LAM_MUOI` - Đất làm muối (Salt production)

#### 4. Public Land (Đất công cộng)
- **Code Prefix:** CCC
- **Subtypes:**
  - `CCC_GIAO_THONG` - Đất giao thông (Transportation)
  - `CCC_CONG_TRINH_CONG_CONG` - Đất công trình công cộng (Public works)
  - `CCC_NHA_TRE_TRUONG_HOC` - Đất nhà trẻ, trường học (Kindergarten/school)
  - `CCC_BENH_VIEN` - Đất cơ sở y tế (Healthcare)
  - `CCC_VAN_HOA_THE_THAO` - Đất văn hóa thể thao (Culture/sports)

#### 5. Industrial/Production Land (Đất sản xuất kinh doanh)
- **Code Prefix:** SXKD
- **Subtypes:**
  - `SXKD_KHU_CONG_NGHIEP` - Đất khu công nghiệp (Industrial zone)
  - `SXKD_KHU_CHE_XUAT` - Đất khu chế xuất (Export processing zone)
  - `SXKD_CO_SO_SAN_XUAT` - Đất cơ sở sản xuất (Production facility)

#### 6. Infrastructure Land (Đất cơ sở hạ tầng)
- **Code Prefix:** CSHT
- **Subtypes:**
  - `CSHT_DIEN` - Đất năng lượng (Energy/power)
  - `CSHT_BAI_RAC` - Đất bãi thải, xử lý chất thải (Waste disposal)
  - `CSHT_TUONG_DAI` - Đất tượng đài, di tích (Monument/heritage)

#### 7. Defense/Security Land (Đất quốc phòng an ninh)
- **Code Prefix:** QPAN
- **Subtypes:**
  - `QPAN_QUOC_PHONG` - Đất quốc phòng (Defense)
  - `QPAN_AN_NINH` - Đất an ninh (Security)

#### 8. Other Land (Đất khác)
- **Code Prefix:** KHAC
- **Subtypes:**
  - `KHAC_SONG_SUOI_KENH_RACH` - Đất sông, suối, kênh, rạch (Waterways)
  - `KHAC_CHUA_SU_DUNG` - Đất chưa sử dụng (Unused)

### Mapping to Database

Each land use type is stored in `ref_land_use_types` with:
- `code`: Official code (e.g., "THO_RIENG")
- `category`: Main category (e.g., "residential")
- `name`: Vietnamese name (e.g., "Đất ở riêng lẻ")
- `parent_code`: Reference to parent category (hierarchical structure)

When an officer selects a land use type in the app, the `code` is stored in `survey_locations.land_use_type_code`.

---

## Local Storage Schema

### AsyncStorage Keys

The app uses AsyncStorage (React Native) for offline storage:

#### 1. Survey Drafts
- **Key Pattern:** `@survey_draft_{surveyId}`
- **Value Type:** JSON
- **Structure:**
```json
{
  "survey": {
    "id": "uuid",
    "locationName": "string",
    "gpsLatitude": "number",
    "gpsLongitude": "number",
    "gpsAccuracy": "number",
    "objectTypeCode": "string",
    "objectIdNumber": "string",
    "ownerName": "string",
    "ownerIdNumber": "string",
    "provinceCode": "string",
    "districtCode": "string",
    "communeCode": "string",
    "hamletVillage": "string",
    "streetAddress": "string",
    "landUseTypeCode": "string",
    "notes": "string",
    "status": "draft|pending|synced"
  },
  "photos": [
    {
      "uri": "file://...",
      "type": "image",
      "timestamp": "number"
    }
  ],
  "vertices": [
    {
      "latitude": "number",
      "longitude": "number",
      "sequence": "number"
    }
  ],
  "savedAt": "number (timestamp)"
}
```

#### 2. Sync Queue
- **Key:** `@sync_queue`
- **Value Type:** JSON Array
- **Structure:**
```json
[
  {
    "id": "uuid",
    "type": "survey|media|polygon",
    "surveyId": "uuid",
    "data": "object (survey/media/polygon data)",
    "retryCount": "number",
    "maxRetries": 5,
    "lastAttempt": "number (timestamp)",
    "error": "string|null",
    "createdAt": "number (timestamp)"
  }
]
```

#### 3. Reference Data Cache
- **Keys:**
  - `@land_use_types_cache` - Cached land use types
  - `@admin_units_cache` - Cached administrative units
- **Value Type:** JSON
- **TTL:** 24 hours
- **Structure:**
```json
{
  "data": [...],
  "cachedAt": "number (timestamp)"
}
```

#### 4. Auth State
- **Managed by:** Supabase Client (automatic)
- **Keys:** Internal Supabase keys (e.g., `supabase.auth.token`)

---

## Data Flow

### Survey Creation Flow
1. Officer creates new survey → generates UUID
2. Data stored in `@survey_draft_{id}` (local)
3. GPS captured → updates draft
4. Photos captured → file URIs stored in draft
5. Metadata entered → updates draft
6. Polygon drawn (optional) → vertices stored in draft
7. Review & submit → draft moved to sync queue

### Sync Flow (Online)
1. Officer submits → immediate sync attempt
2. **Create location record** in `survey_locations`
3. **Upload photos** to Supabase Storage bucket `survey-photos`
4. **Create media records** in `survey_media`
5. **Save polygon** to `survey_locations.rough_area` (if exists)
6. **Create vertex records** in `survey_vertices`
7. Update `survey_locations.status` to 'synced'
8. Remove from sync queue
9. Delete local draft

### Sync Flow (Offline)
1. Officer submits → data added to sync queue
2. App monitors network status (NetInfo)
3. When online → auto-trigger sync
4. Process queue items sequentially
5. On success → remove from queue
6. On failure → increment retry count (max 5)
7. Update UI with sync status

---

## Security & RLS

All tables have Row Level Security (RLS) enabled with policies:

### Profiles
```sql
-- Users can read/update their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

### Survey Locations
```sql
-- Users can only access their own surveys
CREATE POLICY "Users can view own surveys"
ON survey_locations FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own surveys"
ON survey_locations FOR INSERT
WITH CHECK (auth.uid() = created_by);
```

### Reference Data
```sql
-- Public read access for reference tables
CREATE POLICY "Anyone can view land use types"
ON ref_land_use_types FOR SELECT
USING (true);
```

---

## Maintenance & Updates

### Regular Updates Required

1. **Administrative Units** (`ref_admin_units`)
   - Source: provinces.open-api.vn
   - Frequency: Annually or when administrative boundaries change
   - Script: `scripts/fetch-admin-units.js`

2. **Land Use Types** (`ref_land_use_types`)
   - Source: Vietnamese land law updates
   - Frequency: When regulations change
   - Manual update via SQL seed file

3. **Object Types** (`ref_object_types`)
   - Source: Survey requirements
   - Frequency: As needed
   - Manual update

### Cache Invalidation

Local cache in AsyncStorage should be cleared:
- After 24 hours (automatic)
- When app detects reference data version mismatch
- Manually via Settings screen

---

## Version History

- **v1.0** (2025-01-21): Initial schema with core tables, RLS policies, and PostGIS integration
- Added land use types table with Vietnamese cadastral categories
- Added administrative units table with 3-level hierarchy

---

## References

- [Supabase Documentation](https://supabase.com/docs)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Vietnamese Land Law 2013 (amended 2018)](https://thuvienphapluat.vn/)
- [Administrative Units API](https://provinces.open-api.vn/)
