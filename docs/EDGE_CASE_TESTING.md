# Edge Case Testing Documentation

## Overview

This document describes the edge case testing strategy for the LocationID Tracker (C06) mobile app. Edge case testing ensures the app handles exceptional situations gracefully and maintains data integrity under adverse conditions.

## Test Suite: `__tests__/edge-cases-logic.test.ts`

**Status:** ✅ 49 tests passing

**Purpose:** Test critical edge case handling logic without requiring Expo native modules. Focuses on validation, error handling, and business logic.

---

## Test Coverage

### 1. GPS Coordinate Validation Edge Cases (4 tests)

Tests validation of GPS coordinates to ensure they fall within Vietnam's geographic boundaries.

**Vietnam Boundaries:**
- Latitude: 8.5°N to 23.4°N
- Longitude: 102.1°E to 109.5°E

**Test Cases:**
- ✅ Reject coordinates outside Vietnam (Null Island, New York, Buenos Aires, Singapore, Tokyo)
- ✅ Accept valid Vietnam coordinates (Da Nang, Hanoi, Ho Chi Minh City, Nha Trang, Haiphong)
- ✅ Reject coordinates just outside boundaries
- ✅ Accept coordinates on exact boundaries

**Edge Cases Covered:**
- International coordinates (0, 0)
- Negative coordinates
- Boundary testing (8.49°, 23.41°, etc.)
- Famous Vietnamese cities

**Example:**
```typescript
const isValidVietnamCoordinate = (lat: number, lng: number): boolean => {
  return lat >= 8.5 && lat <= 23.4 && lng >= 102.1 && lng <= 109.5;
};
```

---

### 2. Survey Validation Edge Cases (8 tests)

Tests comprehensive validation of survey data to ensure all required fields are present and valid.

**Required Fields:**
- GPS coordinates (latitude & longitude)
- Photos (at least 1)
- Location name (non-empty)
- Land use type code

**Optional Fields:**
- Polygon vertices

**Test Cases:**
- ✅ Reject survey with missing GPS coordinates
- ✅ Reject survey with missing photos
- ✅ Reject survey with empty location name
- ✅ Reject survey with whitespace-only location name
- ✅ Reject survey with missing land use type
- ✅ Accept valid survey with all required fields
- ✅ Accept valid survey without polygon (optional field)
- ✅ Collect all validation errors for completely invalid survey

**Edge Cases Covered:**
- Null values
- Empty arrays
- Empty strings
- Whitespace-only strings
- Multiple validation errors simultaneously

**Example:**
```typescript
const validateSurvey = (survey: Survey): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!survey.gpsLat || !survey.gpsLong) {
    errors.push('Chưa thu thập tọa độ GPS');
  }

  if (survey.photos.length === 0) {
    errors.push('Chưa chụp ảnh');
  }

  // ... more validations

  return { valid: errors.length === 0, errors };
};
```

---

### 3. Polygon Validation Edge Cases (6 tests)

Tests validation of polygon boundaries drawn on the map.

**Requirements:**
- Minimum 3 vertices (to form a polygon)
- Maximum 1000 vertices (performance limit)
- Optional field (empty is valid)

**Test Cases:**
- ✅ Accept empty polygon (optional field)
- ✅ Reject polygon with 1 point
- ✅ Reject polygon with 2 points
- ✅ Accept polygon with exactly 3 points
- ✅ Accept polygon with many points (50)
- ✅ Reject polygon with excessive points (1001)

**Edge Cases Covered:**
- Empty array (optional)
- Minimum boundary (3 points)
- Large polygons (performance)
- Excessive polygons (memory/performance limits)

**Example:**
```typescript
const validatePolygon = (vertices: Vertex[]): { valid: boolean; error?: string } => {
  if (vertices.length === 0) {
    return { valid: true }; // Optional field
  }

  if (vertices.length < 3) {
    return {
      valid: false,
      error: 'Cần ít nhất 3 điểm để tạo vùng ranh giới',
    };
  }

  if (vertices.length > 1000) {
    return {
      valid: false,
      error: 'Quá nhiều điểm (tối đa 1000)',
    };
  }

  return { valid: true };
};
```

---

### 4. Owner ID Validation Edge Cases (11 tests)

Tests validation of Vietnamese citizen identification numbers (CMND/CCCD).

