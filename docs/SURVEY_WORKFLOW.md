# Survey Workflow and Validation Rules

## Overview

This document describes the complete survey workflow in the LocationID Tracker (C06) mobile app, including screen transitions, data validation rules, and business logic.

## Complete Survey Flow

```
Login
  ↓
Dashboard
  ↓ (Tap "Bắt đầu khảo sát")
Start Survey
  ↓ (Select object type, enter object ID)
GPS Capture
  ↓ (Capture GPS coordinates)
Photo Capture
  ↓ (Take 1+ photos)
Owner Info
  ↓ (Enter location and owner details)
Usage Info
  ↓ (Select land use type)
Polygon Drawing
  ↓ (Draw boundary - optional)
Review & Submit
  ↓ (Validate and submit)
Submission Success
  ↓
Dashboard / New Survey / History
```

## Screen-by-Screen Workflow

### 1. Login Screen (`screens/LoginScreen.tsx`)

**Purpose:** Authenticate commune police officers using their 12-digit ID number.

**Input Fields:**
- `idNumber`: 12-digit police ID number (required)
- `password`: Password (required)

**Validation Rules:**
- ID must be exactly 12 digits
- ID must contain only numbers
- Password cannot be empty

**Business Logic:**
- ID number is converted to email format: `{idNumber}@police.gov.vn`
- Calls `authStore.signIn()` which uses Supabase Auth
- On success: Session persisted to AsyncStorage, profile fetched, navigate to Dashboard
- On error: Display Vietnamese error message from `services/auth.ts`

**Navigation:**
- Success → Dashboard
- No alternate paths (must login to use app)

---

### 2. Dashboard Screen (`screens/DashboardScreen.tsx`)

**Purpose:** Main hub showing survey statistics and app status.

**Display Elements:**
- Welcome message with officer's full name
- Statistics cards:
  - Unsynced surveys count (from `syncStore.queue`)
  - Draft surveys count (from `surveyStore.drafts`)
  - Online/offline status (from `syncStore.isOnline`)
- Action buttons:
  - "Bắt đầu khảo sát mới" (Start new survey)
  - "Lịch sử khảo sát" (Survey history)
  - "Cài đặt" (Settings)

**Validation Rules:**
- None (display-only screen)

**Business Logic:**
- Loads user profile from `authStore.user`
- Counts pending surveys from sync queue
- Counts draft surveys from AsyncStorage
- Shows offline banner if `isOnline === false`

**Navigation:**
- "Bắt đầu khảo sát mới" → StartSurveyScreen
- Unsynced card → HistoryScreen
- Drafts card → DraftsScreen
- History button → HistoryScreen
- Settings button → SettingsScreen

---

### 3. Start Survey Screen (`screens/StartSurveyScreen.tsx`)

**Purpose:** Initialize a new survey by selecting object type and assigning ID.

**Input Fields:**
- `objectType`: Type of location being surveyed (required, dropdown)
  - Options from `ref_object_types` table (e.g., "Nhà ở", "Cơ quan", "Cửa hàng")
- `objectIdNumber`: Custom ID for the location (optional, text input)

**Validation Rules:**
- Object type must be selected (required field)
- Object ID has no format restrictions (free text)

**Business Logic:**
- Calls `surveyStore.startNewSurvey()` which:
  - Generates unique survey ID: `survey-{userId}-{timestamp}`
  - Creates initial survey object with object type/ID
  - Sets status to 'draft'
  - Saves to AsyncStorage
- Survey is now in "active" state in `surveyStore.currentSurvey`

**Navigation:**
- Next → GPSCaptureScreen
- Back → Dashboard (discards unsaved survey)

---

### 4. GPS Capture Screen (`screens/GPSCaptureScreen.tsx`)

**Purpose:** Capture GPS coordinates of the surveyed location.

**Display Elements:**
- Current GPS coordinates (latitude, longitude, accuracy)
- Map view showing GPS marker
- "Làm mới GPS" button to re-capture
- "Tiếp tục" button to proceed

