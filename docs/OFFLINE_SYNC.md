# Offline Mode & Sync Mechanisms

## Overview

The LocationID Tracker (C06) app implements a **robust offline-first architecture** where all user actions are saved locally first, then synchronized to Supabase when connectivity is available. This ensures field officers can work continuously regardless of network conditions.

## Architecture Principles

### 1. Offline-First Design

```
User Action → Local Storage → UI Update → Sync Queue → Background Sync → Supabase
     ↓
Instant Feedback
```

**Key Guarantees:**
- All data writes go to local storage FIRST
- UI updates immediately (no waiting for network)
- Network operations happen asynchronously in background
- App remains fully functional without internet
- Data is never lost due to connectivity issues

### 2. Three-Layer Storage System

| Layer | Technology | Purpose | Persistence |
|-------|-----------|---------|-------------|
| **Draft Storage** | AsyncStorage | Incomplete surveys being edited | Until submitted or deleted |
| **Sync Queue** | AsyncStorage | Submitted but unsynced surveys | Until successfully synced |
| **Remote Storage** | Supabase | Permanent database of record | Permanent |

## Network Connectivity Detection

### Implementation: `store/syncStore.ts`

```typescript
// NetInfo listener monitors connectivity changes
NetInfo.addEventListener((state) => {
  const isOnline = state.isConnected && state.isInternetReachable;
  syncStore.setOnlineStatus(isOnline);

  if (isOnline) {
    syncStore.syncAll(); // Auto-trigger sync on reconnect
  }
});
```

### Connectivity States

| State | Detection | UI Indicator | Behavior |
|-------|-----------|--------------|----------|
| **Online** | `isConnected && isInternetReachable` | Green badge "Trực tuyến" | Direct sync to Supabase |
| **Offline** | `!isConnected \|\| !isInternetReachable` | Yellow banner "Chế độ ngoại tuyến" | Queue for later sync |

### Visual Feedback

**OfflineBanner Component** (`components/OfflineBanner.tsx`):
- Automatically appears at top of screen when offline
- Animated slide-down transition (300ms)
- Yellow background with warning icon
- Vietnamese text: "Chế độ ngoại tuyến - Dữ liệu sẽ được đồng bộ khi kết nối lại"
- Slides up when back online

**Status Badges:**
- Dashboard: Shows current connectivity status
- Settings: Displays online/offline state
- Review Screen: Indicates submission mode (immediate vs queued)
- History: Shows sync status per survey (synced/pending/failed)

## Draft Auto-Save

### Purpose
Save incomplete surveys at any step so users can resume later without data loss.

### Implementation: `store/surveyStore.ts`

```typescript
// Auto-save triggered on every survey data update
updateSurvey: (updates) => {
  const state = get();
  const updated = { ...state.currentSurvey, ...updates };

  set({ currentSurvey: updated });

  if (updated.id) {
    saveDraft(updated, state.photos, state.polygonVertices); // Auto-save
  }
}
```

### Storage Schema

**AsyncStorage Key:** `@survey_draft_{surveyId}`

**Data Structure:**
```typescript
{
  survey: {
    id: string;           // UUID
    missionId?: string;
    objectType?: string;
    objectId?: string;
    // ... all survey fields
    createdAt: Date;
    updatedAt: Date;
  },
  photos: string[];       // Local file URIs
  vertices: Array<{       // Polygon boundary points
    lat: number;
    lng: number;
    order: number;
  }>,
  savedAt: string;        // ISO timestamp
}
```

### Draft Lifecycle

```
StartSurvey → Create Draft → Auto-save on each step
                ↓
            GPSCapture → Update GPS → Auto-save
                ↓
          PhotoCapture → Add photos → Auto-save
                ↓
           OwnerInfo → Fill form → Auto-save
                ↓
           UsageInfo → Select type → Auto-save
                ↓
         PolygonDraw → Draw boundary → Auto-save
                ↓
      ReviewSubmit → Submit → Clear draft
```

### Draft Management

**Load All Drafts:**
```typescript
const drafts = await surveyStore.getAllDrafts();
// Returns: Array of { survey, photos, vertices, savedAt }
```

**Resume Draft:**
```typescript
surveyStore.loadDraft(draftId);
// Loads into currentSurvey state
// Navigate to appropriate step based on completeness
```

**Delete Draft:**
```typescript
surveyStore.deleteDraft(draftId);
// Removes from AsyncStorage
```

