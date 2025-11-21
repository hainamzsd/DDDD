# Services Layer Documentation

This directory contains the service layer for the LocationID Tracker (C06) application. Services handle all data operations, API calls, and business logic, providing a clean abstraction between the UI layer and backend systems.

## Architecture Overview

The services layer follows these principles:

1. **Single Responsibility**: Each service handles a specific domain (auth, surveys, reference data, etc.)
2. **Offline-First**: All services gracefully handle network failures and support offline operation
3. **Type Safety**: Full TypeScript types for all inputs and outputs
4. **Error Handling**: Comprehensive error handling with Vietnamese error messages
5. **Caching**: Smart caching strategies for reference data to minimize network calls

## Service Modules

### Core Services

#### `auth.ts` - Authentication Service
Handles user authentication using Supabase Auth with Vietnamese police ID numbers.

**Key Features:**
- Converts 12-digit police ID to email format (`{idNumber}@police.gov.vn`)
- Manages user sessions with AsyncStorage persistence
- Maps database profiles from snake_case to camelCase
- Provides Vietnamese error messages for auth failures

**Main Methods:**
- `signInWithIdNumber(idNumber, password)` - Primary login method for officers
- `signOut()` - Logout and session cleanup
- `getProfile(userId)` - Fetch user profile from database
- `getCurrentUser()` - Get authenticated user with profile
- `isAuthenticated()` - Check if user has valid session

**Example:**
```typescript
import { authService } from './services/auth';

// Login with police ID
const result = await authService.signInWithIdNumber('123456789012', 'password');
console.log('Logged in:', result.profile.fullName);
```

---

#### `survey.ts` - Survey Data Service
Manages survey location data, including creation, submission, and retrieval.

**Key Features:**
- CRUD operations for survey locations
- Photo upload to Supabase Storage
- Polygon/vertex management with PostGIS
- Converts GPS coordinates to PostGIS GEOGRAPHY points
- Maps database fields (snake_case) to application types (camelCase)

**Main Methods:**
- `submitSurvey(survey, photos, vertices)` - Submit complete survey to backend
- `getLocationsByUser(userId, limit)` - Fetch user's survey history
- `getLocationById(locationId)` - Get single survey with related data
- `getMissions(userId)` - Get survey missions/campaigns
- `mapLocationFromDb(dbRow)` - Transform database row to SurveyLocation type

**Data Flow:**
```
Survey Draft → surveyStore → submitSurvey() → Supabase
                                  ├─ survey_locations (metadata + GPS)
                                  ├─ survey_media (photos → Storage)
                                  └─ survey_vertices (polygon points)
```

**Example:**
```typescript
import { surveyService } from './services/survey';

// Submit a survey
const locationId = await surveyService.submitSurvey(
  surveyData,
  photos,
  vertices
);

// Fetch history
const history = await surveyService.getLocationsByUser(userId, 50);
```

---

#### `referenceData.ts` - Reference Data Service
Fetches and caches reference data like object types, administrative units, and land use types.

**Key Features:**
- 24-hour cache expiry for reference data
- Offline fallback data when network unavailable
- Hierarchical admin unit queries (province → district → ward)
- Vietnamese cadastral categories support

**Main Methods:**
- `getObjectTypes()` - Fetch object type classifications
- `getAdminUnits(level, parentCode)` - Fetch admin units with filtering
- `getLandUseTypes()` - Fetch Vietnamese land use categories

**Caching Strategy:**
```
Request → Check AsyncStorage cache
            ├─ Cache valid (< 24h) → Return cached data
            ├─ Cache expired → Fetch from Supabase → Update cache
            └─ Network error → Return expired cache or fallback data
```

**Example:**
```typescript
import { getAdminUnits, getLandUseTypes } from './services/referenceData';

// Get provinces
const provinces = await getAdminUnits('PROVINCE');

// Get districts in province 79 (HCM City)
const districts = await getAdminUnits('DISTRICT', '79');

// Get land use types
const landUseTypes = await getLandUseTypes();
```

