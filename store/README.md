# State Management Documentation

This directory contains the global state management for the LocationID Tracker (C06) application using Zustand. The store layer manages application state, coordinates with services, and handles local persistence.

## Architecture Overview

### Why Zustand?

We chose Zustand for state management because:
- **Lightweight**: Minimal boilerplate compared to Redux
- **Simple API**: Easy to learn and use
- **TypeScript Support**: Excellent type inference
- **No Providers**: Direct store access without context providers
- **React Native Compatible**: Works seamlessly with React Native
- **Devtools Support**: Integrates with Redux DevTools for debugging

### Store Organization

The application uses **three main stores**, each handling a specific domain:

```
store/
├── authStore.ts       # Authentication state
├── surveyStore.ts     # Current survey draft state
└── syncStore.ts       # Offline sync queue state
```

This separation ensures:
- **Single Responsibility**: Each store has one clear purpose
- **Independent Updates**: Changes in one store don't affect others
- **Easy Testing**: Stores can be tested in isolation
- **Better Performance**: Only relevant components re-render on state changes

---

## Store Modules

### `authStore.ts` - Authentication Store

Manages user authentication state and session persistence.

#### State Structure
```typescript
interface AuthState {
  // State
  user: Profile | null;              // Current user profile
  session: Session | null;           // Supabase session
  isAuthenticated: boolean;          // Auth status flag
  isLoading: boolean;                // Loading indicator
  error: string | null;              // Error message

  // Actions
  signIn: (idNumber, password) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user) => void;
  setError: (error) => void;
  clearError: () => void;
}
```

#### Key Responsibilities
1. **Authentication**: Handle login/logout operations
2. **Session Management**: Maintain Supabase session
3. **Profile Loading**: Fetch and store user profile
4. **Auth Persistence**: Auto-restore session on app launch

#### Usage Example
```typescript
import { useAuthStore } from '../store/authStore';

function LoginScreen() {
  const { signIn, isLoading, error, isAuthenticated } = useAuthStore();

  const handleLogin = async () => {
    await signIn('123456789012', 'password');
  };

  if (isAuthenticated) {
    navigation.navigate('Dashboard');
  }
}
```

#### Initialization Flow
```
App Launch → authStore.checkAuth()
                ├─ Check Supabase session (AsyncStorage)
                ├─ Session valid → Fetch profile → Set user state
                └─ Session invalid → Remain unauthenticated
```

#### State Persistence
- Session persisted by Supabase client in AsyncStorage
- No manual persistence needed for auth state
- Session auto-refreshes via Supabase configuration

---

### `surveyStore.ts` - Survey Draft Store

Manages the current survey being edited by the user.

#### State Structure
```typescript
interface SurveyState {
  // Current survey data
  currentSurvey: Partial<SurveyLocation> | null;  // Survey metadata
  currentPhotos: SurveyMedia[];                   // Photos captured
  currentVertices: SurveyVertex[];                // Polygon vertices

  // UI state
  step: 'start' | 'gps' | 'photos' | 'info' | 'usage' | 'polygon' | 'review';
  isLoading: boolean;
  error: string | null;

  // Actions
  startNewSurvey: (officerId) => void;
  updateSurvey: (updates) => Promise<void>;
  addPhoto: (photo) => Promise<void>;
  removePhoto: (photoId) => Promise<void>;
  setVertices: (vertices) => Promise<void>;
  setStep: (step) => void;
  saveDraft: () => Promise<void>;
  loadDraft: (surveyId) => Promise<void>;
  getAllDrafts: () => Promise<DraftSummary[]>;
  deleteDraft: (surveyId) => Promise<void>;
  submitSurvey: (isOnline) => Promise<{ success: boolean; locationId?: string }>;
  clearCurrent: () => Promise<void>;
  setError: (error) => void;
}
```

#### Key Responsibilities
1. **Survey Lifecycle**: Create, update, and submit surveys
2. **Step Management**: Track user's position in survey flow
3. **Photo Management**: Add/remove photos with local URIs
4. **Polygon Management**: Store and update boundary vertices
5. **Draft Persistence**: Auto-save drafts to AsyncStorage
6. **Draft Resume**: Load incomplete surveys for continuation
7. **Submission**: Submit complete surveys (online/offline)