**Requirements per Circular 01/2022/TT-BCA:**
- 9 digits (old CMND format)
- 12 digits (new CCCD format)
- Numbers only
- No special characters

**Test Cases:**
- ✅ Accept valid 9-digit CMND
- ✅ Accept valid 12-digit CCCD
- ✅ Reject null ID
- ✅ Reject undefined ID
- ✅ Reject empty string
- ✅ Reject whitespace-only string
- ✅ Reject ID with letters
- ✅ Reject ID that is too short
- ✅ Reject ID with 10 digits (neither 9 nor 12)
- ✅ Reject ID with 11 digits
- ✅ Reject ID with special characters

**Edge Cases Covered:**
- Null/undefined values
- Empty/whitespace strings
- Invalid lengths (5, 10, 11 digits)
- Non-numeric characters
- Special characters (-, spaces, etc.)

**Example:**
```typescript
const validateOwnerID = (id: string | null | undefined): { valid: boolean; error?: string } => {
  if (!id || id.trim().length === 0) {
    return { valid: false, error: 'ID không được để trống' };
  }

  if (!/^\d+$/.test(id.trim())) {
    return { valid: false, error: 'ID chỉ được chứa số' };
  }

  if (id.trim().length !== 9 && id.trim().length !== 12) {
    return { valid: false, error: 'ID phải có 9 hoặc 12 chữ số' };
  }

  return { valid: true };
};
```

---

### 5. Phone Number Validation Edge Cases (5 tests)

Tests validation of Vietnamese mobile phone numbers.

**Requirements:**
- 10 digits
- Valid prefix (032-039, 070, 079, 077, 076, 078, 052, 056, 058, 086, 096-099, 059)
- Optional field (can be empty)

**Test Cases:**
- ✅ Accept valid phone numbers with valid prefixes
- ✅ Accept empty/null phone (optional field)
- ✅ Reject phone with invalid length
- ✅ Reject phone with letters
- ✅ Reject phone with invalid prefix

**Edge Cases Covered:**
- Null/undefined/empty (optional field)
- Invalid length (9, 11 digits)
- Non-numeric characters
- Old format starting with 0 (deprecated)
- Invalid prefixes (012, 015, etc.)

**Valid Prefixes:**
- Viettel: 032-039, 086, 096-098
- Vinaphone: 070, 079, 077, 076, 078
- Mobifone: 052, 056, 058
- Vietnamobile: 092
- Gmobile: 059, 099

**Example:**
```typescript
const validatePhoneNumber = (phone: string | null | undefined): { valid: boolean; error?: string } => {
  if (!phone || phone.trim().length === 0) {
    return { valid: true }; // Optional field
  }

  if (!/^\d{10}$/.test(phone.trim())) {
    return { valid: false, error: 'Số điện thoại phải có 10 chữ số' };
  }

  const validPrefixes = ['032', '033', '034', '035', '036', '037', '038', '039',
                         '070', '079', '077', '076', '078', '052', '056', '058',
                         '086', '096', '097', '098', '059', '099'];

  const prefix = phone.trim().substring(0, 3);
  if (!validPrefixes.includes(prefix)) {
    return { valid: false, error: 'Đầu số không hợp lệ' };
  }

  return { valid: true };
};
```

---

### 6. Location Identifier Validation Edge Cases (3 tests)

Tests validation of cadastral location identifiers.

**Format:** `PP-DD-CC-NNNNNN`
- PP: Province code (2 digits)
- DD: District code (2 digits)
- CC: Commune code (2 digits)
- NNNNNN: Sequential number (6 digits)

**Test Cases:**
- ✅ Accept valid location identifiers (01-02-03-123456, etc.)
- ✅ Accept null (auto-generated by database)
- ✅ Reject incorrect formats

**Edge Cases Covered:**
- Single digit codes (1-2-3-123456)
- Wrong length (12345, 1234567)
- Missing parts (01-02-03)
- Letters instead of numbers
- Wrong separators (/, spaces)

**Example:**
```typescript
const validateLocationIdentifier = (id: string | null | undefined): { valid: boolean; error?: string } => {
  if (!id) {
    return { valid: true }; // Auto-generated
  }

  const pattern = /^\d{2}-\d{2}-\d{2}-\d{6}$/;
  if (!pattern.test(id)) {
    return {
      valid: false,
      error: 'Định dạng phải là PP-DD-CC-NNNNNN',
    };
  }

  return { valid: true };
};
```

