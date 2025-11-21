#!/usr/bin/env node

/**
 * Setup Verification Script
 * Checks if all dependencies and configurations are correct
 */

const fs = require('fs');
const path = require('path');

const checks = [];
let passCount = 0;
let failCount = 0;

function check(name, test, suggestion) {
  try {
    const result = test();
    if (result) {
      console.log(`✅ ${name}`);
      passCount++;
      checks.push({ name, status: 'pass' });
    } else {
      console.log(`❌ ${name}`);
      if (suggestion) console.log(`   → ${suggestion}`);
      failCount++;
      checks.push({ name, status: 'fail', suggestion });
    }
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   → Error: ${error.message}`);
    failCount++;
    checks.push({ name, status: 'error', error: error.message });
  }
}

console.log('\n🔍 Verifying LocationID Tracker Setup...\n');

// Check 1: package.json exists
check(
  'package.json exists',
  () => fs.existsSync('./package.json'),
  'Run npm init or ensure you are in the correct directory'
);

// Check 2: Required dependencies
check(
  'Dependencies installed',
  () => {
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const required = [
      '@supabase/supabase-js',
      'zustand',
      '@react-native-async-storage/async-storage',
      '@expo/vector-icons',
    ];
    return required.every(dep =>
      pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]
    );
  },
  'Run: npm install'
);

// Check 3: .env file exists
check(
  '.env file exists',
  () => fs.existsSync('./.env'),
  'Create .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY'
);

// Check 4: .env has required variables
check(
  '.env has Supabase credentials',
  () => {
    if (!fs.existsSync('./.env')) return false;
    const env = fs.readFileSync('./.env', 'utf8');
    return (
      env.includes('EXPO_PUBLIC_SUPABASE_URL') &&
      env.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY')
    );
  },
  'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env'
);

// Check 5: Theme files exist
check(
  'Theme system files exist',
  () =>
    fs.existsSync('./theme/colors.ts') &&
    fs.existsSync('./theme/typography.ts') &&
    fs.existsSync('./theme/spacing.ts') &&
    fs.existsSync('./theme/index.ts'),
  'Theme files are missing - check if setup was completed'
);

// Check 6: Component files exist
check(
  'Component library exists',
  () =>
    fs.existsSync('./components/Button.tsx') &&
    fs.existsSync('./components/Input.tsx') &&
    fs.existsSync('./components/Badge.tsx') &&
    fs.existsSync('./components/index.ts'),
  'Component files are missing - check if setup was completed'
);

// Check 7: Auth files exist
check(
  'Auth system files exist',
  () =>
    fs.existsSync('./services/auth.ts') &&
    fs.existsSync('./store/authStore.ts') &&
    fs.existsSync('./screens/LoginScreen.tsx'),
  'Auth files are missing - check if setup was completed'
);

// Check 8: tsconfig.json has path mapping
check(
  'TypeScript configuration correct',
  () => {
    if (!fs.existsSync('./tsconfig.json')) return false;
    const tsconfig = JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8'));
    return tsconfig.compilerOptions?.baseUrl === '.';
  },
  'Update tsconfig.json with baseUrl setting'
);

// Check 9: No @/ imports in critical files (they should be relative)
check(
  'Imports use relative paths (not @/ aliases)',
  () => {
    const files = [
      './services/auth.ts',
      './store/authStore.ts',
      './screens/LoginScreen.tsx',
    ];
    return files.every(file => {
      if (!fs.existsSync(file)) return false;
      const content = fs.readFileSync(file, 'utf8');
      // Should use ../ imports, not @/ imports
      return !content.includes("from '@/") && content.includes("from '../");
    });
  },
  'Some files still use @/ imports - they should use relative paths (../)'
);

// Check 10: Documentation exists
check(
  'Documentation files exist',
  () =>
    fs.existsSync('./AUTH_QUICKSTART.md') &&
    fs.existsSync('./BUGFIXES.md') &&
    fs.existsSync('./screens/README.md'),
  'Documentation files are missing'
);

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed\n`);

if (failCount === 0) {
  console.log('✅ All checks passed! Your setup is ready.');
  console.log('\n🚀 Next steps:');
  console.log('   1. Create a test user in Supabase');
  console.log('   2. Update App.tsx with App.example.tsx code');
  console.log('   3. Run: expo start');
  console.log('   4. Test login with your credentials\n');
  process.exit(0);
} else {
  console.log('❌ Some checks failed. Please fix the issues above.\n');
  console.log('📖 For help, see:');
  console.log('   - AUTH_QUICKSTART.md for setup instructions');
  console.log('   - BUGFIXES.md for common issues\n');
  process.exit(1);
}