**Validation Rules:**
- GPS coordinates must be captured (required)
- Accuracy should be < 20m (warning shown if worse, but not blocking)

**Business Logic:**
- Requests location permission via `expo-location`
- If permission denied: Shows error, cannot proceed
- If permission granted:
  - Gets current position with `getCurrentPositionAsync()`
  - Updates `surveyStore.currentSurvey.gpsPoint` with `{ lat, lng, accuracy, timestamp }`
  - Auto-saves draft
- Map shows marker at captured coordinates

**Navigation:**
- Next → PhotoCaptureScreen (requires GPS captured)
- Back → StartSurveyScreen

---

### 5. Photo Capture Screen (`screens/PhotoCaptureScreen.tsx`)

**Purpose:** Capture photos of the surveyed location.

**Display Elements:**
- Photo grid showing captured photos
- "Chụp ảnh" button (opens camera)
- "Chọn từ thư viện" button (opens gallery)
- "Tiếp tục" button (enabled when at least 1 photo)

**Validation Rules:**
- At least 1 photo required
- Maximum 10 photos per survey
- Photos must be accessible via URI

**Business Logic:**
- Uses `expo-image-picker` for camera/gallery access
- Requests camera/media library permissions
- On photo selected:
  - Stores `localUri` in `surveyStore.currentSurvey.photos[]`
  - Each photo object: `{ id, localUri, capturedAt }`
  - Auto-saves draft
- Photos are NOT uploaded yet (happens during submission)
- Grid displays thumbnails with delete option

**Navigation:**
- Next → OwnerInfoScreen (requires >= 1 photo)
- Back → GPSCaptureScreen

---

### 6. Owner Info Screen (`screens/OwnerInfoScreen.tsx`)

**Purpose:** Collect information about the location and its owner.

**Input Fields:**
- `locationName`: Name/label for the location (required)
- `ownerName`: Owner or representative name (optional)
- `ownerIdNumber`: Owner's ID number (optional, 9 or 12 digits if provided)
- `addressNumber`: House/building number (required)
- `addressStreet`: Street name (required)
- `addressCommune`: Commune/ward name (required)
- `addressDistrict`: District name (required)
- `addressProvince`: Province/city name (required)
- `notes`: Additional notes (optional)

**Validation Rules:**
- Location name: Required, non-empty
- Address fields (number, street, commune, district, province): Required
- Owner name: Optional
- Owner ID: Optional, but if provided must be 9 or 12 digits
- Notes: Optional, free text

**Business Logic:**
- All inputs update `surveyStore.currentSurvey` via `updateSurvey()`
- Auto-saves draft on each change
- Validates on "Tiếp tục":
  - Checks all required fields filled
  - Validates owner ID format if provided
  - Shows error alert if validation fails

**Navigation:**
- Next → UsageInfoScreen (requires validation pass)
- Back → PhotoCaptureScreen

---

### 7. Usage Info Screen (`screens/UsageInfoScreen.tsx`)

**Purpose:** Select land use type from Vietnamese cadastral categories.

**Display Elements:**
- Main category picker (8 categories)
- Subtype picker (appears after main category selected)
- Selected category display

**Validation Rules:**
- Main category must be selected (required)
- Subtype must be selected if main category has subtypes (required)

**Business Logic:**
- Loads land use types from `referenceData.getLandUseTypes()`
- Categories cached in AsyncStorage for offline use
- Main categories:
  1. Đất ở (Residential)
  2. Đất thương mại, dịch vụ (Commercial/Service)
  3. Đất nông nghiệp (Agricultural)
  4. Đất công cộng (Public)
  5. Đất công nghiệp (Industrial)
  6. Đất hạ tầng (Infrastructure)
  7. Đất quốc phòng, an ninh (Defense/Security)
  8. Đất khác (Other)
- Each category has multiple subtypes (2-6 subtypes each)
- Stores selected `landUseTypeCode` in survey (e.g., "LU001", "LU002")
- Auto-saves draft

