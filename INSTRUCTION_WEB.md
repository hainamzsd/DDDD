# INSTRUCTION.md - C06 National Location Identification System (Web Platform)

## Project Overview

**C06 Web Platform** - A comprehensive, GIS-centric web application for Vietnam's National Location Identification System. This multi-role platform receives survey data from the mobile app (React Native), processes it through a hierarchical approval workflow (Commune → Central), and manages nationwide location identifier assignments.

**Tech Stack:**
- **Frontend:** Next.js (App Router), React 18, TypeScript, TailwindCSS
- **Backend:** Supabase (PostgreSQL + PostGIS), Supabase Edge Functions (Deno)
- **Maps:** Leaflet.js / Mapbox GL JS with PostGIS integration
- **Auth:** Supabase Auth with Row Level Security (RLS)
- **File Storage:** Supabase Storage for photos/documents
- **Real-time:** Supabase Realtime subscriptions for live updates

**Deployment:**
- Frontend: Vercel (Next.js)
- Backend: Supabase Cloud (or self-hosted)
- CDN: Cloudflare for static assets

---

## System Architecture

### User Roles & Workflow

```
Mobile App → Commune Officer → Commune Supervisor → Central System
             (Review/Edit)      (Approve/Reject)     (ID Assignment)
```

**Role Hierarchy:**
1. **Commune Officer** (`commune_officer`) - Receives mobile submissions, adds metadata, submits for review
2. **Commune Supervisor** (`commune_supervisor`) - Reviews/approves/rejects submissions from officers
3. **Central Administrator** (`central_admin`) - Ministry-level oversight, ID generation, analytics
4. **System Admin** (`system_admin`) - Platform configuration, user management

### Data Flow

```
1. Mobile app submits survey → `survey_locations` (status: pending)
2. Commune officer reviews → Adds metadata → (status: reviewed)
3. Commune supervisor approves → (status: approved_commune)
4. Central system receives → Auto-generates ID → (status: approved_central)
5. ID exported to national systems → (status: published)
```

---

## Database Schema Extensions

### New Tables (add to existing schema)

```sql
-- User roles and permissions
CREATE TABLE web_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('commune_officer', 'commune_supervisor', 'central_admin', 'system_admin')),
  commune_code TEXT, -- NULL for central admins
  district_code TEXT,
  province_code TEXT,
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approval workflow tracking
CREATE TABLE approval_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_location_id UUID REFERENCES survey_locations(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('submitted', 'reviewed', 'approved', 'rejected', 'published')),
  actor_id UUID REFERENCES profiles(id),
  actor_role TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  notes TEXT,
  metadata JSONB, -- Additional data (rejection reason, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location identifier assignments
CREATE TABLE location_identifiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_location_id UUID UNIQUE REFERENCES survey_locations(id),
  location_id TEXT UNIQUE NOT NULL, -- 12-char: PP-DD-CC-NNNNNN
  admin_code TEXT NOT NULL, -- PP-DD-CC (6 chars)
  sequence_number TEXT NOT NULL, -- NNNNNN (6 chars)
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID REFERENCES profiles(id),
  deactivation_reason TEXT
);

-- Land parcel integration (for commune officer lookup)
CREATE TABLE land_parcels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parcel_code TEXT UNIQUE NOT NULL, -- Số tờ/số thửa format
  province_code TEXT NOT NULL,
  district_code TEXT NOT NULL,
  ward_code TEXT NOT NULL,
  owner_name TEXT,
  owner_id_number TEXT, -- CCCD/CMND
  owner_phone TEXT,
  land_use_certificate_number TEXT, -- Số GCN QSDĐ
  parcel_area_m2 NUMERIC,
  land_use_type_code TEXT,
  geometry GEOMETRY(Polygon, 4326), -- Parcel boundary
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System configuration
CREATE TABLE system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs for compliance
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'survey_location', 'user', 'config'
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  changes JSONB, -- Before/after values
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_web_users_role ON web_users(role);
CREATE INDEX idx_web_users_commune ON web_users(commune_code) WHERE commune_code IS NOT NULL;
CREATE INDEX idx_approval_history_location ON approval_history(survey_location_id);
CREATE INDEX idx_location_identifiers_location ON location_identifiers(survey_location_id);
CREATE INDEX idx_land_parcels_code ON land_parcels(parcel_code);
CREATE INDEX idx_land_parcels_geometry ON land_parcels USING GIST(geometry);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

### Updated `survey_locations` Status Values

```sql
-- Extend the survey_status enum
ALTER TYPE survey_status ADD VALUE IF NOT EXISTS 'reviewed';
ALTER TYPE survey_status ADD VALUE IF NOT EXISTS 'approved_commune';
ALTER TYPE survey_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE survey_status ADD VALUE IF NOT EXISTS 'approved_central';
ALTER TYPE survey_status ADD VALUE IF NOT EXISTS 'published';

