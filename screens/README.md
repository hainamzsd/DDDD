# Authentication Implementation

Complete authentication implementation using Supabase with ID number (12 digits) and password login.

## Overview

The authentication system uses:
- **Supabase Auth** for secure authentication
- **ID Number Login**: 12-digit police officer ID numbers
- **Zustand** for global state management
- **AsyncStorage** for session persistence
- **Custom UI Components** following the LocationID Tracker design system

## Authentication Flow

1. **Officer enters 12-digit ID number and password**
2. **ID number is converted to email format**: `{idNumber}@police.gov.vn`
3. **Supabase Auth validates credentials**
4. **User profile is fetched from `profiles` table**
5. **Session is stored locally in AsyncStorage**
6. **User is redirected to Dashboard**

## Files Structure

```
/services/auth.ts          # Authentication service with Supabase
/services/supabase.ts      # Supabase client configuration
/store/authStore.ts        # Zustand store for auth state
/screens/LoginScreen.tsx   # Login screen UI component
/types/survey.ts           # Profile and auth types
```

## Usage

### 1. Setup Environment Variables

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Import and Use Login Screen

```typescript
import { LoginScreen } from './screens';
import { useAuthStore } from './store/authStore';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      {!isAuthenticated ? (
        <LoginScreen onLoginSuccess={() => {
          // Navigate to dashboard
          console.log('Login successful!');
        }} />
      ) : (
        <DashboardScreen />
      )}
    </>
  );
}
```

### 3. Use Auth Store in Components

```typescript
import { useAuthStore } from '@/store/authStore';

function MyComponent() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    signIn,
    signOut,
    checkAuth,
  } = useAuthStore();

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Access user data
  if (user) {
    console.log('Officer name:', user.fullName);
    console.log('Role:', user.role);
  }

  // Sign out
  const handleSignOut = async () => {
    await signOut();
  };
}
```

## Auth Service API

### `authService.signInWithIdNumber(idNumber, password)`

Sign in with 12-digit ID number and password.

**Parameters:**
- `idNumber` (string): 12-digit police officer ID number
- `password` (string): Officer password

**Returns:** Promise with user data and profile

**Example:**
```typescript
try {
  const result = await authService.signInWithIdNumber('123456789012', 'password123');
  console.log('User:', result.profile);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### `authService.signOut()`

Sign out the current user and clear session.

**Example:**
```typescript
await authService.signOut();
```

### `authService.getCurrentUser()`

Get the currently authenticated user with profile data.

**Returns:** Promise<AuthUser | null>

**Example:**
```typescript
const user = await authService.getCurrentUser();
if (user) {
  console.log('Logged in as:', user.fullName);
}
```

### `authService.getSession()`

Get the current Supabase session.

**Returns:** Promise with session data

### `authService.onAuthStateChange(callback)`

Subscribe to authentication state changes.

**Example:**
```typescript
const { data: { subscription } } = authService.onAuthStateChange((session) => {
  if (session) {
    console.log('User logged in');
  } else {
    console.log('User logged out');
  }
});