**Navigation:**
- Next → PolygonDrawScreen
- Back → OwnerInfoScreen

---

### 8. Polygon Drawing Screen (`screens/PolygonDrawScreen.tsx`)

**Purpose:** Optionally draw boundary polygon for the surveyed location.

**Display Elements:**
- Map showing GPS marker
- Drawn polygon boundary
- Numbered vertex markers
- Control buttons: "Hoàn tác", "Xóa hết", "Bỏ qua", "Lưu và tiếp tục"

**Validation Rules:**
- Polygon is OPTIONAL
- If drawing, must have at least 3 vertices
- Vertices stored as lat/lng coordinates

**Business Logic:**
- Map centered on survey GPS point
- User taps map to add vertices
- Vertices stored in `surveyStore.currentSurvey.vertices[]`
- Each vertex: `{ lat, lng, order }`
- Polygon automatically closed (first vertex repeated at end for GeoJSON)
- "Hoàn tác" removes last vertex
- "Xóa hết" clears all vertices
- "Bỏ qua" skips polygon (proceeds with empty vertices array)
- "Lưu và tiếp tục" saves vertices and proceeds
- Auto-saves draft

**Navigation:**
- Next → ReviewSubmitScreen
- Skip → ReviewSubmitScreen (with empty vertices)
- Back → UsageInfoScreen

---

### 9. Review & Submit Screen (`screens/ReviewSubmitScreen.tsx`)

**Purpose:** Review all collected data and submit the survey.

**Display Elements:**
- GPS section (coordinates, accuracy)
- Photos section (thumbnail grid)
- Location info section (name, address)
- Owner info section (name, ID)
- Land use section (selected category)
- Polygon section (vertex count, or "Chưa vẽ")
- Validation checklist showing missing required fields
- Online/offline status badge
- "Gửi khảo sát" button

**Validation Rules:**
- GPS coordinates: Required
- Photos: At least 1 required
- Location name: Required
- Address (number, street, commune, district, province): Required
- Land use type: Required
- Polygon: Optional
- Owner info: Optional

**Business Logic:**
- Validates all required fields:
  - GPS captured
  - Photos array has length > 0
  - Location name not empty
  - All address fields not empty
  - Land use type code not empty
- If validation fails:
  - Shows alert listing missing fields
  - "Gửi khảo sát" button disabled
  - Missing items highlighted
- If validation passes and user taps "Gửi khảo sát":
  - Calls `surveyStore.submitSurvey()`
  - **Online mode:**
    - Creates location record in `survey_locations` table
    - Uploads photos to Supabase Storage (`survey-photos` bucket)
    - Creates photo records in `survey_media` table
    - Creates polygon in `rough_area` column (PostGIS GEOMETRY)
    - Creates vertex records in `survey_vertices` table
    - On success: Deletes draft, navigates to SubmissionSuccessScreen
  - **Offline mode:**
    - Adds complete survey data to `syncStore.queue`
    - Saves photos locally (already have URIs)
    - On success: Deletes draft, navigates to SubmissionSuccessScreen
- Edit links allow navigating back to any step to fix issues

**Navigation:**
- Submit → SubmissionSuccessScreen
- Edit GPS → GPSCaptureScreen
- Edit Photos → PhotoCaptureScreen
- Edit Owner → OwnerInfoScreen
- Edit Usage → UsageInfoScreen
- Edit Polygon → PolygonDrawScreen
- Back → PolygonDrawScreen

---

### 10. Submission Success Screen (`screens/SubmissionSuccessScreen.tsx`)

**Purpose:** Confirm successful submission and provide next actions.

**Display Elements:**
- Success message (online or offline variant)
- Status badge (Đã đồng bộ / Chờ đồng bộ)
- Info cards explaining what happened
- Action buttons: "Về Dashboard", "Khảo sát mới"

**Validation Rules:**
- None (confirmation-only screen)