-- Status flow:
-- pending → reviewed → approved_commune → approved_central → published
--         └→ rejected (can be re-submitted)
```

### Row Level Security (RLS) Policies

```sql
-- Web users can only see data for their jurisdiction
CREATE POLICY "Commune officers see their commune data"
  ON survey_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM web_users
      WHERE web_users.profile_id = auth.uid()
        AND web_users.role = 'commune_officer'
        AND survey_locations.ward_code = web_users.commune_code
    )
  );

CREATE POLICY "Commune supervisors see their commune data"
  ON survey_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM web_users
      WHERE web_users.profile_id = auth.uid()
        AND web_users.role = 'commune_supervisor'
        AND survey_locations.ward_code = web_users.commune_code
    )
  );

CREATE POLICY "Central admins see all data"
  ON survey_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM web_users
      WHERE web_users.profile_id = auth.uid()
        AND web_users.role IN ('central_admin', 'system_admin')
    )
  );

-- Similar policies for INSERT/UPDATE based on workflow status
```

---

## Backend Implementation Tasks

### Task 1: Database Setup & Migrations

**Subtasks:**
1. Create migration file: `20250121_web_platform_schema.sql`
2. Add new tables: `web_users`, `approval_history`, `location_identifiers`, `land_parcels`, `system_config`, `audit_logs`
3. Extend `survey_status` enum with new values
4. Create indexes for performance
5. Set up RLS policies for all tables
6. Create database functions for ID generation
7. Seed initial data: system config, test users for each role

**Files:**
- `supabase/migrations/20250121_web_platform_schema.sql`
- `supabase/migrations/20250121_rls_policies.sql`
- `supabase/seed-web-users.sql`

---

### Task 2: Supabase Edge Functions (Backend Logic)

**Function 1: Location ID Generator**
```typescript
// supabase/functions/generate-location-id/index.ts
// Input: survey_location_id
// Output: 12-char ID (PP-DD-CC-NNNNNN)
// Logic:
//   - Extract province/district/commune codes
//   - Generate 6-digit sequence number (check uniqueness)
//   - Insert into location_identifiers table
//   - Update survey_locations.location_identifier field
//   - Update status to 'approved_central'
```

**Function 2: Approval Workflow Handler**
```typescript
// supabase/functions/approval-workflow/index.ts
// Actions: approve, reject, submit_to_central
// Input: { survey_location_id, action, notes }
// Logic:
//   - Validate user permissions
//   - Update survey_locations.status
//   - Insert approval_history record
//   - Send notifications (if needed)
//   - Trigger ID generation for 'approve_to_central' action
```

**Function 3: Land Parcel Lookup**
```typescript
// supabase/functions/land-parcel-lookup/index.ts
// Input: { parcel_code } or { lat, lng }
// Output: Land parcel data + owner info
// Logic:
//   - Query land_parcels by code or spatial intersection
//   - Return ownership data for commune officer to copy
```

**Function 4: Analytics Aggregator**
```typescript
// supabase/functions/analytics/index.ts
// Input: { province_code?, district_code?, date_range }
// Output: Statistics for dashboard
// Logic:
//   - Count surveys by status
//   - Group by object type, land use type
//   - Calculate approval rates, average processing time
```

**Subtasks:**
1. Set up Deno environment for Edge Functions
2. Create `/generate-location-id` function with tests
3. Create `/approval-workflow` function with role validation
4. Create `/land-parcel-lookup` function with spatial queries
5. Create `/analytics` function with aggregation queries
6. Deploy functions to Supabase
7. Create TypeScript types for function inputs/outputs

**Files:**
- `supabase/functions/generate-location-id/index.ts`
- `supabase/functions/approval-workflow/index.ts`
- `supabase/functions/land-parcel-lookup/index.ts`
- `supabase/functions/analytics/index.ts`
- `supabase/functions/_shared/types.ts`
- `supabase/functions/_shared/auth.ts`

---

### Task 3: API Layer (Next.js API Routes)

**Subtasks:**
1. Create `/api/surveys` - CRUD for survey locations
2. Create `/api/surveys/[id]/approve` - Approval endpoint
3. Create `/api/surveys/[id]/reject` - Rejection endpoint
4. Create `/api/surveys/[id]/metadata` - Update additional metadata
5. Create `/api/land-parcels/search` - Land parcel search
6. Create `/api/analytics/dashboard` - Dashboard stats
7. Create `/api/users` - User management
8. Create `/api/export/[format]` - Data export (CSV, GeoJSON, KML)
9. Add middleware for auth and role validation
10. Implement request logging for audit trail

**Files:**
- `app/api/surveys/route.ts`
- `app/api/surveys/[id]/approve/route.ts`
- `app/api/surveys/[id]/reject/route.ts`
- `app/api/surveys/[id]/metadata/route.ts`
- `app/api/land-parcels/search/route.ts`
- `app/api/analytics/dashboard/route.ts`
- `app/api/users/route.ts`
- `app/api/export/[format]/route.ts`
- `middleware.ts`

---

## Frontend Implementation Tasks

### Task 4: Authentication & Authorization

**Subtasks:**
1. Set up Supabase Auth context provider
2. Create login page with email/password + police ID conversion
3. Create role-based route protection middleware
4. Implement session management with auto-refresh
5. Create user profile page
6. Add "Remember me" functionality
7. Implement password reset flow
8. Create logout functionality

**Files:**
- `lib/auth/supabase-client.ts`
- `lib/auth/auth-context.tsx`
- `lib/auth/use-auth.ts`
- `app/(auth)/login/page.tsx`
- `app/(auth)/reset-password/page.tsx`
- `app/profile/page.tsx`
- `middleware.ts`

**Components:**
- `components/auth/LoginForm.tsx`
- `components/auth/ProtectedRoute.tsx`
- `components/auth/RoleGate.tsx`

---

### Task 5: Commune Officer Interface

**Page Structure:**
```
/commune
  /dashboard          - Overview stats, pending surveys
  /surveys            - List of surveys for review
  /surveys/[id]       - Detail view with map + metadata form
  /map                - Full-screen map view of all surveys
  /reports            - Generate reports