### Draft Completeness Detection

Logic in `DraftsScreen.tsx` determines which step to resume:

```typescript
const getResumeScreen = (draft) => {
  if (!draft.survey.gpsPoint) return 'GPSCapture';
  if (draft.photos.length === 0) return 'PhotoCapture';
  if (!draft.survey.locationName) return 'OwnerInfo';
  if (!draft.survey.landUseTypeCode) return 'UsageInfo';
  return 'ReviewSubmit'; // All required fields present
};
```

## Sync Queue System

### Purpose
Store submitted surveys that couldn't sync to Supabase (offline or error), with automatic retry logic.

### Implementation: `store/syncStore.ts`

### Queue Schema

**AsyncStorage Key:** `@sync_queue`

**Queue Item Structure:**
```typescript
{
  id: string;              // UUID of queue item
  type: 'survey';          // Operation type
  surveyId: string;        // Survey UUID
  data: {
    survey: SurveyLocation;
    photos: string[];      // Local URIs
    vertices: Vertex[];
  },
  retryCount: number;      // Current retry attempt (0-5)
  maxRetries: number;      // Max allowed (default 5)
  lastAttempt?: Date;      // Last sync attempt timestamp
  error?: string;          // Last error message
  createdAt: Date;         // When queued
}
```

### Adding to Queue

**Triggered by:** Survey submission when offline OR when sync fails

```typescript
// In surveyStore.submitSurvey
if (!syncStore.isOnline) {
  await syncStore.addToQueue({
    type: 'survey',
    surveyId: survey.id,
    data: { survey, photos, vertices }
  });
}
```

### Queue Processing

**Auto-triggered on:**
1. Network reconnect (NetInfo listener)
2. Manual "Sync Now" button (Settings screen)
3. App foreground (future enhancement)

**Processing Logic:**
```typescript
syncAll: async () => {
  const queue = get().queue;

  for (const item of queue) {
    if (item.retryCount >= item.maxRetries) {
      continue; // Skip failed items
    }

    try {
      await syncSurvey(item); // Process survey
      removeFromQueue(item.id); // Remove on success
    } catch (error) {
      if (isNetworkError(error)) {
        break; // Stop processing, network still unstable
      } else {
        updateQueueItem(item.id, {
          retryCount: item.retryCount + 1,
          lastAttempt: new Date(),
          error: error.message
        });
      }
    }
  }
}
```

### Retry Strategy

| Attempt | Behavior | User Feedback |
|---------|----------|---------------|
| 0 | First attempt on reconnect | "Đang đồng bộ..." |
| 1-4 | Auto-retry on next trigger | Retry count shown in Settings |
| 5 | Max retries reached | Status badge: "Thất bại" (Failed) |

**No exponential backoff** - retries happen on network events, not timers.

### Sync Operations

#### 1. Survey Submission

**Service:** `syncStore.syncSurvey()`

**Steps:**
```typescript
1. Create location record in survey_locations
   - Convert GPS to PostGIS GEOGRAPHY(Point)
   - Convert polygon vertices to GEOMETRY(Polygon) if present
   - Insert all metadata (address, object type, land use, etc.)

2. Upload photos to Supabase Storage
   - Read file from local URI using FileSystem
   - Convert to ArrayBuffer
   - Upload to 'survey-photos' bucket
   - Create records in survey_media table

3. Save polygon vertices
   - Insert to survey_vertices table (for detailed access)
   - Linked to location via location_id foreign key
```

**PostGIS Conversion:**
```sql
-- GPS Point (WGS84)
ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography

-- Polygon (closed ring with first vertex repeated)
ST_SetSRID(
  ST_MakePolygon(
    ST_MakeLine(ARRAY[
      ST_MakePoint(lng1, lat1),
      ST_MakePoint(lng2, lat2),
      ST_MakePoint(lng3, lat3),
      ST_MakePoint(lng1, lat1)  -- Close the ring
    ])
  ),
  4326
)::geometry
```

#### 2. Photo Upload

**Service:** `syncStore.syncMedia()`

