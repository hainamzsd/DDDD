# 🚀 Quick Reference - LocationID Tracker Auth

## ⚡ Get Started in 3 Commands

```bash
# 1. Install dependencies
npm install

# 2. Verify setup
npm run verify

# 3. Start app
npm start
```

---

## 📝 Common Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm start` | Start Expo development server |
| `npm run verify` | Check if setup is correct |
| `npm run type-check` | Check for TypeScript errors |
| `npm run android` | Start Android emulator |
| `npm run ios` | Start iOS simulator |

---

## 🔑 Test Credentials

**ID Number:** `123456789012`
**Password:** `Test@123456`

*(Create this user in Supabase first - see AUTH_QUICKSTART.md)*

---

## 📂 Key Files

### Import These in Your Code
```typescript
// Components
import { Button, Input, Header } from './components';

// Theme
import { theme, colors } from './theme';

// Auth
import { useAuthStore } from './store/authStore';
import { LoginScreen } from './screens';
```

### Configuration Files
- `.env` - Supabase credentials
- `tsconfig.json` - TypeScript config
- `package.json` - Dependencies

---

## 🎨 Color Palette

```typescript
// Primary (Green)
colors.primary[600]  // #0f5132 - Headers, text

// Secondary (Red)
colors.secondary[500]  // #dc2626 - Buttons, actions

// Accent (Yellow)
colors.accent[400]  // #fbbf24 - Highlights, warnings

// Background
colors.neutral[100]  // #f1f5f9 - App background
```

---

## 🔐 Auth Usage

### In Components
```typescript
const { user, isAuthenticated, signIn, signOut } = useAuthStore();

// Login
await signIn('123456789012', 'password');

// Check auth
if (isAuthenticated) {
  console.log('User:', user.fullName);
}

// Logout
await signOut();
```

### Check Auth on Start
```typescript
useEffect(() => {
  checkAuth();
}, []);
```

---

## 🧩 Component Examples

### Button
```typescript
<Button
  variant="primary"
  onPress={() => {}}
>
  Click Me
</Button>
```

### Input
```typescript
<Input
  label="Name"
  value={name}
  onChangeText={setName}
  leftIcon={<Icon name="user" />}
/>
```

### Password
```typescript
<PasswordInput
  label="Password"
  value={password}
  onChangeText={setPassword}
/>
```

---

## 🐛 Quick Fixes

### Module Not Found
```bash
npm install
expo start --clear
```

### TypeScript Errors
```bash
npm run type-check
```

### Import Errors
Use relative paths:
```typescript
// ✅ Correct
import { theme } from '../theme';

// ❌ Wrong
import { theme } from '@/theme';
```

---

## 📖 Documentation

| File | When to Read |
|------|-------------|
| `AUTH_QUICKSTART.md` | First time setup |
| `FIXES_APPLIED.md` | Just installed/cloned |
| `BUGFIXES.md` | Having errors |
| `screens/README.md` | Using auth |
| `components/README.md` | Building UI |
| `theme/README.md` | Styling |

---

## ✅ Verification

```bash
npm run verify
```

Expected: **10/10 checks pass**

If failed:
1. Run `npm install`
2. Check `.env` file exists
3. Re-run `npm run verify`

---

## 🎯 File Structure

```
App/
├── components/      → UI components
├── theme/          → Colors, typography
├── screens/        → LoginScreen, etc.
├── services/       → Supabase, auth
├── store/          → Auth state (Zustand)
├── types/          → TypeScript types
└── .env            → Supabase keys
```

---

## 🔒 Security

✅ Row Level Security enabled
✅ Sessions encrypted
✅ No credentials in code
✅ HTTPS only
✅ Input validation

---

## 💡 Tips

1. **Always run `npm install` first**
2. **Use `npm run verify` to check setup**
3. **Check documentation for detailed info**
4. **Use relative imports (../) not (@/)**
5. **Restart Expo if module errors persist**

---

## 📞 Getting Help

1. Check `BUGFIXES.md` for common issues
2. Run `npm run verify` to diagnose
3. Check console for error messages
4. Review documentation files

---

## 🎉 You're Ready!

```bash
npm install && npm start
```

**Happy coding!** 🚀