```

**Subtasks:**

**5.1 Dashboard Page**
- Display pending survey count, reviewed count, approved count
- Show recent submissions from mobile app
- Quick stats cards (total surveys, completion rate)
- Notification feed for new submissions

**5.2 Surveys List Page**
- Table with filters (status, date range, object type)
- Search by location name, address, ID number
- Sortable columns (submitted date, status, object type)
- Pagination
- Bulk actions (assign to self, export selected)

**5.3 Survey Detail Page (Main Workflow)**
- **Left Panel:** Metadata form
  - Location name (editable)
  - Address fields (house number, street, hamlet)
  - Owner information (name, ID number, phone)
  - Land use type selector
  - Object type
  - Notes/comments section
  - "Search Land Parcel" button → modal to lookup by số tờ/thửa
- **Right Panel:** Interactive map
  - Display GPS point with accuracy circle
  - Show existing polygon from mobile app
  - **Polygon editing tools:**
    - Add/remove vertices
    - Draw new polygon from scratch
    - Clear polygon
    - Calculate area
  - Layer controls (satellite, street map, admin boundaries)
  - Zoom to location
- **Bottom:** Photo gallery (from mobile app)
  - Thumbnail view with lightbox
  - EXIF data display (GPS, timestamp)
- **Actions:**
  - "Save Draft" - Save changes without submitting
  - "Submit for Review" - Send to supervisor (status → reviewed)
  - "Reject & Return" - Send back to mobile officer with notes

**5.4 Land Parcel Search Modal**
- Input: Parcel code (số tờ/số thửa) OR click map to select
- Display parcel boundary on map
- Show owner info: name, ID, certificate number
- Button: "Copy to Survey" - auto-fill owner fields
- Integration with national land database API (if available)

**5.5 Full Map View**
- Cluster markers for surveys
- Color-coded by status (pending=yellow, reviewed=blue, approved=green)
- Click marker → popup with basic info + "Open Detail" button
- Draw tools for area selection
- Export visible area as GeoJSON

**Files:**
- `app/(commune)/dashboard/page.tsx`
- `app/(commune)/surveys/page.tsx`
- `app/(commune)/surveys/[id]/page.tsx`
- `app/(commune)/map/page.tsx`
- `components/commune/SurveyList.tsx`
- `components/commune/SurveyDetailMap.tsx`
- `components/commune/MetadataForm.tsx`
- `components/commune/LandParcelSearchModal.tsx`
- `components/commune/PolygonEditor.tsx`
- `components/commune/PhotoGallery.tsx`

---

### Task 6: Commune Supervisor Interface

**Page Structure:**
```
/supervisor
  /dashboard          - Overview of pending reviews
  /reviews            - List of submissions awaiting approval
  /reviews/[id]       - Review detail with approve/reject
  /history            - All processed reviews
