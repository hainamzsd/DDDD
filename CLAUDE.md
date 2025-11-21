# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LocationID Tracker (C06)** - A React Native mobile app for Vietnamese commune police officers to perform field surveys of physical locations as part of the National Location Identification System. The app captures GPS coordinates, photos, metadata, and optional polygon boundaries for houses, buildings, shops, and infrastructure.

**Tech Stack:** Expo (React Native), Supabase (PostgreSQL + PostGIS), TypeScript, Zustand

**Key Principle:** Offline-first architecture - all user actions update local storage instantly, then sync to Supabase when online.

## Development Commands

```bash
# Initial setup
npm install
npm run verify        # Check setup is correct (runs verify-setup.js)

# Development
npm start            # Start Expo dev server
npm run android      # Launch Android emulator
npm run ios          # Launch iOS simulator
npm run type-check   # Run TypeScript compiler without emitting files

# Clearing cache (if needed)
expo start --clear
```

## Architecture Overview

### Authentication Flow
The app uses a unique authentication pattern where **12-digit police ID numbers** are converted to email format for Supabase Auth:

```typescript
// ID Number: 123456789012
// Converted to: 123456789012@police.gov.vn
```

**Architecture Layers:**
1. **UI Layer** (`screens/LoginScreen.tsx`) - Input validation, Vietnamese UI
2. **State Layer** (`store/authStore.ts`) - Zustand store managing auth state
3. **Service Layer** (`services/auth.ts`) - Business logic, ID→email conversion
4. **Backend** - Supabase Auth + PostgreSQL with Row Level Security

**Session Management:**
- Sessions persist in AsyncStorage (config in `services/supabase.ts`)
- Auto-refresh tokens enabled
- Profile data fetched from `profiles` table after login
- `idNumber` field extracted from email during profile mapping

### Import Conventions

**IMPORTANT:** This project uses **relative imports**, NOT path aliases:

```typescript
// ✅ Correct
import { theme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components';

// ❌ Wrong - will cause module resolution errors
import { theme } from '@/theme';
```

**Why:** While `tsconfig.json` has path mapping configured, the project consistently uses relative paths to avoid module resolution issues in React Native.

### Offline-First Data Flow

```
User Action → Local Storage (SQLite/AsyncStorage) → Sync Queue → Supabase
     ↓
Instant UI Update
```

**Sync Strategy:**
- All survey data stored locally first
- Background sync when online (NetInfo listener)
- Retry logic with exponential backoff
- Queue persists in local DB with retry count
- See `instruction.README` for detailed sync implementation

### Database Architecture

**Supabase Tables:**
- `profiles` - Officer profiles (1:1 with auth.users)
- `survey_missions` - Survey campaigns/missions
- `survey_locations` - Individual survey records
  - Includes `gps_point` (GEOGRAPHY Point)
  - Includes `rough_area` (GEOMETRY Polygon) - optional boundary
- `survey_media` - Photos/videos per survey
- `survey_vertices` - Polygon vertex coordinates
- `ref_object_types` - Reference data for object types
- `ref_admin_units` - Vietnamese administrative units

**PostGIS Usage:**
- `GEOGRAPHY(Point, 4326)` for GPS coordinates
- `GEOMETRY(Polygon, 4326)` for boundaries
- GIST indexes on spatial columns

**Row Level Security (RLS):**
All tables have RLS enabled. Officers can only access their own data:
```sql
USING (auth.uid() = created_by)
```

### Type System

**Type Organization:**
- `types/database.ts` - Supabase-generated database types
- `types/survey.ts` - Application types (Profile, SurveyLocation, etc.)

**Important Type Pattern:**
Database fields use `snake_case`, application types use `camelCase`. The `services/auth.ts` `getProfile()` function maps between them:

```typescript
return {
  id: data.id,
  idNumber: data.email?.replace('@police.gov.vn', '') || '',
  fullName: data.full_name,      // snake_case → camelCase
  phoneNumber: data.phone_number,
  // ...
};
```

## Design System

The UI follows a **government-themed design** extracted from the LocationID Tracker HTML export.

**Theme Location:** `theme/` directory

**Color Palette:**
- **Primary (Green):** `#0f5132` - Headers, official elements, text
- **Secondary (Red):** `#dc2626` - Action buttons, alerts
- **Accent (Yellow):** `#fbbf24` - Highlights, warnings, badges
- **Neutral (Gray):** `#f1f5f9` - Backgrounds

**Component Library:** `components/` directory
- All components are fully typed and documented
- Components follow Vietnamese language conventions
- Use `theme` object for all styling (never hardcoded colors)

**Styling Pattern:**
```typescript
import { theme } from '../theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.primary[600],
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.primary,
  },
});
```

## Key Workflows