#### Survey Flow States
```
start → gps → photos → info → usage → polygon → review → submit
  ↓       ↓       ↓       ↓       ↓        ↓        ↓
[Draft auto-saved at each step]
```

#### Usage Example
```typescript
import { useSurveyStore } from '../store/surveyStore';

function GPSCaptureScreen() {
  const { currentSurvey, updateSurvey, setStep } = useSurveyStore();

  const handleSaveGPS = async (location) => {
    await updateSurvey({
      gpsPoint: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
      },
      gpsAccuracy: location.accuracy,
      gpsTimestamp: new Date().toISOString(),
    });

    setStep('photos');
    navigation.navigate('PhotoCapture');
  };
}
```

#### Draft Storage Format
Drafts are stored in AsyncStorage with key pattern: `@survey_draft_{surveyId}`

```json
{
  "survey": {
    "clientLocalId": "draft_1700569200000_abc123",
    "status": "draft",
    "gpsPoint": { "type": "Point", "coordinates": [106.7, 10.8] },
    "objectTypeCode": "HOUSE",
    "locationName": "Nhà số 123",
    ...
  },
  "photos": [
    {
      "id": "photo_1",
      "localUri": "file:///path/to/photo.jpg",
      "capturedAt": "2025-11-21T10:00:00.000Z"
    }
  ],
  "vertices": [
    { "seq": 0, "lat": 10.8, "lng": 106.7 },
    { "seq": 1, "lat": 10.8001, "lng": 106.7001 },
    { "seq": 2, "lat": 10.8002, "lng": 106.7 }
  ],
  "savedAt": "2025-11-21T10:05:00.000Z"
}
```

#### Auto-Save Mechanism
Every call to `updateSurvey()`, `addPhoto()`, `removePhoto()`, or `setVertices()` automatically triggers `saveDraft()`:

```typescript
updateSurvey: async (updates) => {
  const updatedSurvey = { ...currentSurvey, ...updates, updatedAt: new Date().toISOString() };
  set({ currentSurvey: updatedSurvey });
  await get().saveDraft();  // Auto-save
}
```

#### Draft Resumption
When user returns to app or navigates to Drafts screen:

```typescript
// Load draft
await loadDraft('draft_1700569200000_abc123');

// Determine where to resume
if (!currentSurvey.gpsPoint) navigation.navigate('GPSCapture');
else if (currentPhotos.length === 0) navigation.navigate('PhotoCapture');
else if (!currentSurvey.ownerName) navigation.navigate('OwnerInfo');
else if (!currentSurvey.landUseTypeCode) navigation.navigate('UsageInfo');
else navigation.navigate('ReviewSubmit');
```

#### Submission Flow
```typescript
submitSurvey: async (isOnline) => {
  if (isOnline) {
    // Submit directly to Supabase
    const locationId = await surveyService.submitSurvey(
      currentSurvey,
      currentPhotos,
      currentVertices
    );
    await clearCurrent();
    return { success: true, locationId };
  } else {
    // Add to offline sync queue
    await syncStore.addToQueue({
      type: 'survey',
      surveyId: currentSurvey.clientLocalId,
      data: { survey: currentSurvey, photos: currentPhotos, vertices: currentVertices },
    });
    await clearCurrent();
    return { success: true };
  }
}
```

---

### `syncStore.ts` - Offline Sync Store

Manages the offline sync queue and network connectivity state.

#### State Structure
```typescript
interface SyncState {
  // State
  queue: SyncQueueItem[];           // Pending sync operations
  isOnline: boolean;                // Network connectivity status
  isSyncing: boolean;               // Sync in progress flag
  lastSyncTime?: string;            // Timestamp of last successful sync
  error: string | null;             // Error message

  // Actions
  addToQueue: (item) => Promise<void>;
  removeFromQueue: (id) => Promise<void>;
  updateQueueItem: (id, updates) => Promise<void>;
  loadQueue: () => Promise<void>;
  sync: () => Promise<void>;
  syncItem: (item) => Promise<void>;
  syncSurvey: (surveyData) => Promise<any>;
  syncMedia: (mediaData) => Promise<any>;
  syncVertices: (verticesData) => Promise<any>;
  setOnlineStatus: (isOnline) => void;
  clearError: () => void;
  getPendingCount: () => number;
}

interface SyncQueueItem {
  id: string;                       // Unique queue item ID
  type: 'survey' | 'media' | 'vertices';
  surveyId: string;                 // Reference to survey
  data: any;                        // Payload to sync
  retryCount: number;               // Number of attempts
  maxRetries: number;               // Max retry limit (5)
  lastAttempt?: string;             // Timestamp of last attempt
  error?: string;                   // Last error message
  createdAt: string;                // When queued
}
```