---

### 7. Network State Edge Cases (4 tests)

Tests network connectivity detection and sync decision logic.

**Conditions for Sync:**
- `isConnected` must be true
- `isInternetReachable` must be true (not null or false)

**Test Cases:**
- ✅ Do not sync when offline
- ✅ Do not sync when connected but internet unreachable
- ✅ Do not sync when internet reachability unknown (null)
- ✅ Sync when connected and internet reachable

**Edge Cases Covered:**
- Offline state
- Connected to WiFi but no internet (captive portal)
- Unknown reachability state (null)
- Full connectivity

**Example:**
```typescript
const shouldAttemptSync = (state: NetworkState): boolean => {
  return state.isConnected && state.isInternetReachable === true;
};
```

---

### 8. Sync Queue Retry Logic Edge Cases (5 tests)

Tests exponential backoff retry logic for failed sync operations.

**Retry Strategy:**
- Maximum 5 retries per item
- Exponential backoff: wait 2^n minutes between retries
- Retry 0: immediate
- Retry 1: wait 2 minutes
- Retry 2: wait 4 minutes
- Retry 3: wait 8 minutes
- Retry 4: wait 16 minutes
- Retry 5: fail permanently

**Test Cases:**
- ✅ Retry when under max retries
- ✅ Do not retry when at max retries
- ✅ Do not retry when exceeded max retries
- ✅ Do not retry too soon after last attempt
- ✅ Retry after sufficient wait time

**Edge Cases Covered:**
- First retry (immediate)
- Multiple retries (backoff calculation)
- Max retries reached
- Too soon to retry
- Sufficient wait time elapsed

**Example:**
```typescript
const shouldRetry = (item: QueueItem): boolean => {
  if (item.retryCount >= item.maxRetries) {
    return false;
  }

  if (item.lastAttempt) {
    const minWaitMs = Math.pow(2, item.retryCount) * 60 * 1000;
    const elapsed = Date.now() - item.lastAttempt;
    if (elapsed < minWaitMs) {
      return false; // Too soon to retry
    }
  }

  return true;
};
```

---

### 9. Storage Space Edge Cases (3 tests)

Tests storage space validation to prevent app failure due to insufficient disk space.

**Thresholds:**
- Critical minimum: 10 MB (prevent new operations)
- Warning threshold: 50 MB (show warning)
- Safe: > 50 MB

**Test Cases:**
- ✅ Reject operations when critically low storage (< 10 MB)
- ✅ Warn when low storage (10-50 MB)
- ✅ Pass when sufficient storage (> 50 MB)

**Edge Cases Covered:**
- Critically low storage (5 MB)
- Low storage (30 MB)
- Sufficient storage (100 MB)

**Example:**
```typescript
const checkStorageSpace = (freeBytes: number): { ok: boolean; warning?: string } => {
  const minRequired = 10 * 1024 * 1024; // 10MB
  const warningThreshold = 50 * 1024 * 1024; // 50MB

  if (freeBytes < minRequired) {
    return {
      ok: false,
      warning: 'Bộ nhớ không đủ. Vui lòng giải phóng ít nhất 10MB.',
    };
  }

  if (freeBytes < warningThreshold) {
    return {
      ok: true,
      warning: 'Bộ nhớ sắp đầy. Khuyến nghị xóa dữ liệu cũ.',
    };
  }

  return { ok: true };
};
```

---

## Untested Edge Cases (Require Manual Testing)

The following edge cases require manual testing on actual devices because they involve native modules or user interactions:

### Permission Edge Cases
1. **GPS Permission Denied**
   - User denies GPS permission on first request
   - User denies GPS permission permanently ("Don't ask again")
   - GPS permission granted but location services disabled
   - GPS timeout (weak signal, indoors)
   - Low GPS accuracy (> 10m)

2. **Camera Permission Denied**
   - User denies camera permission
   - User denies camera permission permanently
   - Camera hardware unavailable
   - User cancels camera capture
   - Photo storage failure (disk full)

### Network Edge Cases
3. **Network Connectivity**
   - Network disconnection during survey submission
   - Slow/unstable network (2G)
   - Submission timeout
   - Reconnection triggering auto-sync

### Session Edge Cases
4. **Authentication**
   - Session expiration during active survey
   - Logout during active survey
   - Multiple devices with same account