---

#### `cadastralUpdate.ts` - Cadastral Data Update Service
Manages periodic updates of Vietnamese cadastral categories from official sources.

**Key Features:**
- Version tracking for land use type data
- Automatic update checks every 7 days
- Manual update trigger from Settings screen
- Change history tracking

**Main Methods:**
- `shouldCheckForUpdates()` - Check if update check is due (7-day interval)
- `getCurrentVersion()` - Get current cadastral data version
- `checkForUpdates()` - Query server for newer versions
- `applyUpdate(version)` - Download and apply new data
- `getUpdateHistory(limit)` - Fetch version history

**Update Flow:**
```
Settings Screen → Check for updates → Query ref_cadastral_versions
                                         ├─ New version found → Show alert
                                         ├─ User confirms → applyUpdate()
                                         └─ Download → Cache → Update version
```

**Regulatory Compliance:**
Ensures app uses latest official Vietnamese land use categories per:
- Land Law 2013 (Luật Đất đai 2013)
- Decree 43/2014/NĐ-CP
- Circular 02/2015/TT-BTNMT

---

#### `dataExport.ts` - Data Export Service
Provides data export functionality for backup, audit, and recovery.

**Key Features:**
- Exports all survey data to JSON format
- Includes synced, pending, and draft surveys
- Generates shareable backup files
- Metadata includes counts and export timestamp

**Main Methods:**
- `exportAllData(userId)` - Export complete user data to JSON file

**Export Format:**
```json
{
  "exportedAt": "2025-11-21T12:00:00.000Z",
  "metadata": {
    "syncedCount": 45,
    "pendingCount": 3,
    "draftCount": 2
  },
  "syncedSurveys": [...],
  "pendingSurveys": [...],
  "draftIds": [...]
}
```

**Example:**
```typescript
import { dataExportService } from './services/dataExport';

// Export all data
const fileUri = await dataExportService.exportAllData(userId);
// Returns: file:///path/LocationID_Backup_1700569200000.json

// User can share file via system share sheet
```

---

### Supporting Infrastructure

#### `supabase.ts` - Supabase Client Configuration
Configures the Supabase client with AsyncStorage persistence.

**Configuration:**
```typescript
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

**Environment Variables Required:**
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

---

## Error Handling Patterns

All services follow consistent error handling:

### 1. Network Errors
```typescript
try {
  const { data, error } = await supabase.from('table').select('*');
  if (error) throw error;
  return data;
} catch (error) {
  console.error('[ServiceName] Operation failed:', error);
  // Try to return cached data if available
  const cached = await getCached();
  if (cached) return cached;
  // Otherwise return fallback or throw
  throw new Error('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối.');
}
```

### 2. Authentication Errors
```typescript
if (error.message.includes('Invalid login credentials')) {
  throw new Error('Mã cán bộ hoặc mật khẩu không đúng');
}
```

### 3. Validation Errors
```typescript
if (!idNumber || !/^\d{12}$/.test(idNumber)) {
  throw new Error('Mã cán bộ phải có đúng 12 chữ số');
}
```

---

## Type Mapping Conventions

Database tables use `snake_case`, but application code uses `camelCase`. All services handle this mapping:

**Database (snake_case):**
```sql
SELECT
  id,
  full_name,
  phone_number,
  unit_code,
  created_at
FROM profiles;
```

**Application (camelCase):**
```typescript
interface Profile {
  id: string;
  fullName: string;
  phoneNumber: string;
  unitCode: string;
  createdAt: string;
}
```

**Mapping Example:**
```typescript
return {
  id: data.id,
  fullName: data.full_name,
  phoneNumber: data.phone_number,
  unitCode: data.unit_code,
  createdAt: data.created_at,
};
```

---

## Offline-First Patterns

Services support offline operation through several strategies:

### 1. Cached Reference Data
```typescript
// Try cache first, fetch if expired, use stale cache on error
const cached = await getFromCache();
if (cached && !isExpired(cached)) return cached.data;