**File Handling:**
```typescript
import * as FileSystem from 'expo-file-system';

// Read file from local URI
const fileData = await FileSystem.readAsStringAsync(photoUri, {
  encoding: FileSystem.EncodingType.Base64
});

// Convert to blob
const response = await fetch(`data:image/jpeg;base64,${fileData}`);
const blob = await response.blob();
const arrayBuffer = await new Response(blob).arrayBuffer();

// Upload to Supabase Storage
const fileName = `photos/${surveyId}/${Date.now()}.jpg`;
await supabase.storage
  .from('survey-photos')
  .upload(fileName, arrayBuffer, {
    contentType: 'image/jpeg',
    cacheControl: '3600',
    upsert: false
  });
```

**Storage Bucket Configuration:**
- Bucket name: `survey-photos`
- Public access: No (authenticated users only)
- RLS enabled: Yes
- Max file size: 10 MB (configurable)

#### 3. Polygon Submission

**Service:** `syncStore.syncPolygon()`

**GeoJSON Format:**
```typescript
// Convert vertices to GeoJSON Polygon
const coordinates = [
  vertices.map(v => [v.lng, v.lat]), // Outer ring
  [vertices[0].lng, vertices[0].lat]  // Close the ring
];

const geoJson = {
  type: 'Polygon',
  coordinates: [coordinates]
};

// Saved to rough_area column as GEOMETRY
```

**Also saved to survey_vertices table:**
```sql
INSERT INTO survey_vertices (location_id, latitude, longitude, vertex_order)
VALUES
  (location_id, lat1, lng1, 0),
  (location_id, lat2, lng2, 1),
  (location_id, lat3, lng3, 2);
```

### Error Handling

**Network Errors** (retry):
- Connection timeout
- DNS resolution failure
- No internet access
- Server unreachable

**Non-Network Errors** (increment retry, continue):
- Invalid data format
- RLS policy violation
- Duplicate key
- Storage quota exceeded

**Error Messages:**
All errors stored in Vietnamese in queue item's `error` field:
```typescript
"Không thể kết nối đến máy chủ"
"Lỗi xác thực - vui lòng đăng nhập lại"
"Dung lượng lưu trữ đã đầy"
```

## Data Consistency Guarantees

### 1. Survey Submission Flow

**Online Submission:**
```
Submit → syncStore.syncSurvey()
          ↓
      Create location record
          ↓
      Upload photos
          ↓
      Save vertices
          ↓
      Clear draft
          ↓
      Navigate to Success screen
```

**Offline Submission:**
```
Submit → Add to sync queue
          ↓
      Clear draft (survey marked complete)
          ↓
      Navigate to Success screen
          ↓
      Background sync when online
```

### 2. Duplicate Prevention

**Survey IDs are UUIDs** generated client-side:
```typescript
const surveyId = uuid.v4(); // e.g., "550e8400-e29b-41d4-a716-446655440000"
```

**Primary key in database:**
```sql
survey_locations.id UUID PRIMARY KEY
```

**Idempotency:** If sync retries with same UUID, database prevents duplicates via primary key constraint.

### 3. Data Integrity