### Data Edge Cases
5. **Corrupted Data**
   - Corrupted photo file
   - Corrupted draft data
   - Invalid sync queue data

### Performance Edge Cases
6. **Large Data Sets**
   - Sync queue with 100+ pending surveys
   - Photo gallery with 1000+ photos
   - Very large polygon (500+ vertices)

---

## Manual Testing Scenarios

### Scenario 1: GPS Permission Flow
1. Install app on fresh device
2. Navigate to GPS Capture screen
3. Deny permission → verify error message in Vietnamese
4. Retry → grant permission → verify GPS capture works
5. Disable location services in device settings
6. Try to capture GPS → verify error message guides to settings

### Scenario 2: Offline Survey Creation
1. Enable airplane mode
2. Create new survey
3. Capture GPS (should use last known location or fail gracefully)
4. Take photos
5. Fill all fields
6. Submit → verify saved to sync queue
7. Disable airplane mode
8. Verify auto-sync triggers and survey uploads

### Scenario 3: Network Disconnection During Upload
1. Start survey submission
2. During upload, enable airplane mode
3. Verify survey added to sync queue
4. Verify user sees offline confirmation
5. Re-enable network
6. Verify sync completes successfully

### Scenario 4: Low Storage Space
1. Fill device storage to < 10 MB free
2. Try to capture photo → verify error/warning
3. Try to submit survey → verify error/warning
4. Free up space
5. Verify operations work normally

### Scenario 5: Session Expiration
1. Login to app
2. Start survey (do not submit)
3. Wait for session to expire (or manipulate session manually)
4. Try to submit → verify draft saved and redirected to login

### Scenario 6: Invalid Data Recovery
1. Create survey with all fields
2. Force-quit app during submission
3. Reopen app
4. Verify draft is recoverable
5. Resume and submit successfully

---

## Test Execution

### Run All Edge Case Tests
```bash
npm test -- __tests__/edge-cases-logic.test.ts
```

### Run with Coverage
```bash
npm test -- --coverage __tests__/edge-cases-logic.test.ts
```

### Run in Watch Mode
```bash
npm run test:watch -- __tests__/edge-cases-logic.test.ts
```

---

## Integration with CI/CD

These tests should be run:
- ✅ On every commit (pre-commit hook)
- ✅ On pull requests
- ✅ Before production deployments
- ✅ Daily automated test runs

---

## Regulatory Compliance

Edge case testing ensures compliance with Vietnamese regulations:

- **Circular 02/2015/TT-BTNMT:** GPS accuracy, mandatory fields
- **Circular 01/2022/TT-BCA:** CMND/CCCD format validation
- **Land Law 2013:** Cadastral data format and codes
- **Cybersecurity Law 2018:** Data integrity and security

---

## Maintenance

### Adding New Edge Cases

When adding new edge cases:

1. Identify the failure scenario
2. Write a test that reproduces it
3. Implement the fix
4. Verify the test passes
5. Document the edge case in this file

### Updating Validation Rules

When Vietnamese regulations change:

1. Update validation functions in `utils/validation.ts`
2. Update corresponding tests in `__tests__/edge-cases-logic.test.ts`
3. Update this documentation
4. Update `CADASTRAL_REGULATIONS.md`

---

## References

- **Test Suite:** `__tests__/edge-cases-logic.test.ts`
- **Validation Utilities:** `utils/validation.ts`
- **Validation Guide:** `docs/VALIDATION_GUIDE.md`
- **Cadastral Regulations:** `docs/CADASTRAL_REGULATIONS.md`
- **Survey Workflow:** `docs/SURVEY_WORKFLOW.md`

---

## Summary

**Test Statistics:**
- Total Tests: 49
- Passing: 49 ✅
- Failing: 0 ❌
- Coverage: 9 major categories
- Vietnamese Error Messages: 100%

**Key Achievements:**
- ✅ Comprehensive validation coverage
- ✅ Boundary condition testing
- ✅ Null/undefined safety
- ✅ Vietnamese regulatory compliance
- ✅ Error message localization
- ✅ Network resilience
- ✅ Storage safety
- ✅ Retry logic validation

**Next Steps:**
- [ ] Manual testing on physical devices
- [ ] Permission flow testing
- [ ] Network edge case testing
- [ ] Session management testing
- [ ] Performance testing with large data sets
