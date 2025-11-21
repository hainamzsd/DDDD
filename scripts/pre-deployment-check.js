#!/usr/bin/env node

/**
 * Pre-Deployment Verification Script
 *
 * This script performs automated checks to ensure the codebase is ready for deployment.
 * Run this before deploying to staging or production environments.
 *
 * Usage: node scripts/pre-deployment-check.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

// Track results
let passed = 0;
let failed = 0;
let warnings = 0;

/**
 * Print section header
 */
function printSection(title) {
  console.log('\n' + colors.cyan + colors.bright + '═'.repeat(80) + colors.reset);
  console.log(colors.cyan + colors.bright + title + colors.reset);
  console.log(colors.cyan + colors.bright + '═'.repeat(80) + colors.reset + '\n');
}

/**
 * Print check result
 */
function printCheck(name, status, message = '') {
  const statusStr = status === 'pass' ? colors.green + '✓ PASS' :
                    status === 'fail' ? colors.red + '✗ FAIL' :
                    colors.yellow + '⚠ WARN';

  console.log(`${statusStr}${colors.reset} ${name}`);
  if (message) {
    console.log(`       ${message}`);
  }

  if (status === 'pass') passed++;
  else if (status === 'fail') failed++;
  else if (status === 'warn') warnings++;
}

/**
 * Check if file exists
 */
function fileExists(filePath) {
  return fs.existsSync(path.join(__dirname, '..', filePath));
}

/**
 * Run shell command and return output
 */
function runCommand(command, silent = false) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Check environment files
 */