const fresh = await fetchFromSupabase();
await saveToCache(fresh);
return fresh;
```

### 2. Queued Operations
```typescript
// Handled by syncStore, not individual services
try {
  await supabase.from('table').insert(data);
} catch (error) {
  if (isNetworkError(error)) {
    await syncStore.addToQueue({ type: 'survey', data });
  }
}
```

### 3. Fallback Data
```typescript
// When all else fails, provide minimal working data
if (networkFailed && !cachedData) {
  return getFallbackData(); // Hardcoded minimal dataset
}
```

---

## Testing Services

All services have comprehensive test coverage. See `__tests__/` directory:

- `services/auth.test.ts` - 14 tests for authentication
- `services/survey.test.ts` - 10 tests for survey operations
- `services/referenceData.test.ts` - 15 tests for reference data

**Run tests:**
```bash
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
```

**Mock Supabase in tests:**
```typescript
jest.mock('./supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}));
```

---

## Common Tasks

### Adding a New Service

1. Create new file in `services/` directory
2. Add JSDoc comments for module and methods
3. Implement error handling with Vietnamese messages
4. Add type safety (TypeScript interfaces)
5. Create corresponding test file in `__tests__/`
6. Update this README

**Template:**
```typescript
/**
 * Service Name - Brief description
 * Detailed explanation of what this service does
 */

import { supabase } from './supabase';
import { SomeType } from '../types/survey';

export const myService = {
  /**
   * Method description
   * @param param1 Description
   * @returns Description of return value
   */
  async myMethod(param1: string): Promise<SomeType[]> {
    try {
      const { data, error } = await supabase
        .from('table')
        .select('*')
        .eq('field', param1);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[MyService] Operation failed:', error);
      throw new Error('Vietnamese error message');
    }
  },
};
```

### Debugging Services

**Enable verbose logging:**
```typescript
// In service file, add console.log statements
console.log('[ServiceName] Operation started:', params);
console.log('[ServiceName] API response:', data);
console.log('[ServiceName] Operation completed');
```

**Check Supabase queries in network tab:**
- Open React Native Debugger
- Monitor network requests
- Look for POST/GET to Supabase endpoints

**Inspect cached data:**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// In a component or screen
const debugCache = async () => {
  const keys = await AsyncStorage.getAllKeys();
  console.log('All storage keys:', keys);

  const cache = await AsyncStorage.getItem('@land_use_types_cache');
  console.log('Land use types cache:', JSON.parse(cache));
};
```

---

## Related Documentation

- **Database Schema**: See `docs/DATA_MODEL.md`
- **API Documentation**: See `docs/API_DOCUMENTATION.md`
- **Offline Sync**: See `docs/OFFLINE_SYNC.md`
- **Type Definitions**: See `types/survey.ts` and `types/database.ts`
- **Regulatory Compliance**: See `docs/CADASTRAL_REGULATIONS.md`

---

## Maintenance

### Updating Supabase Client
When updating `@supabase/supabase-js`:
1. Check for breaking changes in changelog
2. Update `supabase.ts` configuration if needed
3. Run tests to ensure compatibility
4. Update type definitions in `types/database.ts`

### Updating Reference Data
To refresh cadastral categories:
1. Update `supabase/seed-land-use-types-official.sql`
2. Run migration in Supabase dashboard
3. Increment version in `ref_cadastral_versions`
4. App will auto-detect new version on next check

### Performance Optimization
- Monitor AsyncStorage usage (avoid storing large data)
- Adjust cache expiry times based on data change frequency
- Use pagination for large datasets (limit parameter)
- Profile network calls in production

---

**Last Updated**: November 21, 2025
**Maintained By**: LocationID Tracker Development Team
