# Authentication Quick Start Guide

Get your authentication system up and running in 5 minutes.

## 📋 Prerequisites

- Expo project already set up ✅
- Supabase project created ✅
- Dependencies installed ✅

## 🚀 Quick Setup (5 Steps)

### Step 1: Configure Environment Variables

Rename the `.env` file (already created) and verify it contains:

```env
EXPO_PUBLIC_SUPABASE_URL=https://kdmglhklcdegibkhsmlf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2: Setup Database (Supabase SQL Editor)

Run this SQL in your Supabase SQL editor:

```sql
-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
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

### Step 3: Create a Test User

In Supabase Dashboard → Authentication → Users → Add User:

**Email format**: `123456789012@police.gov.vn` (use 12-digit ID as email prefix)
**Password**: `Test@123456` (or your choice)

Then create matching profile in SQL editor:

```sql
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
  'paste-user-uuid-here',  -- Get from Auth Users table
  'Nguyễn Văn A',
  '0912345678',
  'officer',
  'C06-01',
  '26734',
  '751',
  '79'
);
```

### Step 4: Update App.tsx

Replace your `App.tsx` with the example:

```bash
# Backup current App.tsx
mv App.tsx App.tsx.backup

# Use the example
mv App.example.tsx App.tsx
```

Or manually copy the code from `App.example.tsx` to `App.tsx`.

### Step 5: Run the App

```bash
npm start
# or
expo start
```

## 🧪 Test the Login

1. **Open the app** - You should see the login screen
2. **Enter test credentials**:
   - Mã Cán Bộ: `123456789012`
   - Mật Khẩu: `Test@123456`
3. **Tap "Đăng Nhập"**
4. **Success!** You should see the dashboard with your name

## 📱 What You Should See

### Login Screen
- Green background with police badge
- "BỘ CÔNG AN" text in yellow
- "NLIS Field Survey" title
- White form with:
  - ID number input (12 digits)
  - Password input (with show/hide toggle)
  - Red login button

### After Login
- Dashboard placeholder with:
  - Welcome message with your name
  - Your role (officer/leader/admin)
  - Your unit code
  - Sign out link

## ✅ Testing Checklist

- [ ] Login screen appears on app start
- [ ] Can enter 12-digit ID number
- [ ] Non-digits are automatically removed
- [ ] Shows error if ID < 12 digits
- [ ] Password toggle works (eye icon)
- [ ] Login button disabled until form is valid
- [ ] Shows loading indicator during login
- [ ] Shows error alert for wrong credentials
- [ ] Successful login shows dashboard
- [ ] User name and role displayed correctly
- [ ] Sign out returns to login screen
- [ ] Session persists after app restart

## 🐛 Troubleshooting

### "Supabase URL and Anon Key must be set"

**Solution**:
1. Check `.env` file exists in root directory
2. Variables must start with `EXPO_PUBLIC_`
3. Restart metro bundler: `expo start --clear`

### "Mã cán bộ hoặc mật khẩu không đúng"

**Solution**:
1. Verify user exists in Supabase Auth with email format: `{12digits}@police.gov.vn`
2. Check password is correct (case-sensitive)
3. Verify user UUID matches profile.id

### "Error fetching user profile"

**Solution**:
1. User exists in Auth but not in profiles table
2. Run the INSERT query to create profile
3. Check RLS policies are enabled

### App crashes on login

**Solution**:
1. Check console for errors
2. Verify all imports are correct
3. Ensure `@expo/vector-icons` is installed
4. Clear cache: `expo start --clear`

## 📂 Files Created

Your authentication system includes:

```
/services/
  auth.ts              ✅ Auth service with ID number login
  supabase.ts          ✅ Supabase client config

/store/
  authStore.ts         ✅ Zustand auth state management

/screens/
  LoginScreen.tsx      ✅ Beautiful login UI
  index.ts             ✅ Screen exports
  README.md            ✅ Detailed documentation

/components/           ✅ UI components (Button, Input, etc.)
/theme/                ✅ Color palette & styling
/.env                  ✅ Environment variables
/App.example.tsx       ✅ Example integration
```

## 🎨 Customization

### Change Colors

Edit `theme/colors.ts`:

```typescript
// Change primary green
primary: {
  600: '#0f5132',  // Your custom color
}

// Change accent yellow
accent: {
  400: '#fbbf24',  // Your custom color
}
```

### Change Text

Edit `screens/LoginScreen.tsx`:

```typescript
// Ministry text
<CaptionBold>YOUR MINISTRY NAME</CaptionBold>

// System title
<Heading1>Your System Name</Heading1>

// Welcome message
<Body>Your welcome message here</Body>
```

### Change Validation

Edit `screens/LoginScreen.tsx`:

```typescript
// Change ID number length
const cleaned = value.replace(/\D/g, '').slice(0, 10); // 10 digits instead of 12

// Change validation pattern
if (!/^\d{10}$/.test(idNumber)) {
  // Your validation logic
}
```

## 🔒 Security Checklist

- [x] Passwords never stored locally
- [x] HTTPS encryption for all requests
- [x] Row Level Security (RLS) enabled
- [x] Sessions stored in AsyncStorage (encrypted)
- [x] Auto-refresh tokens
- [x] Input validation on client and server
- [x] SQL injection protected (Supabase handles)
- [ ] **TODO**: Add biometric authentication
- [ ] **TODO**: Add rate limiting
- [ ] **TODO**: Add device fingerprinting

## 📖 Next Steps

1. **Add Navigation**: Install React Navigation
   ```bash
   npm install @react-navigation/native @react-navigation/stack
   ```

2. **Create Dashboard Screen**: Build the main app interface

3. **Add Protected Routes**: Wrap screens with auth check

4. **Implement Offline Mode**: Queue actions when offline

5. **Add Profile Management**: Let users update their profile

6. **Setup Camera Permissions**: For photo capture

7. **Configure GPS**: For location tracking

## 🆘 Need Help?

1. **Check Documentation**:
   - `screens/README.md` - Detailed auth docs
   - `components/README.md` - UI component docs
   - `theme/README.md` - Color palette guide

2. **Check Console Logs**:
   - Login attempts are logged
   - Errors are logged with details

3. **Common Issues**:
   - Environment variables not loading → Restart server
   - Session not persisting → Check AsyncStorage setup
   - Profile not found → Create matching profile record

## 🎉 Success!

If you see the dashboard with your name, **congratulations!** 🎊

Your authentication system is working correctly. You can now:
- Build the rest of your app screens
- Add navigation between screens
- Implement the survey workflow
- Add offline functionality

---

**Created with the LocationID Tracker Design System** 🎨