```

**Subtasks:**

**6.1 Dashboard Page**
- Pending reviews count
- Average approval time
- Approval/rejection rates
- Officer performance stats (submissions per officer)

**6.2 Reviews List Page**
- Table of surveys with status "reviewed" (waiting for supervisor)
- Show officer who submitted, submission date
- Filters: date range, officer, object type
- Priority indicators (overdue reviews)

**6.3 Review Detail Page**
- **Read-only view** of all metadata
- Side-by-side comparison:
  - Original mobile submission data
  - Officer-added/edited data (highlight changes)
- Map view with polygon
- Photo gallery
- **Approval History Timeline:**
  - Mobile submission timestamp
  - Officer review timestamp
  - All edits/notes
- **Actions:**
  - "Approve & Submit to Central" - Status → approved_commune
  - "Request Changes" - Return to officer with notes (status → pending)
  - "Reject" - Mark as rejected with reason
- **Notes field** for supervisor comments

**Files:**
- `app/(supervisor)/dashboard/page.tsx`
- `app/(supervisor)/reviews/page.tsx`
- `app/(supervisor)/reviews/[id]/page.tsx`
- `app/(supervisor)/history/page.tsx`
- `components/supervisor/ReviewDetailView.tsx`
- `components/supervisor/ApprovalTimeline.tsx`
- `components/supervisor/ComparisonView.tsx`

---

### Task 7: Central Administrator Interface

**Page Structure:**
```
/central
  /dashboard          - Nationwide analytics & map
  /locations          - All approved location IDs
  /locations/[id]     - Location ID detail
  /approvals          - Process commune approvals
  /analytics          - Advanced analytics & reports
  /users              - User management
  /config             - System configuration