#### Key Responsibilities
1. **Queue Management**: Add/remove/update sync operations
2. **Network Monitoring**: Track online/offline status via NetInfo
3. **Auto Sync**: Trigger sync when network reconnects
4. **Retry Logic**: Retry failed operations with exponential backoff
5. **Persistence**: Save queue to AsyncStorage
6. **Error Tracking**: Log failures and retry counts

#### Offline Queue Flow
```
User submits survey (offline) → addToQueue()
                                   ↓
                         Save to AsyncStorage
                                   ↓
                           Wait for network
                                   ↓
                    NetInfo detects reconnection
                                   ↓
                              sync() triggered
                                   ↓
                        Process queue sequentially
                            ↓              ↓
                        Success        Failure
                            ↓              ↓
                    removeFromQueue  incrementRetry
                                          ↓
                                 Max retries (5)?
                                    ↓        ↓
                                  Yes       No
                                    ↓        ↓
                              Mark failed  Retry later
```

#### Usage Example
```typescript
import { useSyncStore } from '../store/syncStore';

function DashboardScreen() {
  const { queue, isOnline, isSyncing, sync, getPendingCount } = useSyncStore();

  const pendingCount = getPendingCount();
  const failedCount = queue.filter(item => item.retryCount >= item.maxRetries).length;

  const handleManualSync = async () => {
    await sync();
  };

  return (
    <View>
      <Text>Chế độ: {isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}</Text>
      <Text>Chưa đồng bộ: {pendingCount}</Text>
      <Text>Thất bại: {failedCount}</Text>
      {isSyncing && <ActivityIndicator />}
      <Button onPress={handleManualSync} title="Đồng bộ ngay" />
    </View>
  );
}
```

#### Network Monitoring Setup
Initialized in `App.tsx` or `syncStore.ts`:

```typescript
import NetInfo from '@react-native-community/netinfo';

// Subscribe to network state changes
NetInfo.addEventListener(state => {
  const wasOnline = syncStore.getState().isOnline;
  const isNowOnline = state.isConnected && state.isInternetReachable;

  syncStore.getState().setOnlineStatus(isNowOnline);

  // Trigger sync when coming back online
  if (!wasOnline && isNowOnline) {
    syncStore.getState().sync();
  }
});
```

#### Queue Persistence
Queue is persisted to AsyncStorage on every change:

```typescript
const QUEUE_STORAGE_KEY = '@sync_queue';

addToQueue: async (item) => {
  const newItem = { ...item, id: generateId(), retryCount: 0, createdAt: now() };
  const updatedQueue = [...queue, newItem];

  set({ queue: updatedQueue });
  await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));

  if (isOnline) sync();  // Try immediate sync if online
}
```

#### Retry Strategy
```typescript
sync: async () => {
  if (isSyncing || !isOnline) return;

  set({ isSyncing: true });

  for (const item of queue) {
    // Skip items that exceeded max retries
    if (item.retryCount >= item.maxRetries) continue;

    try {
      await syncItem(item);
      await removeFromQueue(item.id);
    } catch (error) {
      // Check if it's a network error
      const isNetworkError = error.message.includes('network') ||
                             error.message.includes('fetch');

      if (isNetworkError) {
        // Stop processing queue, will retry when online
        break;
      }

      // Increment retry count
      await updateQueueItem(item.id, {
        retryCount: item.retryCount + 1,
        lastAttempt: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  set({ isSyncing: false, lastSyncTime: new Date().toISOString() });
}
```

#### Sync Operations
Each sync type has a dedicated handler:

```typescript
// Survey sync
syncSurvey: async (surveyData) => {
  const { survey, photos, vertices } = surveyData;

  // 1. Create location record
  const locationId = await supabase
    .from('survey_locations')
    .insert(mapToDbFormat(survey));

  // 2. Upload photos
  for (const photo of photos) {
    await syncMedia({ ...photo, locationId });
  }

  // 3. Save vertices
  if (vertices.length > 0) {
    await syncVertices({ vertices, locationId });
  }

  return locationId;
}

// Media sync
syncMedia: async (mediaData) => {
  const { localUri, locationId } = mediaData;

  // Upload to Supabase Storage
  const fileData = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const fileName = `photos/${locationId}/${Date.now()}.jpg`;
  await supabase.storage
    .from('survey-photos')
    .upload(fileName, decode(fileData), { contentType: 'image/jpeg' });

  // Create media record
  await supabase
    .from('survey_media')
    .insert({ location_id: locationId, file_path: fileName });
}

// Vertices sync
syncVertices: async (verticesData) => {
  const { vertices, locationId } = verticesData;

  // Convert to GeoJSON polygon
  const polygon = verticesToPolygon(vertices);

  // Update location with polygon
  await supabase
    .from('survey_locations')
    .update({ rough_area: polygon, has_rough_area: true })
    .eq('id', locationId);

  // Insert individual vertices
  await supabase
    .from('survey_vertices')
    .insert(vertices.map(v => ({ ...v, location_id: locationId })));
}
```

---

## Store Patterns and Best Practices

### 1. Accessing State in Components

**Using hooks (recommended):**
```typescript
import { useAuthStore } from '../store/authStore';

function MyComponent() {
  // Select only needed state (prevents unnecessary re-renders)
  const user = useAuthStore(state => state.user);
  const signOut = useAuthStore(state => state.signOut);

  // Or destructure multiple values
  const { isAuthenticated, isLoading } = useAuthStore();

  return <Text>{user?.fullName}</Text>;
}
```

**Direct access (outside components):**
```typescript
import { useAuthStore } from '../store/authStore';

// Get state
const user = useAuthStore.getState().user;

// Call action
await useAuthStore.getState().signOut();
```

### 2. Computed Values

**Derived state using selectors:**
```typescript
function MyComponent() {
  // Compute derived value
  const hasCompletedGPS = useSurveyStore(state =>
    state.currentSurvey?.gpsPoint !== null
  );

  const isReadyToSubmit = useSurveyStore(state => {
    const { currentSurvey, currentPhotos } = state;
    return (
      currentSurvey?.gpsPoint &&
      currentPhotos.length > 0 &&
      currentSurvey?.locationName
    );
  });
}
```

### 3. Async Actions

All async operations should:
1. Set loading state
2. Try operation
3. Update state on success
4. Handle errors
5. Clear loading state

```typescript
myAsyncAction: async () => {
  set({ isLoading: true, error: null });

  try {
    const result = await someService.doSomething();
    set({ data: result, isLoading: false });
  } catch (error) {
    set({ error: error.message, isLoading: false });
  }
}
```

### 4. Store Initialization

Initialize stores on app launch:

```typescript
// In App.tsx
useEffect(() => {
  // Check auth session
  authStore.getState().checkAuth();

  // Load sync queue
  syncStore.getState().loadQueue();

  // Setup network listener
  setupNetworkMonitoring();
}, []);
```

### 5. Testing Stores

**Mock stores in tests:**
```typescript
jest.mock('../store/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    user: mockUser,
    isAuthenticated: true,
    signOut: jest.fn(),
  })),
}));
```

**Test store actions directly:**
```typescript
import { useSurveyStore } from '../store/surveyStore';

test('should start new survey', () => {
  const { startNewSurvey, currentSurvey } = useSurveyStore.getState();

  startNewSurvey('officer123');

  expect(currentSurvey).not.toBeNull();
  expect(currentSurvey.createdBy).toBe('officer123');
  expect(currentSurvey.status).toBe('draft');
});
```

---

## State Persistence Strategy

### What Gets Persisted

| Store | Persisted | Storage | Lifecycle |
|-------|-----------|---------|-----------|
| authStore | Session only | AsyncStorage (via Supabase) | Until logout |
| surveyStore | Drafts | AsyncStorage | Until submitted or deleted |
| syncStore | Queue | AsyncStorage | Until synced |

### AsyncStorage Keys