**Business Logic:**
- Shows different messages based on `syncStore.isOnline`:
  - **Online:** "Đã gửi và đồng bộ thành công" - data synced immediately
  - **Offline:** "Đã lưu, sẽ tự động đồng bộ khi online" - queued for sync
- Displays queue count if offline
- "Về Dashboard" navigates home
- "Khảo sát mới" starts a new survey immediately

**Navigation:**
- "Về Dashboard" → DashboardScreen
- "Khảo sát mới" → StartSurveyScreen (clears previous survey)

---

## Supporting Screens

### History Screen (`screens/HistoryScreen.tsx`)

**Purpose:** View past surveys (synced and pending).

**Display Elements:**
- List of surveys with:
  - Location name
  - Status badge (Đã đồng bộ / Đang chờ / Thất bại)
  - Photo count
  - Polygon indicator
  - Relative timestamp
- Pull-to-refresh
- Empty state if no surveys

**Business Logic:**
- Fetches synced surveys from `survey_locations` table via `surveyService.getLocationsByUser()`
- Merges with pending surveys from `syncStore.queue`
- Sorts by created date (newest first)
- Pull-to-refresh reloads data
- Tapping a survey shows details (future enhancement)

**Navigation:**
- Back → DashboardScreen

---

### Drafts Screen (`screens/DraftsScreen.tsx`)

**Purpose:** Resume incomplete surveys.

**Display Elements:**
- List of draft surveys with:
  - Location name (or "Chưa đặt tên")
  - Progress indicators (GPS ✓, Photos ✓, etc.)
  - Completion stats
  - Relative timestamp
- Delete option (swipe or long-press)
- Empty state if no drafts

**Business Logic:**
- Loads all drafts from AsyncStorage via `surveyStore.getAllDrafts()`
- Shows completion status for each step
- Resume draft:
  - Loads draft into `surveyStore.currentSurvey`
  - Determines next incomplete step
  - Navigates to appropriate screen:
    - No GPS → GPSCaptureScreen
    - No photos → PhotoCaptureScreen
    - No owner info → OwnerInfoScreen
    - No land use → UsageInfoScreen
    - Has all required → ReviewSubmitScreen
- Delete draft:
  - Shows confirmation alert
  - Calls `surveyStore.deleteDraft(id)`
  - Removes from AsyncStorage

**Navigation:**
- Resume → Appropriate step screen
- Back → DashboardScreen

---

### Settings Screen (`screens/SettingsScreen.tsx`)

**Purpose:** View officer info, manage sync, export data, logout.

**Display Elements:**
- Officer info (ID, name, phone, unit)
- Sync status:
  - Online/offline badge
  - Last sync time
  - Pending/failed counts
  - "Đồng bộ ngay" button
- Data management:
  - "Xuất dữ liệu" button
- App info (version)
- "Đăng xuất" button

**Business Logic:**
- Displays `authStore.user` profile
- Displays `syncStore` status
- Manual sync:
  - Calls `syncStore.syncAll()`
  - Shows loading state
  - Shows success/error alert
- Export data:
  - Calls `dataExportService.exportAllData()`
  - Creates JSON backup file
  - Opens system share sheet
- Logout:
  - Shows confirmation alert
  - Calls `authStore.signOut()`
  - Clears session from AsyncStorage
  - Navigates to LoginScreen

**Navigation:**
- Back → DashboardScreen
- Logout → LoginScreen

---

## Data Flow Patterns

### Draft Auto-Save

Every screen that modifies survey data calls:
```typescript
surveyStore.updateSurvey(partialUpdate);
// Internally calls saveDraft() which writes to AsyncStorage
```

**Auto-save triggers:**
- Object type/ID selected (StartSurveyScreen)
- GPS captured (GPSCaptureScreen)
- Photo added/removed (PhotoCaptureScreen)
- Owner info field changed (OwnerInfoScreen)
- Land use type selected (UsageInfoScreen)
- Polygon vertex added/removed (PolygonDrawScreen)

**Storage key format:**
```
@survey_draft_{surveyId}
```

### Submission Flow (Online)

