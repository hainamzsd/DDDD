/**
 * Supabase Connection Test Script
 *
 * This script tests your Supabase connection and database setup.
 * Run it to verify everything is configured correctly.
 *
 * Usage:
 *   npx ts-node supabase/test-connection.ts
 */

import { supabase } from '../services/supabase';

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  try {
    // Test 1: Check Supabase client initialization
    console.log('✓ Supabase client initialized');

    // Test 2: Test database connection
    const { data: testData, error: testError } = await supabase
      .from('ref_object_types')
      .select('count')
      .limit(1);

    if (testError) {
      throw new Error(`Database connection failed: ${testError.message}`);
    }

    console.log('✓ Database connection successful');

    // Test 3: Check object types
    const { data: objectTypes, error: objError } = await supabase
      .from('ref_object_types')
      .select('*')
      .order('sort_order');

    if (objError) {
      throw new Error(`Failed to fetch object types: ${objError.message}`);
    }

    console.log(`✓ Object types: ${objectTypes?.length || 0} types loaded`);
    if (objectTypes && objectTypes.length > 0) {
      console.log(`  Sample: ${objectTypes[0].name_vi}`);
    }

    // Test 4: Check admin units
    const { data: adminUnits, error: adminError } = await supabase
      .from('ref_admin_units')
      .select('*')
      .eq('level', 'PROVINCE');

    if (adminError) {
      throw new Error(`Failed to fetch admin units: ${adminError.message}`);
    }

    console.log(`✓ Admin units: ${adminUnits?.length || 0} provinces loaded`);
    if (adminUnits && adminUnits.length > 0) {
      console.log(`  Sample: ${adminUnits[0].name}`);
    }

    // Test 5: Check if profiles table exists
    const { error: profileError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (profileError) {
      console.log(`⚠ Profiles table: ${profileError.message}`);
    } else {
      console.log('✓ Profiles table exists');
    }

    // Test 6: Check survey tables
    const tables = [
      'survey_locations',
      'survey_media',
      'survey_vertices'
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table as any)
        .select('count')
        .limit(1);

      if (error) {
        console.log(`⚠ ${table}: ${error.message}`);
      } else {
        console.log(`✓ ${table} table exists`);
      }
    }

    // Test 7: Check storage bucket
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();

    if (bucketError) {
      console.log(`⚠ Storage buckets: ${bucketError.message}`);
    } else {
      const surveyBucket = buckets?.find(b => b.name === 'survey-photos');
      if (surveyBucket) {
        console.log('✓ Storage bucket "survey-photos" exists');
      } else {
        console.log('⚠ Storage bucket "survey-photos" not found');
      }
    }

    console.log('\n🎉 Connection test completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Create a test user in Supabase Authentication');
    console.log('2. Add a profile for that user');
    console.log('3. Try logging in with the mobile app');

  } catch (error) {
    console.error('\n❌ Connection test failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Check your .env file has correct EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
    console.log('2. Verify database schema is created (run supabase/schema.sql)');
    console.log('3. Verify seed data is inserted (run supabase/seed.sql)');
    process.exit(1);
  }
}

// Run the test
testConnection();