function checkEnvironmentFiles() {
  printSection('1. Environment Configuration');

  // Check .env file exists
  if (fileExists('.env')) {
    printCheck('Environment file (.env)', 'pass');

    // Read and validate env vars
    const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
    const hasSupabaseUrl = envContent.includes('EXPO_PUBLIC_SUPABASE_URL=');
    const hasSupabaseKey = envContent.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY=');

    if (hasSupabaseUrl && hasSupabaseKey) {
      printCheck('Required environment variables', 'pass');
    } else {
      printCheck('Required environment variables', 'fail',
        'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
    }
  } else {
    printCheck('Environment file (.env)', 'fail',
      'Create .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  }

  // Check .env.example exists for reference
  if (fileExists('.env.example')) {
    printCheck('Environment example file', 'pass');
  } else {
    printCheck('Environment example file', 'warn',
      'Consider creating .env.example for documentation');
  }
}

/**
 * Check TypeScript compilation
 */
function checkTypeScript() {
  printSection('2. TypeScript Compilation');

  console.log('Running TypeScript compiler...\n');
  const result = runCommand('npm run type-check', true);

  if (result.success) {
    printCheck('TypeScript compilation', 'pass', 'No type errors found');
  } else {
    printCheck('TypeScript compilation', 'fail',
      'Run "npm run type-check" to see errors');
  }
}

/**
 * Check test suite
 */
function checkTests() {
  printSection('3. Test Suite');

  console.log('Running test suite...\n');
  const result = runCommand('npm test -- --passWithNoTests', true);

  if (result.success) {
    printCheck('Jest test suite', 'pass', 'All tests passing');
  } else {
    printCheck('Jest test suite', 'fail',
      'Run "npm test" to see failures');
  }
}

/**
 * Check required dependencies
 */
function checkDependencies() {
  printSection('4. Dependencies');

  if (!fileExists('node_modules')) {
    printCheck('Node modules installed', 'fail',
      'Run "npm install" to install dependencies');
    return;
  }

  printCheck('Node modules installed', 'pass');

  // Check package.json
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
  );

  // Critical dependencies for C06 app
  const requiredDeps = [
    'expo',
    'react',
    'react-native',
    '@supabase/supabase-js',
    'zustand',
    'expo-location',
    'expo-image-picker',
    'expo-file-system',
    'react-native-maps',
  ];

  const missingDeps = requiredDeps.filter(
    dep => !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
  );

  if (missingDeps.length === 0) {
    printCheck('Critical dependencies', 'pass');
  } else {
    printCheck('Critical dependencies', 'fail',
      `Missing: ${missingDeps.join(', ')}`);
  }
}

/**
 * Check database schema files
 */
function checkDatabaseFiles() {
  printSection('5. Database Schema');

  const schemaFiles = [
    'supabase/schema.sql',
    'supabase/seed-land-use-types-official.sql',
    'supabase/seed-admin-units.sql',
    'supabase/migration-cadastral-versions.sql',
  ];

  let allFilesExist = true;
  schemaFiles.forEach(file => {
    if (fileExists(file)) {
      printCheck(path.basename(file), 'pass');
    } else {
      printCheck(path.basename(file), 'fail', `File not found: ${file}`);
      allFilesExist = false;
    }
  });

  if (allFilesExist) {
    printCheck('All schema files present', 'pass');
  }
}

/**
 * Check documentation
 */
function checkDocumentation() {
  printSection('6. Documentation');

  const docFiles = [
    'CLAUDE.md',
    'docs/DEPLOYMENT_GUIDE.md',
    'docs/API_DOCUMENTATION.md',
    'docs/DATA_MODEL.md',
    'docs/SURVEY_WORKFLOW.md',
    'docs/OFFLINE_SYNC.md',
  ];

  let missingDocs = [];
  docFiles.forEach(file => {
    if (!fileExists(file)) {
      missingDocs.push(file);
    }
  });

  if (missingDocs.length === 0) {
    printCheck('Core documentation files', 'pass', `${docFiles.length} files present`);
  } else {
    printCheck('Core documentation files', 'warn',
      `Missing: ${missingDocs.join(', ')}`);
  }
}

/**
 * Check for common issues
 */
function checkCommonIssues() {
  printSection('7. Common Issues');

  // Check for TODOs in source code
  try {
    const grepResult = execSync(
      'grep -r "TODO\\|FIXME\\|HACK" --include="*.ts" --include="*.tsx" . 2>/dev/null || true',
      { encoding: 'utf8', cwd: path.join(__dirname, '..') }
    );

    if (grepResult.trim()) {
      const todoCount = grepResult.split('\n').filter(line => line.trim()).length;
      printCheck('No TODOs/FIXMEs in code', 'warn',
        `Found ${todoCount} TODO/FIXME comments`);
    } else {
      printCheck('No TODOs/FIXMEs in code', 'pass');
    }
  } catch (error) {
    printCheck('TODO/FIXME check', 'warn', 'Could not check (grep not available)');
  }

  // Check for console.log (should use proper logging in production)
  try {
    const consoleLogResult = execSync(
      'grep -r "console\\.log" --include="*.ts" --include="*.tsx" ./services ./screens ./store 2>/dev/null | wc -l || echo 0',
      { encoding: 'utf8', cwd: path.join(__dirname, '..') }
    );

    const consoleLogCount = parseInt(consoleLogResult.trim());
    if (consoleLogCount > 20) {
      printCheck('Console.log usage', 'warn',
        `Found ${consoleLogCount} console.log statements. Consider using proper logging.`);
    } else {
      printCheck('Console.log usage', 'pass', `${consoleLogCount} console.log statements found`);
    }
  } catch (error) {
    printCheck('Console.log check', 'warn', 'Could not check');
  }

  // Check .gitignore includes sensitive files
  if (fileExists('.gitignore')) {
    const gitignore = fs.readFileSync(path.join(__dirname, '..', '.gitignore'), 'utf8');
    const hasEnv = gitignore.includes('.env');
    const hasNodeModules = gitignore.includes('node_modules');

    if (hasEnv && hasNodeModules) {
      printCheck('.gitignore configuration', 'pass');
    } else {
      printCheck('.gitignore configuration', 'warn',
        'Ensure .env and node_modules are in .gitignore');
    }
  }
}

/**
 * Check Expo configuration
 */
function checkExpoConfig() {
  printSection('8. Expo Configuration');

  if (fileExists('app.json')) {
    printCheck('Expo config file (app.json)', 'pass');

    const appJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8')
    );

    if (appJson.expo && appJson.expo.name && appJson.expo.slug) {
      printCheck('App name and slug configured', 'pass');
    } else {
      printCheck('App name and slug configured', 'fail');
    }

    if (appJson.expo && appJson.expo.version) {
      printCheck('App version defined', 'pass', `Version: ${appJson.expo.version}`);
    } else {
      printCheck('App version defined', 'warn', 'Consider setting version number');
    }
  } else {
    printCheck('Expo config file (app.json)', 'fail');
  }

  // Check for EAS configuration
  if (fileExists('eas.json')) {
    printCheck('EAS configuration (eas.json)', 'pass');
  } else {
    printCheck('EAS configuration (eas.json)', 'warn',
      'Create eas.json for EAS Build/Submit');
  }
}

/**
 * Print summary
 */
function printSummary() {
  printSection('Summary');

  const total = passed + failed + warnings;

  console.log(`Total checks: ${total}`);
  console.log(`${colors.green}✓ Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠ Warnings: ${warnings}${colors.reset}\n`);

  if (failed === 0) {
    console.log(colors.green + colors.bright + '✓ DEPLOYMENT READY' + colors.reset);
    console.log('The codebase passes all critical checks.\n');
    return 0;
  } else {
    console.log(colors.red + colors.bright + '✗ NOT READY FOR DEPLOYMENT' + colors.reset);
    console.log('Please fix the failed checks before deploying.\n');
    return 1;
  }
}

/**
 * Main execution
 */
function main() {
  console.log(colors.bright + '\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║  LocationID Tracker (C06) - Pre-Deployment Verification                   ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝' + colors.reset);

  checkEnvironmentFiles();
  checkTypeScript();
  checkTests();
  checkDependencies();
  checkDatabaseFiles();
  checkDocumentation();
  checkCommonIssues();
  checkExpoConfig();

  const exitCode = printSummary();
  process.exit(exitCode);
}

// Run the script
main();