**Atomic Operations:**
- Survey submission is wrapped in try/catch
- Photos uploaded individually (one failure doesn't affect others)
- Vertices saved as batch insert

**Rollback on Failure:**
- If survey creation fails, photos aren't uploaded
- If photo upload fails, retry includes all photos
- Queue item retains complete data until fully synced

### 4. Local-Remote Merge

**History Screen** merges three data sources:

```typescript
const [syncedSurveys, setSyncedSurveys] = useState<SurveyLocation[]>([]);
const [pendingSurveys, setPendingSurveys] = useState<QueueItem[]>([]);

// Fetch synced from Supabase
const synced = await surveyService.getLocationsByUser(userId);

// Get pending from sync queue
const pending = syncStore.queue;

// Merge and display with status badges
```

**Status Determination:**
- **Synced:** Present in Supabase, not in queue
- **Pending:** In queue with retryCount < maxRetries
- **Failed:** In queue with retryCount >= maxRetries

## Performance Optimizations

### 1. Reference Data Caching

**Implementation:** `services/referenceData.ts`

**Cached Data:**
- Land use types (ref_land_use_types)
- Administrative units (ref_admin_units)

**Cache Strategy:**
```typescript
// Check cache first
const cached = await AsyncStorage.getItem('@land_use_types_cache');
if (cached) {
  return JSON.parse(cached);
}

// Fetch from Supabase
const { data } = await supabase
  .from('ref_land_use_types')
  .select('*')
  .order('display_order');

// Save to cache
await AsyncStorage.setItem('@land_use_types_cache', JSON.stringify(data));
```

**Cache Keys:**
- `@land_use_types_cache` - Cadastral categories
- `@admin_units_cache` - Provinces/districts/communes

**Cache Invalidation:**
- Manual: "Làm mới dữ liệu" button in Settings (future)
- Automatic: On app update or version change (future)
- Time-based: Not implemented (data rarely changes)

### 2. AsyncStorage Key Prefixes

| Prefix | Purpose | Example |
|--------|---------|---------|
| `@survey_draft_` | Survey drafts | `@survey_draft_550e8400...` |
| `@sync_queue` | Sync queue (single key, array value) | `@sync_queue` |
| `@land_use_types_cache` | Reference data cache | `@land_use_types_cache` |
| `@admin_units_cache` | Administrative units cache | `@admin_units_cache` |
| `@expo-auth-session-` | Supabase auth session | (managed by SDK) |

### 3. Batch Operations

**Queue Processing:**
- Process items sequentially (not parallel)
- Stop on first network error to avoid repeated failures
- Continue on non-network errors (skip problematic items)

**Photo Uploads:**
- Upload photos sequentially for same survey
- Avoid overwhelming device memory with large concurrent uploads

## User Interface Integration

### Dashboard Screen

**Displays:**
- Pending sync count: `syncStore.queue.length`
- Online/offline status: `syncStore.isOnline`
- Failed sync count: `queue.filter(item => item.retryCount >= item.maxRetries).length`

**Actions:**
- "Bắt đầu khảo sát mới" → Creates draft
- Navigate to History → Shows merged data
- Navigate to Settings → Manual sync

### Settings Screen

**Sync Status Section:**
```
Trạng thái đồng bộ
├── Online/Offline badge
├── Last sync time (stored in AsyncStorage @last_sync_time)
├── Pending count
├── Failed count
└── [Sync Now] button
```

**Sync Now Button:**
```typescript
const handleSyncNow = async () => {
  setSyncing(true);
  try {
    await syncStore.syncAll();
    Alert.alert('Thành công', 'Đã đồng bộ dữ liệu');
  } catch (error) {
    Alert.alert('Lỗi', 'Không thể đồng bộ - vui lòng thử lại');
  } finally {
    setSyncing(false);
  }
};
```

### History Screen

**Status Badges:**
```tsx
{survey.status === 'synced' && (
  <Badge variant="success">Đã đồng bộ</Badge>
)}
{survey.status === 'pending' && (
  <Badge variant="warning">Chờ đồng bộ</Badge>
)}
{survey.status === 'failed' && (
  <Badge variant="error">Thất bại</Badge>
)}
```

**Pull-to-Refresh:**
- Fetches latest from Supabase
- Reloads sync queue
- Merges and re-renders

### Drafts Screen

**Draft List:**
- Shows all saved drafts with progress indicators
- Completion stats: GPS ✓, Photos (count), Polygon ✓
- Relative timestamps: "2 giờ trước", "Hôm qua"

**Actions:**
- Tap to resume → Navigate to appropriate step
- Delete → Remove from AsyncStorage with confirmation

## Testing Offline Scenarios

### Manual Testing Steps

**1. Offline Survey Creation:**
```
1. Enable Airplane Mode
2. Login (session cached)
3. Start survey → GPS → Photos → Owner Info → Usage Info → Polygon
4. Submit → Should queue successfully
5. Check Settings → Pending count = 1
6. Check History → Survey shows "Chờ đồng bộ"
```

**2. Automatic Sync on Reconnect:**
```
1. Create offline survey (queued)
2. Disable Airplane Mode
3. Wait for NetInfo to detect connection
4. syncStore.syncAll() auto-triggered
5. Check Settings → Pending count = 0
6. Check History → Survey shows "Đã đồng bộ"
```

**3. Manual Sync:**
```
1. Create offline survey
2. Keep offline
3. Navigate to Settings
4. Tap "Đồng bộ ngay" → Should show error (no network)
5. Go online
6. Tap "Đồng bộ ngay" → Should succeed
```

**4. Retry Logic:**
```
1. Create survey
2. Submit while online but with invalid data (simulate server error)
3. Should increment retryCount
4. Fix data and retry
5. Should succeed and clear from queue
```

**5. Draft Resumption:**
```
1. Start survey
2. Complete GPS and Photos
3. Close app (draft auto-saved)
4. Reopen app
5. Navigate to Drafts
6. Tap draft → Should resume at OwnerInfo screen
7. Complete and submit
```

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Submit while going offline | Queue item created, shown as pending |
| Network drops during photo upload | Retry includes all photos (idempotent) |
| App killed during sync | Queue persists in AsyncStorage, resumes on restart |
| Max retries reached | Survey marked as failed, not auto-retried |
| Duplicate survey ID | Database prevents duplicate (unique constraint) |
| Large photo (>10MB) | Upload fails, error stored, user can edit/retry |
| GPS permission denied | Survey blocked at GPS step, can't proceed |
| Storage quota full | Error message, user must free space |

## Storage Limits

### AsyncStorage

**Practical Limits:**
- iOS: ~10 MB (varies by device/OS)
- Android: ~6 MB (configurable)

**Data Size Estimates:**
- Survey draft: ~5 KB
- Photo URI: ~200 bytes (path reference, not actual image)
- Sync queue item: ~10 KB
- Reference data cache: ~50 KB

**Estimated Capacity:**
- ~500 drafts before storage issues
- ~300 queued surveys (with full data)
- Photos stored in device filesystem (unlimited until device full)

### Supabase Storage

**survey-photos Bucket:**
- Max file size: 10 MB (configurable)
- Total storage: Limited by Supabase plan (varies)
- File format: JPEG (recommended), PNG supported
- Compression: Client-side before upload (future enhancement)

## Future Enhancements

### 1. Background Sync

**Current:** Sync only when app is open
**Planned:** Background task to sync when app is backgrounded

**Implementation:**
- Use `expo-task-manager` + `expo-background-fetch`
- Register background task to run every 15 minutes
- Process sync queue in background

### 2. Conflict Resolution

**Current:** Client-side UUID prevents duplicates, no edit conflicts
**Planned:** Handle server-side data updates

**Scenarios:**
- Survey edited on multiple devices
- Server data updated while client offline
- Merge strategy: Last write wins vs. manual resolution

### 3. Progressive Photo Upload

**Current:** All photos uploaded together
**Planned:** Upload photos as captured, even before submission

**Benefits:**
- Faster final submission
- Lower memory usage
- Progress feedback to user

### 4. Smart Retry

**Current:** Fixed retry count (max 5)
**Planned:** Exponential backoff, adaptive retry

**Strategy:**
- First retry: Immediate
- Subsequent retries: 1 min, 5 min, 15 min, 1 hour
- Prioritize newer surveys

### 5. Data Compression

**Current:** Raw JSON in AsyncStorage and network
**Planned:** Compress data before storage/upload

**Targets:**
- Survey JSON payloads
- Reference data cache
- Photo thumbnails (JPEG quality reduction)

### 6. Offline Maps

**Current:** Map requires network (react-native-maps)
**Planned:** Cache map tiles for offline use

**Implementation:**
- Pre-download commune boundaries
- Cache base map tiles for target areas
- Use `react-native-offline-maps` or similar

## Troubleshooting

### Common Issues

**Issue:** "Chờ đồng bộ" surveys never sync
**Causes:**
- RLS policy blocks insert (user not authenticated)
- Invalid data format (schema mismatch)
- Storage bucket permissions
**Fix:** Check Supabase logs, verify auth session, validate data

**Issue:** Photos missing after sync
**Causes:**
- Local file deleted before upload
- Upload failed but record created
- Incorrect file path in database
**Fix:** Check survey_media table, verify storage bucket contents

**Issue:** AsyncStorage quota exceeded
**Causes:**
- Too many drafts
- Large reference data cache
- Queue accumulation
**Fix:** Delete old drafts, clear cache, sync pending surveys

**Issue:** App crashes on background sync
**Causes:**
- Memory limit exceeded
- Large photo processing
**Fix:** Reduce photo quality, implement pagination

## Summary

The LocationID Tracker offline-first architecture ensures:

✅ **Zero data loss** - All data persisted locally before sync
✅ **Instant UI feedback** - No waiting for network operations
✅ **Automatic recovery** - Auto-sync on reconnect, retry on failure
✅ **Transparent to user** - Offline mode "just works"
✅ **Consistent state** - Draft/queue/remote always in sync
✅ **Graceful degradation** - Full functionality without network

This design allows commune police officers to work in remote areas with poor connectivity while maintaining data integrity and user experience.