// Cleanup
subscription.unsubscribe();
```

## Auth Store API

### State

```typescript
{
  user: AuthUser | null;           // Current user with profile
  isLoading: boolean;              // Loading state
  isAuthenticated: boolean;        // Authentication status
  error: string | null;            // Error message
}
```

### Actions

```typescript
{
  signIn: (idNumber: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;  // Check/restore session on app start
  clearError: () => void;           // Clear error message
}
```

## Input Validation

The LoginScreen includes built-in validation:

### ID Number Validation
- **Format**: Exactly 12 digits (0-9)
- **Auto-formatting**: Removes non-digit characters automatically
- **Real-time validation**: Shows error messages as user types
- **Error messages**:
  - Empty: "Vui lòng nhập mã cán bộ"
  - Invalid length: "Mã cán bộ phải có đúng 12 chữ số"

### Password Validation
- **Required**: Cannot be empty
- **Visibility toggle**: Eye icon to show/hide password
- **Secure entry**: Password is masked by default

## Error Handling

All errors are handled gracefully with user-friendly Vietnamese messages:

```typescript
// Invalid credentials
"Mã cán bộ hoặc mật khẩu không đúng"

// Network errors
"Không thể kết nối đến server"

// Other errors
Error message from Supabase
```

Errors are displayed using:
1. **Alert dialog** for login errors
2. **Inline validation** for input errors
3. **Form-level error state** managed by Zustand

## Security Features

### Row Level Security (RLS)
- Officers can only access their own profile data
- Policies enforce `auth.uid() = id` on profiles table

### Session Persistence
- Sessions are stored securely in AsyncStorage
- Auto-refresh tokens prevent session expiration
- Sessions persist across app restarts

### Password Security
- Passwords are never stored locally
- Supabase Auth handles password hashing
- HTTPS encryption for all network requests

### Email Format Conversion
- ID numbers are converted to email format for Supabase Auth
- Format: `{idNumber}@police.gov.vn`
- This allows using Supabase's built-in auth while using ID numbers

## Database Setup

### Profiles Table Structure

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('officer', 'leader', 'admin')),
  unit_code TEXT NOT NULL,
  ward_code TEXT NOT NULL,
  district_code TEXT NOT NULL,
  province_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);
```

### Creating Test Users

Use Supabase SQL editor or Auth UI:

```sql
-- Example: Create a test user with ID number 123456789012
-- In Supabase Auth, create user with:
-- Email: 123456789012@police.gov.vn
-- Password: your_password

-- Then insert profile:
INSERT INTO public.profiles (
  id,
  full_name,
  phone_number,
  role,
  unit_code,
  ward_code,
  district_code,
  province_code
) VALUES (
  'user_uuid_from_auth',
  'Officer Test Name',
  '0912345678',
  'officer',
  'C06-01',
  '26734',
  '751',
  '79'
);
```

## Styling

The LoginScreen uses the LocationID Tracker color palette:

```typescript
// Primary colors (Green - Government theme)
backgroundColor: theme.colors.primary[600]  // Dark green background
textColor: theme.colors.special.white       // White text

// Form colors
formBackground: theme.colors.special.white  // White form
inputBorder: theme.colors.primary[200]      // Light green border
inputFocus: theme.colors.accent[400]        // Yellow focus

// Button colors
buttonBackground: theme.colors.secondary[500]  // Red button
buttonText: theme.colors.special.white         // White text

// Accent colors
accentText: theme.colors.accent[400]  // Yellow ministry text
```

## Offline Behavior

### Current Implementation
- **Online Required**: Login requires internet connection
- **Session Persistence**: Once logged in, session persists offline
- **Auto-reconnect**: Session restored when app restarts

### Future Enhancement
For full offline support, implement:
1. Store credentials hash locally (securely with expo-secure-store)
2. Allow offline login with cached credentials
3. Sync session when back online
4. Show offline indicator during login attempt

## Testing

### Manual Testing Checklist

- [ ] Enter valid 12-digit ID number and password → Login succeeds
- [ ] Enter invalid ID number (< 12 digits) → Shows validation error
- [ ] Enter invalid ID number (> 12 digits) → Prevents entry
- [ ] Enter non-digit characters → Auto-removes them
- [ ] Enter wrong password → Shows "Mã cán bộ hoặc mật khẩu không đúng"
- [ ] Toggle password visibility → Shows/hides password
- [ ] Test offline → Shows network error
- [ ] Test session persistence → Restart app, user stays logged in
- [ ] Test sign out → Clears session and returns to login
- [ ] Test keyboard handling → Form scrolls when keyboard appears

### Unit Testing (Future)

```typescript
// Example test cases
describe('LoginScreen', () => {
  it('validates 12-digit ID number', () => {
    // Test validation logic
  });

  it('shows error for invalid credentials', () => {
    // Test error handling
  });

  it('stores session on successful login', () => {
    // Test session persistence
  });
});
```

## Troubleshooting

### "Supabase URL and Anon Key must be set"
- Ensure `.env` file exists in root directory
- Variables must start with `EXPO_PUBLIC_`
- Restart development server after changing .env

### "Invalid login credentials"
- Verify ID number exists in Supabase Auth (as email format)
- Check password is correct
- Ensure RLS policies are correctly set up

### "Error fetching user profile"
- User exists in Auth but not in profiles table
- Create matching profile record with same UUID
- Check RLS policies on profiles table

### Session not persisting
- Check AsyncStorage is properly configured
- Verify Supabase client auth settings
- Clear app data and try fresh login

## Next Steps

After implementing authentication:

1. **Create Dashboard Screen** - Main app screen after login
2. **Add Navigation** - React Navigation with auth flow
3. **Implement Protected Routes** - Check auth before showing screens
4. **Add Profile Management** - Update user profile screen
5. **Implement Offline Sync** - Queue actions when offline
6. **Add Biometric Auth** - Face ID / Touch ID for quick login

## Related Documentation

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [React Navigation Auth Flow](https://reactnavigation.org/docs/auth-flow/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