### Survey Workflow
```
Login → Dashboard → Start Survey → Capture GPS → Take Photos
  → Enter Metadata → Draw Polygon (optional) → Review → Submit
```

Each screen stores data locally, queued for sync.

### Offline Sync Implementation

**When implementing sync logic:**
1. Store pending operations in local queue (SQLite table)
2. Use NetInfo to detect connectivity
3. On reconnect, process queue with retry logic:
   ```typescript
   // Pseudo-code pattern
   for (let item of queue) {
     try {
       await uploadSurvey(item);
       await uploadPhotos(item);
       await uploadPolygon(item);
       markSynced(item.id);
     } catch (error) {
       if (isNetworkError(error)) {
         incrementRetryCount(item.id);
         break; // Stop processing, try again later
       }
     }
   }
   ```
4. Remove from queue on success, increment retry on failure
5. Max 5 retries, then flag as failed

### Photo Upload Pattern

Photos are stored as file URIs locally, uploaded to Supabase Storage on sync:

```typescript
const response = await fetch(photoUri);
const blob = await response.blob();
const arrayBuffer = await new Response(blob).arrayBuffer();
const fileName = `photos/${surveyId}/${Date.now()}.jpg`;

const { error } = await supabase.storage
  .from('survey-photos')
  .upload(fileName, arrayBuffer, { contentType: 'image/jpeg' });

// Then save fileName to survey_media.file_path
```

## Environment Configuration

**Required:** `.env` file in project root with:
```env
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
```

Variables **must** be prefixed with `EXPO_PUBLIC_` to be accessible in Expo apps.

## Vietnamese Language

**All user-facing text must be in Vietnamese:**
- UI labels and buttons
- Error messages
- Validation messages
- Help text

**Example:**
```typescript
// ✅ Correct
throw new Error('Mã cán bộ hoặc mật khẩu không đúng');

// ❌ Wrong
throw new Error('Invalid credentials');
```

## Testing Strategy

**Manual Testing Flow:**
1. Run `npm run verify` to check setup
2. Create test user in Supabase Auth:
   - Email: `123456789012@police.gov.vn`
   - Password: `Test@123456`
3. Create matching profile in `profiles` table
4. Test login → should see dashboard with user name
5. Test offline mode (disable network, app should still work)

**Key Test Scenarios:**
- Login with 12-digit ID
- Session persistence (close/reopen app)
- Offline survey creation
- Sync when back online
- Photo capture and upload
- GPS accuracy handling

## Common Patterns

### Creating New Screens

1. Create screen component in `screens/`
2. Use existing components from `components/`
3. Add to `screens/index.ts`
4. Connect to navigation stack
5. Use Vietnamese for all text

### Adding New API Calls

1. Add type definitions to `types/database.ts` or `types/survey.ts`
2. Create service function in `services/` (or extend existing)
3. Add RLS policy in Supabase for new tables
4. Implement offline queue if data needs sync
5. Handle network errors gracefully

### State Management

Use Zustand for global state (auth, survey-in-progress, sync queue):

```typescript
import { create } from 'zustand';

export const useSurveyStore = create((set) => ({
  currentSurvey: null,
  setCurrentSurvey: (survey) => set({ currentSurvey: survey }),
}));
```

## File Upload Strategy

**Never store binary data in database.** Store files in Expo FileSystem, upload to Supabase Storage on sync:

1. Local: `expo-file-system` → save to app's document directory
2. Store file URI in local SQLite
3. On sync: Read file, upload to Storage bucket
4. Store public URL or file path in database

## Security Considerations

- **RLS is mandatory** on all Supabase tables
- Never store passwords locally
- Use `expo-secure-store` for sensitive data (future enhancement)
- All API calls go through RLS - officers see only their data
- Photos in Storage buckets should have RLS policies

## Project Status

**Implemented:**
- ✅ Authentication system (ID number login)
- ✅ Theme/design system
- ✅ UI component library
- ✅ Supabase client setup
- ✅ Type definitions

**To Be Implemented:**
- ⏳ Dashboard screen
- ⏳ Survey screens (GPS, photos, metadata, polygon)
- ⏳ Offline sync queue
- ⏳ History/list view
- ⏳ Settings screen
- ⏳ Photo capture integration
- ⏳ GPS/location services
- ⏳ Polygon drawing on map

## Documentation Files

- `AUTH_QUICKSTART.md` - Quick setup guide
- `BUGFIXES.md` - Common issues and solutions
- `FIXES_APPLIED.md` - Recent bug fixes applied
- `instruction.README` - **Detailed product requirements** (read this first for new features)
- `screens/README.md` - Authentication implementation details
- `components/README.md` - Component API documentation
- `theme/README.md` - Color palette and design system guide
- `IMPLEMENTATION_SUMMARY.md` - What's been built so far

When implementing new features, always reference `instruction.README` for the expected behavior and data flow.