```

**Subtasks:**

**7.1 Dashboard Page**
- **Map View:**
  - Nationwide heatmap of location density
  - Admin boundary layers (province, district, commune)
  - Clickable regions → drill down to district → commune
  - Status overlays (pending, approved, published)
- **Stats Cards:**
  - Total locations in system
  - Pending central approvals
  - IDs assigned this month
  - Coverage percentage by province
- **Charts:**
  - Submissions over time (line chart)
  - Object type distribution (pie chart)
  - Status breakdown (bar chart)
  - Top 10 provinces by submissions

**7.2 Approvals Queue**
- List of surveys with status "approved_commune" (waiting for central approval)
- Auto-review for data quality:
  - Check required fields present
  - Validate GPS within Vietnam boundaries
  - Verify polygon closure
  - Flag duplicates (nearby existing locations)
- Bulk approve with auto-ID generation
- Manual review for flagged items

**7.3 Location IDs Page**
- Searchable table of all assigned location IDs
- Filters: province, district, commune, date range, status
- Show: ID, address, coordinates, assignment date, status
- Export options: CSV, Excel, GeoJSON, KML
- Deactivate/reactivate IDs (with reason)

**7.4 Analytics Page**
- **Custom report builder:**
  - Date range selector
  - Geographic filters (province, district, commune)
  - Metrics: count, avg processing time, approval rates
  - Group by: object type, land use type, time period
  - Export as PDF, Excel
- **Pre-built reports:**
  - Monthly rollout progress
  - Officer productivity
  - Data quality metrics
  - SLA compliance (processing time targets)

**7.5 User Management**
- List all web users (commune officers, supervisors)
- Create/edit users
- Assign roles and jurisdictions
- Deactivate accounts
- Audit log view (user actions)

**7.6 System Configuration**
- Edit system parameters:
  - ID sequence number ranges
  - SLA targets (e.g., 48 hours for commune review)
  - Required fields configuration
  - Map tile server URLs
  - API keys for external services
- Manage reference data:
  - Land use types
  - Object types
  - Admin units (sync from national DB)

**Files:**
- `app/(central)/dashboard/page.tsx`
- `app/(central)/locations/page.tsx`
- `app/(central)/locations/[id]/page.tsx`
- `app/(central)/approvals/page.tsx`
- `app/(central)/analytics/page.tsx`
- `app/(central)/users/page.tsx`
- `app/(central)/config/page.tsx`
- `components/central/NationwideMap.tsx`
- `components/central/StatsCards.tsx`
- `components/central/Charts.tsx`
- `components/central/ApprovalQueue.tsx`
- `components/central/UserManagement.tsx`
- `components/central/ReportBuilder.tsx`

---

### Task 8: Shared UI Components

**Map Components:**
1. `components/map/BaseMap.tsx` - Leaflet/Mapbox wrapper
2. `components/map/MarkerCluster.tsx` - Cluster markers for performance
3. `components/map/PolygonEditor.tsx` - Editable polygon layer
4. `components/map/DrawControls.tsx` - Drawing toolbar
5. `components/map/LayerSwitcher.tsx` - Base map switcher
6. `components/map/LocationMarker.tsx` - Custom marker for surveys
7. `components/map/MeasureTool.tsx` - Distance/area measurement

**Data Display Components:**
8. `components/ui/DataTable.tsx` - Reusable table with sorting/filtering
9. `components/ui/StatusBadge.tsx` - Color-coded status badges
10. `components/ui/PhotoViewer.tsx` - Lightbox gallery
11. `components/ui/Timeline.tsx` - Approval history timeline
12. `components/ui/StatsCard.tsx` - Dashboard stat cards
13. `components/ui/Chart.tsx` - Recharts wrapper for analytics

**Form Components:**
14. `components/forms/AddressFields.tsx` - Vietnamese address input
15. `components/forms/OwnerInfoFields.tsx` - Owner data fields
16. `components/forms/LandUseTypeSelector.tsx` - Hierarchical selector
17. `components/forms/DateRangePicker.tsx` - Date range filter

**Layout Components:**
18. `components/layout/Sidebar.tsx` - Role-based navigation
19. `components/layout/Header.tsx` - User menu, notifications
20. `components/layout/Breadcrumbs.tsx` - Navigation breadcrumbs

---

### Task 9: Map Integration (Leaflet.js)

**Subtasks:**
1. Install dependencies: `leaflet`, `react-leaflet`, `leaflet-draw`
2. Configure Leaflet CSS imports
3. Create PostGIS-backed vector tile layer
4. Implement polygon draw/edit tools
5. Add marker clustering for performance
6. Create custom map controls (zoom to extent, locate me)
7. Implement spatial search (click to find nearby surveys)
8. Add layer switcher (satellite, street, admin boundaries)
9. Optimize for mobile/tablet responsiveness
10. Add offline tile caching (service worker)

**Files:**
- `lib/map/leaflet-config.ts`
- `lib/map/tile-layers.ts`
- `lib/map/spatial-utils.ts`
- `components/map/*` (as listed in Task 8)

---

### Task 10: Real-time Features (Supabase Realtime)

**Subtasks:**
1. Set up Realtime subscription for `survey_locations` table
2. Update commune officer dashboard when new mobile submissions arrive
3. Update supervisor dashboard when officer submits review
4. Show live status changes on survey list pages
5. Display notification toasts for real-time events
6. Implement optimistic UI updates
7. Handle subscription cleanup on unmount
8. Add presence indicators (show who's viewing a survey)

**Files:**
- `lib/realtime/subscriptions.ts`
- `lib/realtime/use-realtime-surveys.ts`
- `components/ui/RealtimeNotification.tsx`

---

### Task 11: Data Export & Reporting

**Subtasks:**
1. Create CSV export for survey lists
2. Create Excel export with multiple sheets (surveys, metadata, photos)
3. Create GeoJSON export for GIS software
4. Create KML export for Google Earth
5. Generate PDF reports with maps and photos
6. Implement server-side export for large datasets
7. Add download progress indicator
8. Create scheduled export jobs (daily backups)

**Files:**
- `lib/export/csv-exporter.ts`
- `lib/export/excel-exporter.ts`
- `lib/export/geojson-exporter.ts`
- `lib/export/kml-exporter.ts`
- `lib/export/pdf-generator.ts`
- `app/api/export/*`

---

### Task 12: Testing & Quality Assurance

**Subtasks:**

**Unit Tests:**
1. Test Edge Functions (location ID generation logic)
2. Test API routes (auth, CRUD operations)
3. Test utility functions (coordinate conversions, validators)
4. Test React hooks (auth, realtime, data fetching)

**Integration Tests:**
5. Test full approval workflow (commune → supervisor → central)
6. Test map interactions (polygon editing, marker placement)
7. Test data export functions
8. Test RLS policies (users can't access unauthorized data)

**E2E Tests (Playwright):**
9. Test commune officer workflow (login → review survey → submit)
10. Test supervisor workflow (login → approve → submit to central)
11. Test central admin workflow (approve → generate ID)
12. Test map functionality across browsers

**Performance Tests:**
13. Load test with 10,000+ surveys on map
14. Test database query performance
15. Test Edge Function response times

**Files:**
- `__tests__/unit/edge-functions/*.test.ts`
- `__tests__/unit/api/*.test.ts`
- `__tests__/integration/workflow.test.ts`
- `__tests__/e2e/commune-officer.spec.ts`
- `__tests__/e2e/supervisor.spec.ts`
- `__tests__/e2e/central-admin.spec.ts`

---

### Task 13: Deployment & DevOps

**Subtasks:**
1. Set up Vercel project for Next.js frontend
2. Configure environment variables (Supabase URL, keys)
3. Set up CI/CD pipeline (GitHub Actions)
4. Configure custom domain with SSL
5. Set up Supabase production instance
6. Run database migrations in production
7. Configure CDN for static assets (images, map tiles)
8. Set up monitoring (Vercel Analytics, Sentry for errors)
9. Configure backup strategy (daily Supabase backups)
10. Create deployment documentation
11. Set up staging environment for testing

**Files:**
- `.github/workflows/deploy.yml`
- `vercel.json`
- `supabase/config.toml`
- `docs/DEPLOYMENT.md`

---

## Project File Structure

```
c06-web-platform/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── reset-password/
│   │       └── page.tsx
│   ├── (commune)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── surveys/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── map/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (supervisor)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── reviews/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── history/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (central)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── locations/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── approvals/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── users/
│   │   │   └── page.tsx
│   │   ├── config/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── surveys/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── approve/
│   │   │       │   └── route.ts
│   │   │       ├── reject/
│   │   │       │   └── route.ts
│   │   │       └── metadata/
│   │   │           └── route.ts
│   │   ├── land-parcels/
│   │   │   └── search/
│   │   │       └── route.ts
│   │   ├── analytics/
│   │   │   └── dashboard/
│   │   │       └── route.ts
│   │   ├── users/
│   │   │   └── route.ts
│   │   └── export/
│   │       └── [format]/
│   │           └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── RoleGate.tsx
│   ├── commune/
│   │   ├── SurveyList.tsx
│   │   ├── SurveyDetailMap.tsx
│   │   ├── MetadataForm.tsx
│   │   ├── LandParcelSearchModal.tsx
│   │   ├── PolygonEditor.tsx
│   │   └── PhotoGallery.tsx
│   ├── supervisor/
│   │   ├── ReviewDetailView.tsx
│   │   ├── ApprovalTimeline.tsx
│   │   └── ComparisonView.tsx
│   ├── central/
│   │   ├── NationwideMap.tsx
│   │   ├── StatsCards.tsx
│   │   ├── Charts.tsx
│   │   ├── ApprovalQueue.tsx
│   │   ├── UserManagement.tsx
│   │   └── ReportBuilder.tsx
│   ├── map/
│   │   ├── BaseMap.tsx
│   │   ├── MarkerCluster.tsx
│   │   ├── PolygonEditor.tsx
│   │   ├── DrawControls.tsx
│   │   ├── LayerSwitcher.tsx
│   │   ├── LocationMarker.tsx
│   │   └── MeasureTool.tsx
│   ├── ui/
│   │   ├── DataTable.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── PhotoViewer.tsx
│   │   ├── Timeline.tsx
│   │   ├── StatsCard.tsx
│   │   └── Chart.tsx
│   ├── forms/
│   │   ├── AddressFields.tsx
│   │   ├── OwnerInfoFields.tsx
│   │   ├── LandUseTypeSelector.tsx
│   │   └── DateRangePicker.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── Breadcrumbs.tsx
├── lib/
│   ├── auth/
│   │   ├── supabase-client.ts
│   │   ├── auth-context.tsx
│   │   └── use-auth.ts
│   ├── map/
│   │   ├── leaflet-config.ts
│   │   ├── tile-layers.ts
│   │   └── spatial-utils.ts
│   ├── realtime/
│   │   ├── subscriptions.ts
│   │   └── use-realtime-surveys.ts
│   ├── export/
│   │   ├── csv-exporter.ts
│   │   ├── excel-exporter.ts
│   │   ├── geojson-exporter.ts
│   │   ├── kml-exporter.ts
│   │   └── pdf-generator.ts
│   ├── api/
│   │   ├── client.ts
│   │   └── queries.ts
│   └── utils/
│       ├── validation.ts
│       ├── formatters.ts
│       └── constants.ts
├── supabase/
│   ├── migrations/
│   │   ├── 20250121_web_platform_schema.sql
│   │   ├── 20250121_rls_policies.sql
│   │   └── 20250121_indexes.sql
│   ├── functions/
│   │   ├── generate-location-id/
│   │   │   └── index.ts
│   │   ├── approval-workflow/
│   │   │   └── index.ts
│   │   ├── land-parcel-lookup/
│   │   │   └── index.ts
│   │   ├── analytics/
│   │   │   └── index.ts
│   │   └── _shared/
│   │       ├── types.ts
│   │       └── auth.ts
│   ├── seed-web-users.sql
│   └── config.toml
├── __tests__/
│   ├── unit/
│   │   ├── edge-functions/
│   │   └── api/
│   ├── integration/
│   │   └── workflow.test.ts
│   └── e2e/
│       ├── commune-officer.spec.ts
│       ├── supervisor.spec.ts
│       └── central-admin.spec.ts
├── docs/
│   ├── API_DOCUMENTATION.md
│   ├── USER_GUIDE_COMMUNE.md
│   ├── USER_GUIDE_SUPERVISOR.md
│   ├── USER_GUIDE_CENTRAL.md
│   ├── DEPLOYMENT.md
│   └── SYSTEM_ARCHITECTURE.md
├── public/
│   ├── images/
│   └── map-tiles/
├── .env.local.example
├── .eslintrc.json
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- ✅ Database schema design
- ✅ Supabase setup & migrations
- ✅ Authentication system
- ✅ Basic Next.js project structure
- ✅ Shared UI components

### Phase 2: Commune Officer Interface (Week 3-4)
- ✅ Survey list page
- ✅ Survey detail page with map
- ✅ Metadata form
- ✅ Polygon editor
- ✅ Land parcel search integration
- ✅ Submit for review workflow

### Phase 3: Commune Supervisor Interface (Week 5)
- ✅ Review dashboard
- ✅ Review detail page
- ✅ Approval/rejection workflow
- ✅ Comparison view (original vs edited)
- ✅ Approval timeline

### Phase 4: Central Administrator Interface (Week 6-7)
- ✅ Nationwide dashboard
- ✅ Approval queue
- ✅ Location ID generation (Edge Function)
- ✅ Analytics & reporting
- ✅ User management
- ✅ System configuration

### Phase 5: Advanced Features (Week 8-9)
- ✅ Real-time subscriptions
- ✅ Data export (CSV, GeoJSON, KML, PDF)
- ✅ Advanced analytics
- ✅ Audit logging
- ✅ Map optimizations

### Phase 6: Testing & Deployment (Week 10)
- ✅ Unit tests
- ✅ Integration tests
- ✅ E2E tests
- ✅ Performance optimization
- ✅ Production deployment
- ✅ User training documentation

---

## Key Technical Decisions

### 1. **Next.js App Router** over Pages Router
- Better server-side rendering
- Improved routing with nested layouts
- Built-in loading/error states

### 2. **Leaflet.js** over Mapbox GL JS
- Open-source, no API key required
- Extensive plugin ecosystem (Leaflet.draw, MarkerCluster)
- Better PostGIS integration

### 3. **Supabase Edge Functions** over Next.js API Routes for business logic
- Closer to database (lower latency)
- Scalable serverless execution
- Built-in auth integration

### 4. **Tailwind CSS** for styling
- Rapid prototyping
- Consistent design system
- Excellent performance (purged CSS)

### 5. **Zustand** for client-side state
- Lighter than Redux
- Better TypeScript support
- Simpler API

---

## Security Considerations

1. **Row Level Security (RLS):** All database tables have RLS policies
2. **Role-based access control:** Middleware validates user roles before route access
3. **Audit logging:** All critical actions logged to `audit_logs` table
4. **SQL injection prevention:** Use Supabase's parameterized queries
5. **CSRF protection:** Next.js built-in CSRF tokens
6. **XSS prevention:** React auto-escapes, use `dangerouslySetInnerHTML` sparingly
7. **Rate limiting:** Implement on Edge Functions for public endpoints
8. **HTTPS only:** Enforce SSL for all connections
9. **Secrets management:** Use Vercel environment variables, never commit `.env`

---

## Performance Optimization

1. **Map clustering:** Use MarkerCluster for 1000+ points
2. **Lazy loading:** Code-split map components with `next/dynamic`
3. **Database indexing:** All foreign keys and frequently queried columns indexed
4. **Image optimization:** Use Next.js `Image` component for photos
5. **CDN caching:** Static assets served from Cloudflare
6. **Query optimization:** Use Supabase's `select` to fetch only needed fields
7. **Server-side pagination:** Limit queries to 50 records per page
8. **Realtime throttling:** Debounce realtime updates to 1 second

---

## Monitoring & Logging

1. **Vercel Analytics:** Track page views, load times
2. **Sentry:** Error tracking and reporting
3. **Supabase Logs:** Monitor Edge Function execution
4. **Custom audit logs:** Track all approval actions
5. **Uptime monitoring:** Use UptimeRobot or similar
6. **Performance metrics:** Track API response times with Vercel Speed Insights

---

## Future Enhancements

1. **Mobile-responsive design:** Optimize for tablets used in field
2. **Offline mode:** Service worker for offline map viewing
3. **Bulk import:** CSV upload for land parcel data
4. **API for external systems:** REST API for national ID systems
5. **Machine learning:** Auto-detect object types from photos
6. **Blockchain integration:** Immutable audit trail for location IDs
7. **Multi-language support:** English interface for international observers
8. **Advanced search:** Full-text search with Postgres GIN indexes

---

## Success Metrics

- **Performance:** < 2s page load time, < 500ms API response
- **Reliability:** 99.9% uptime
- **Data quality:** < 1% rejection rate from central
- **User adoption:** 90%+ of communes using system within 6 months
- **Processing time:** Average 48 hours from mobile submission to central approval

---

## Getting Started

```bash
# 1. Clone repository
git clone https://github.com/your-org/c06-web-platform.git
cd c06-web-platform

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Run database migrations
npx supabase db push

# 5. Seed initial data
npx supabase db seed

# 6. Start development server
npm run dev

# 7. Open browser
http://localhost:3000
```

---

## Documentation Index

- **[API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - All API endpoints, request/response formats
- **[USER_GUIDE_COMMUNE.md](docs/USER_GUIDE_COMMUNE.md)** - Commune officer manual (Vietnamese)
- **[USER_GUIDE_SUPERVISOR.md](docs/USER_GUIDE_SUPERVISOR.md)** - Supervisor manual (Vietnamese)
- **[USER_GUIDE_CENTRAL.md](docs/USER_GUIDE_CENTRAL.md)** - Central admin manual (Vietnamese)
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment instructions
- **[SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md)** - Technical architecture diagrams

---

## Support & Contact

- **Technical Issues:** Open GitHub issue
- **User Support:** support@c06.gov.vn (fictional)
- **System Admin:** admin@c06.gov.vn (fictional)

---

**Ready to build Vietnam's nationwide location identification platform! 🇻🇳**