```
ReviewSubmitScreen
  ↓ User taps "Gửi khảo sát"
surveyStore.submitSurvey()
  ↓ isOnline = true
surveyService.submitSurvey()
  ↓
1. Create location record (survey_locations table)
   - Converts GPS to PostGIS GEOGRAPHY Point
   - Saves all metadata
  ↓
2. Upload photos (for each photo in photos[])
   - Read file via FileSystem
   - Convert to blob/arrayBuffer
   - Upload to Supabase Storage (survey-photos bucket)
   - Create media record (survey_media table) with file_path
  ↓
3. Save polygon (if vertices exist)
   - Convert vertices to GeoJSON Polygon
   - Save to rough_area column (PostGIS GEOMETRY)
   - Create vertex records (survey_vertices table)
  ↓
Success: Return location ID
  ↓
surveyStore.deleteDraft() - remove from AsyncStorage
  ↓
Navigate to SubmissionSuccessScreen
```

### Submission Flow (Offline)

```
ReviewSubmitScreen
  ↓ User taps "Gửi khảo sát"
surveyStore.submitSurvey()
  ↓ isOnline = false
syncStore.addToQueue()
  ↓
Queue item created:
{
  id: uuid,
  type: 'survey_submission',
  surveyId: survey.id,
  data: { survey, photos, vertices },
  retryCount: 0,
  maxRetries: 5,
  createdAt: timestamp
}
  ↓
Saved to AsyncStorage (@sync_queue)
  ↓
surveyStore.deleteDraft() - remove from AsyncStorage
  ↓
Navigate to SubmissionSuccessScreen
  ↓
When network reconnects (NetInfo listener):
syncStore.syncAll()
  ↓
Process queue items (same steps as online submission)
  ↓
On success: Remove from queue
On error: Increment retryCount, save error message
```

### Background Sync

```
NetInfo listener (syncStore.ts)
  ↓ Connection state changes
NetInfo.addEventListener(state => {
  setOnlineStatus(state.isConnected);
  if (state.isConnected) syncAll();
})
  ↓ isConnected = true
syncStore.syncAll()
  ↓
for each item in queue:
  try {
    if (type === 'survey_submission') syncSurvey(item)
    success → removeFromQueue(item.id)
  } catch (error) {
    if (isNetworkError) break; // stop processing
    updateQueueItem(item.id, {
      retryCount: item.retryCount + 1,
      lastAttempt: now,
      error: error.message
    });
    if (retryCount >= maxRetries) mark as failed
  }
```

## Validation Summary

### Required Fields by Screen

| Screen | Required Fields | Optional Fields |
|--------|----------------|-----------------|
| Login | idNumber, password | - |
| StartSurvey | objectType | objectIdNumber |
| GPSCapture | gpsPoint | - |
| PhotoCapture | photos (min 1) | - |
| OwnerInfo | locationName, address* | ownerName, ownerIdNumber, notes |
| UsageInfo | landUseTypeCode | - |
| PolygonDraw | - | vertices |
| ReviewSubmit | All above required | All above optional |

*Address includes: addressNumber, addressStreet, addressCommune, addressDistrict, addressProvince

### Field Format Rules

| Field | Format | Example |
|-------|--------|---------|
| idNumber (login) | 12 digits | "123456789012" |
| ownerIdNumber | 9 or 12 digits | "123456789" or "123456789012" |
| gpsPoint.lat | -90 to 90 | 21.028511 |
| gpsPoint.lng | -180 to 180 | 105.804817 |
| gpsPoint.accuracy | meters (prefer < 20) | 15.5 |
| landUseTypeCode | LU### format | "LU001" |
| photos | Array of URIs | ["file:///.../photo1.jpg"] |
| vertices | Array of {lat, lng, order} | [{lat: 21.0, lng: 105.8, order: 0}] |

### Error Messages (Vietnamese)