```
@survey_draft_{surveyId}          # Individual survey drafts
@sync_queue                        # Offline sync queue
@land_use_types_cache             # Cached land use types
@admin_units_cache                # Cached admin units
@cadastral_data_version           # Current cadastral version
@cadastral_last_update_check      # Last update check time
```

### Clearing Storage

**On logout:**
```typescript
signOut: async () => {
  await authService.signOut();

  // Clear auth state
  set({ user: null, session: null, isAuthenticated: false });

  // Optionally clear drafts (ask user first)
  // await clearAllDrafts();
}
```

**On app reset (Settings):**
```typescript
const resetApp = async () => {
  await AsyncStorage.clear();
  await authStore.getState().signOut();
  // Restart app or navigate to login
}
```

---

## Performance Optimization

### 1. Selective Subscriptions

Only subscribe to state you need:

```typescript
// ❌ Bad - re-renders on any auth state change
const authState = useAuthStore();

// ✅ Good - only re-renders when user changes
const user = useAuthStore(state => state.user);
```

### 2. Shallow Comparison

Use shallow equality for objects:

```typescript
import shallow from 'zustand/shallow';

const { currentSurvey, currentPhotos } = useSurveyStore(
  state => ({ currentSurvey: state.currentSurvey, currentPhotos: state.currentPhotos }),
  shallow
);
```

### 3. Batch Updates

Use `set()` to batch multiple state changes:

```typescript
// ❌ Bad - triggers multiple re-renders
set({ isLoading: true });
set({ error: null });
set({ data: result });

// ✅ Good - single re-render
set({ isLoading: true, error: null, data: result });
```

---

## Debugging Stores

### 1. Redux DevTools

Install React Native Debugger and enable Zustand devtools:

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useAuthStore = create(
  devtools(
    (set) => ({
      // store implementation
    }),
    { name: 'AuthStore' }
  )
);
```

### 2. Console Logging

Add logging to track state changes:

```typescript
signIn: async (idNumber, password) => {
  console.log('[AuthStore] Sign in attempt:', idNumber);

  try {
    const result = await authService.signInWithIdNumber(idNumber, password);
    console.log('[AuthStore] Sign in success:', result.profile);
    set({ user: result.profile, isAuthenticated: true });
  } catch (error) {
    console.error('[AuthStore] Sign in failed:', error);
    set({ error: error.message });
  }
}
```

### 3. Inspect AsyncStorage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const debugStorage = async () => {
  const keys = await AsyncStorage.getAllKeys();
  console.log('All storage keys:', keys);

  const drafts = keys.filter(k => k.startsWith('@survey_draft_'));
  console.log('Draft count:', drafts.length);

  const queue = await AsyncStorage.getItem('@sync_queue');
  console.log('Sync queue:', JSON.parse(queue));
};
```

---

## Common Issues and Solutions

### Issue: State not persisting
**Solution**: Check AsyncStorage writes are awaited
```typescript
// ❌ Not awaited
AsyncStorage.setItem(key, value);
set({ data });

// ✅ Awaited
await AsyncStorage.setItem(key, value);
set({ data });
```

### Issue: Stale state in actions
**Solution**: Use `get()` to access current state
```typescript
// ❌ Closure captures old state
const oldSurvey = currentSurvey;
setTimeout(() => set({ currentSurvey: oldSurvey }), 1000);

// ✅ Get fresh state
setTimeout(() => {
  const fresh = get().currentSurvey;
  set({ currentSurvey: fresh });
}, 1000);
```

### Issue: Network listener not working
**Solution**: Ensure NetInfo is properly configured
```typescript
import NetInfo from '@react-native-community/netinfo';

// Setup in App.tsx useEffect
const unsubscribe = NetInfo.addEventListener(state => {
  syncStore.getState().setOnlineStatus(state.isConnected);
});

return () => unsubscribe();  // Cleanup
```

---

## Related Documentation

- **Services Layer**: See `services/README.md`
- **Offline Sync Architecture**: See `docs/OFFLINE_SYNC.md`
- **Data Model**: See `docs/DATA_MODEL.md`
- **Type Definitions**: See `types/survey.ts`

---

**Last Updated**: November 21, 2025
**Maintained By**: LocationID Tracker Development Team
