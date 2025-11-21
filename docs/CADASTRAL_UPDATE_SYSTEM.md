# Cadastral Data Update System

## Overview

The LocationID Tracker (C06) app includes an automated system for receiving and applying updates to Vietnamese cadastral data (land use types, administrative unit codes) from official government sources. This ensures the app always uses the latest regulatory-compliant categories.

## Architecture

### Components

1. **cadastralUpdate Service** (`services/cadastralUpdate.ts`)
   - Checks for available updates
   - Downloads and applies updates
   - Manages version tracking
   - Handles update history

2. **Database Tables**
   - `ref_cadastral_versions` - Tracks available versions
   - `ref_land_use_types` - Land use categories with version field

3. **UI Integration**
   - Settings Screen displays current version
   - Manual "Check for Updates" button
   - Automatic periodic checks (every 7 days)

### Data Flow

```
Official Source → Supabase (ref_cadastral_versions)
                      ↓
                Check for Updates (API)
                      ↓
                Download New Data
                      ↓
                Update Local Cache (AsyncStorage)
                      ↓
                Apply to App (immediate)
```

## Version Management

### Version Format

Follows Semantic Versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes to data structure
- **MINOR**: New categories added, existing categories updated
- **PATCH**: Minor corrections, typo fixes

**Examples:**
- `1.0.0` - Initial version (47 land use types)
- `1.1.0` - Added 5 new land use types
- `1.1.1` - Fixed typo in NNG.LUA description

### Version Tracking

Each version record includes:

```typescript
interface CadastralVersion {
  version: string;           // e.g., "1.1.0"
  releaseDate: string;       // ISO date
  description: string;       // Vietnamese description
  source: string;            // Official source (ministry, URL)
  changeCount: number;       // Number of changes
}
```

## Update Mechanisms

### 1. Automatic Updates

The app automatically checks for updates every 7 days when online:

```typescript
// Triggered on app launch if > 7 days since last check
if (await shouldCheckForUpdates()) {
  const update = await checkForUpdates();
  if (update) {
    // Notify user of available update
  }
}
```

### 2. Manual Updates

Users can manually check via Settings Screen:

1. Navigate to Settings
2. "Danh mục địa chính" section
3. Tap "Kiểm tra cập nhật"
4. If update available, review details and confirm
5. App downloads and applies immediately

### 3. Background Updates (Future)

Planned for future release:
- Silent background downloads
- Apply on next app restart
- Configurable auto-apply settings

## Update Process

### Step 1: Check for Updates

```typescript
const updateAvailable = await checkForUpdates();
// Returns null if no update, or CadastralVersion object
```

**Process:**
1. Query `ref_cadastral_versions` for latest version
2. Compare with local version (AsyncStorage)
3. Update last check timestamp
4. Return update info if newer version exists

### Step 2: Review Update

User sees alert with:
- Version number
- Release date
- Number of changes
- Description
- Source

### Step 3: Apply Update

```typescript
const result = await applyUpdate(updateAvailable);
```

**Process:**
1. Fetch all `ref_land_use_types` records for new version
2. Cache to AsyncStorage (`@land_use_types_cache`)
3. Update current version (`@cadastral_data_version`)
4. Clear any old cached data
5. Return success/failure result

### Step 4: Immediate Effect

- All new surveys use updated categories
- Existing surveys retain their original categories
- UsageInfoScreen fetches from updated cache

## Database Schema

### ref_cadastral_versions Table

```sql
CREATE TABLE ref_cadastral_versions (
  id UUID PRIMARY KEY,
  version TEXT UNIQUE NOT NULL,
  release_date DATE NOT NULL,
  description TEXT NOT NULL,
  source TEXT NOT NULL,
  change_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies:**
- All authenticated users: READ access
- Only service role: WRITE access (admin-managed)

### ref_land_use_types (Updated)

Added `version` field:

```sql
ALTER TABLE ref_land_use_types
  ADD COLUMN version TEXT DEFAULT '1.0.0';