```typescript
// Login
"Vui lòng nhập mã cán bộ và mật khẩu"
"Mã cán bộ phải là 12 chữ số"
"Mã cán bộ hoặc mật khẩu không đúng"

// StartSurvey
"Vui lòng chọn loại đối tượng"

// GPSCapture
"Không thể lấy vị trí GPS. Vui lòng kiểm tra cài đặt."
"Độ chính xác GPS thấp. Vui lòng di chuyển ra ngoài trời."

// PhotoCapture
"Vui lòng chụp ít nhất 1 ảnh"
"Không thể truy cập camera. Vui lòng cấp quyền."

// OwnerInfo
"Vui lòng nhập tên địa điểm"
"Vui lòng nhập đầy đủ địa chỉ"
"Số CMND/CCCD không hợp lệ (phải là 9 hoặc 12 số)"

// UsageInfo
"Vui lòng chọn loại sử dụng đất"

// PolygonDraw
"Cần ít nhất 3 điểm để tạo đa giác"

// ReviewSubmit
"Thiếu thông tin bắt buộc: GPS, Ảnh, Tên địa điểm, Địa chỉ, Loại đất"
"Vui lòng hoàn thiện các bước bắt buộc trước khi gửi"
```

## State Persistence

### What Gets Saved Where

**AsyncStorage Keys:**

```typescript
// Auth
"@auth_session" // Supabase session (managed by SDK)

// Survey Drafts
"@survey_draft_{surveyId}" // Each draft saved separately
// Contains: { survey, photos, vertices, savedAt }

// Sync Queue
"@sync_queue" // Array of pending submissions
// Contains: [{ id, type, surveyId, data, retryCount, ... }]

// Reference Data Cache
"@land_use_types_cache" // Cadastral categories
"@admin_units_cache" // Province/district/commune data

// Sync Metadata
"@last_sync_time" // ISO timestamp of last successful sync
```

### Data Lifecycle

1. **Survey Creation:** Draft created in AsyncStorage
2. **User Updates:** Draft updated on each field change
3. **Submission (Online):** Draft deleted, data sent to Supabase
4. **Submission (Offline):** Draft deleted, data moved to sync queue
5. **Sync Success:** Queue item deleted
6. **Sync Failure:** Queue item updated with error, retryCount++
7. **Max Retries:** Queue item marked as failed (retryCount >= 5)

### Recovery Scenarios

| Scenario | Behavior |
|----------|----------|
| App closes during survey | Draft persists, resume from DraftsScreen |
| App closes during submission | Online: May partially succeed; Offline: Queued |
| Network drops during upload | Upload fails, added to queue, retries later |
| User force-closes app | All AsyncStorage data persists |
| App crashes | Last auto-saved draft recoverable |
| User logs out | Drafts remain (tied to device, not user) |
| User deletes app | All local data lost (AsyncStorage cleared) |

---

## Navigation Map

```
LoginScreen
  └─> DashboardScreen
       ├─> StartSurveyScreen
       │    └─> GPSCaptureScreen
       │         └─> PhotoCaptureScreen
       │              └─> OwnerInfoScreen
       │                   └─> UsageInfoScreen
       │                        └─> PolygonDrawScreen
       │                             └─> ReviewSubmitScreen
       │                                  └─> SubmissionSuccessScreen
       │                                       ├─> DashboardScreen
       │                                       └─> StartSurveyScreen
       ├─> HistoryScreen
       ├─> DraftsScreen
       │    └─> [Resume to appropriate step]
       └─> SettingsScreen
            └─> [Logout] LoginScreen
```

## Offline-First Guarantees

1. **All user actions work offline** - No network required for survey creation
2. **Instant UI updates** - Local state updates immediately, no loading spinners
3. **Auto-save** - User never loses data, even if app crashes
4. **Automatic sync** - When network returns, queued data syncs automatically
5. **Retry logic** - Failed syncs retry up to 5 times with exponential backoff
6. **Conflict-free** - Each survey has unique ID, no server conflicts
7. **Cached reference data** - Land use types and admin units cached locally

---

**Last Updated:** 2025-11-21
**Version:** 1.0
**Maintainer:** Claude Code Agent