```

**Purpose:**
- Track which version each category belongs to
- Support rollback if needed
- Query by version for updates

## AsyncStorage Keys

### Version Tracking

- `@cadastral_data_version` - Current installed version
- `@cadastral_last_update_check` - Timestamp of last check

### Data Cache

- `@land_use_types_cache` - Cached land use types
  ```json
  {
    "version": "1.1.0",
    "timestamp": 1706140800000,
    "data": [...land use types array...]
  }
  ```

## Error Handling

### Network Errors

```typescript
if (!isOnline) {
  Alert.alert('Không có kết nối',
    'Vui lòng kiểm tra kết nối mạng và thử lại.');
  return;
}
```

### Update Failures

Possible errors:
1. **Network timeout** - Retry later
2. **Invalid version data** - Show error, don't apply
3. **Storage failure** - Clear cache and retry
4. **Database query error** - Log and alert user

### Retry Logic

- Manual retries only (user initiated)
- No automatic retry loops (prevents battery drain)
- Failed updates logged for diagnostics

## Update Workflow Example

### Example 1: Successful Update

1. **User Action:** Opens Settings → "Kiểm tra cập nhật"
2. **App:** Queries Supabase for latest version
3. **Server:** Returns version 1.1.0 (current is 1.0.0)
4. **App:** Shows alert:
   ```
   Có bản cập nhật mới
   Phiên bản: 1.1.0
   Ngày phát hành: 01/06/2024
   Số thay đổi: 5

   Cập nhật bổ sung loại đất theo Nghị định XX/2024

   Bạn có muốn cập nhật ngay?
   ```
5. **User:** Taps "Cập nhật"
6. **App:** Downloads 52 land use types, saves to cache
7. **App:** Shows success:
   ```
   Thành công
   Cập nhật thành công 52 danh mục đất

   Phiên bản cũ: 1.0.0
   Phiên bản mới: 1.1.0
   ```
8. **Result:** Next survey uses new categories

### Example 2: Already Updated

1. **User Action:** "Kiểm tra cập nhật"
2. **App:** Current version 1.1.0 matches latest
3. **App:** Shows alert: "Đã cập nhật - Danh mục địa chính đã là phiên bản mới nhất."

### Example 3: Offline

1. **User Action:** "Kiểm tra cập nhật"
2. **App:** Detects offline status
3. **App:** Shows: "Không có kết nối - Vui lòng kiểm tra kết nối mạng và thử lại."
4. **User:** Can try again when online

## Publishing New Versions

### For Administrators

To publish a new cadastral data version:

1. **Prepare Data:**
   - Update land use types in `ref_land_use_types`
   - Set `version` field to new version number
   - Ensure codes follow official format (NNG.*, PNN.*, CSD.*)

2. **Create Version Record:**
   ```sql
   INSERT INTO ref_cadastral_versions (
     version,
     release_date,
     description,
     source,
     change_count
   ) VALUES (
     '1.1.0',
     '2024-06-01',
     'Cập nhật bổ sung loại đất theo Nghị định XX/2024',
     'Bộ Tài nguyên và Môi trường',
     5
   );
   ```

3. **Test:**
   - Use test account to check for update
   - Verify download and apply works
   - Check UsageInfoScreen displays new categories

4. **Announce:**
   - Email commune police units
   - Post in admin portal
   - Include changelog and effective date

## Regulatory Compliance

### Data Sources

All cadastral updates must come from official sources:

- **Primary:** Bộ Tài nguyên và Môi trường (MONRE)
- **Legal basis:**
  - Land Law 2013 (Luật Đất đai 2013)
  - Decree 43/2014/NĐ-CP
  - Circular 02/2015/TT-BTNMT
  - Subsequent amendments

### Update Frequency

- **Minimum:** Annual review (January)
- **As needed:** When new regulations published
- **Emergency:** Critical corrections or security fixes

### Audit Trail

All version changes logged:
- Version number and date
- Source document reference
- Number of changes
- Administrator who published

## Security Considerations

### Access Control

- **Read (versions):** All authenticated users
- **Write (versions):** Service role only (admin backend)
- **Data integrity:** Version immutability (no updates to published versions)

### Validation

Before applying update:
1. Verify version format (semantic versioning)
2. Check release_date is valid
3. Validate land use type codes match regex
4. Ensure change_count matches actual changes

### Rollback

If update causes issues:
1. Admin creates new version with previous data
2. Increment version (e.g., 1.1.0 → 1.1.1)
3. Users update to "new" version (which is actually rollback)
4. Never modify existing versions (audit trail)

## Performance Optimization

### Caching Strategy

- **Local cache:** AsyncStorage with version + timestamp
- **Cache invalidation:** On version change only
- **Cache size:** ~50 KB for 50 land use types (minimal)

### Network Usage

- **Update check:** ~1 KB query (version info only)
- **Update download:** ~50 KB data (land use types)
- **Frequency:** Max once per 7 days automatically

### Storage Impact

- **Per version:** 392 bytes (version record)
- **Per land use type:** ~200 bytes
- **Total:** < 100 KB for complete dataset

## Testing

### Test Scenarios

1. **First-time user** (no version installed)
   - Should prompt to download initial version
   - Version displays as "Chưa xác định" until set

2. **Update available**
   - Manual check finds update
   - User accepts, data downloads
   - New categories appear in UsageInfoScreen

3. **Already updated**
   - Check returns "already latest"
   - No unnecessary downloads

4. **Offline mode**
   - Check disabled
   - Uses cached version
   - No errors

5. **Network failure during download**
   - Graceful error message
   - Retains old version
   - User can retry

### Test Data

Migration includes sample version for testing:

```sql
-- Uncomment in migration-cadastral-versions.sql to test
INSERT INTO ref_cadastral_versions (
  version, release_date, description, source, change_count
) VALUES (
  '1.1.0', '2024-06-01',
  'Cập nhật thử nghiệm',
  'Test', 5
);
```

## Future Enhancements

### Planned Features

1. **Administrative Unit Updates**
   - Support version tracking for ref_admin_units
   - Handle province/district/commune changes

2. **Differential Updates**
   - Only download changed records
   - Reduce network usage for minor updates

3. **Background Sync**
   - Download updates in background
   - Apply on next app restart
   - Configurable auto-apply

4. **Update Notifications**
   - Push notifications for critical updates
   - In-app badge for pending updates

5. **Version History View**
   - Screen showing all versions
   - Changelog for each version
   - Source document links

6. **Offline Package**
   - Pre-bundled updates for offline installations
   - QR code for version transfer

## Troubleshooting

### Update Check Fails

**Symptoms:** Error "Không thể kiểm tra cập nhật"

**Causes:**
- No internet connection
- Supabase service down
- RLS policy misconfigured

**Solutions:**
1. Check device connectivity
2. Verify Supabase URL in .env
3. Check RLS policies in Supabase dashboard

### Update Download Fails

**Symptoms:** "Không thể tải dữ liệu cập nhật"

**Causes:**
- Network timeout
- Large payload (>1 MB)
- Invalid version data

**Solutions:**
1. Retry with better connection
2. Check data size in Supabase
3. Validate version record in database

### Version Shows "Chưa xác định"

**Symptoms:** Settings shows undefined version

**Causes:**
- First-time user
- Cache cleared
- AsyncStorage failure

**Solutions:**
1. Check for updates (sets initial version)
2. Verify AsyncStorage permissions
3. Re-install app if persistent

## Maintenance

### Regular Tasks

**Weekly:**
- Monitor update check errors
- Review failed download logs

**Monthly:**
- Check for new official regulations
- Prepare version updates if needed

**Annually:**
- Full audit of all land use categories
- Compare with official master data
- Publish annual version

### Monitoring

Key metrics to track:
- Update check success rate
- Update download success rate
- Average download time
- Number of users per version
- Failed update reasons

## Summary

The Cadastral Data Update System ensures LocationID Tracker always uses the latest official Vietnamese land use categories. With automatic checks, manual controls, and robust error handling, it provides a reliable way to keep cadastral data current without requiring app updates.

**Key Benefits:**
- ✅ Always regulatory compliant
- ✅ No app store updates needed for data changes
- ✅ Offline-capable with cached data
- ✅ User-friendly update process
- ✅ Full audit trail for governance

**Configuration:**
- Update check interval: 7 days
- Update size: ~50 KB
- Storage impact: < 100 KB
- Network usage: Minimal
