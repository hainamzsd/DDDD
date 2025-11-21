/**
 * Fetch Vietnamese Administrative Units from API and Generate SQL Insert File
 *
 * This script:
 * 1. Fetches province/district/ward data from provinces.open-api.vn
 * 2. Transforms it to match our ref_admin_units schema
 * 3. Generates a rerunnable SQL seed file with duplicate prevention
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const PROVINCES_API_URL = 'https://provinces.open-api.vn/api/v2/';
const PROVINCE_DETAIL_API_URL = 'https://provinces.open-api.vn/api/v2/p/';

/**
 * Fetch JSON data from URL
 */
function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Sleep helper for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Escape single quotes for SQL
 */
function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

/**
 * Transform API data to our database structure
 */
function transformData(provinces) {
  const rows = [];

  provinces.forEach(province => {
    // Insert province (level = PROVINCE)
    rows.push({
      code: String(province.code),
      name: province.name,
      level: 'PROVINCE',
      parent_code: null,
      full_name: province.name,
      short_name: province.codename
    });

    // Insert districts (nested in "districts" array)
    if (province.districts && Array.isArray(province.districts)) {
      province.districts.forEach(district => {
        rows.push({
          code: String(district.code),
          name: district.name,
          level: 'DISTRICT',
          parent_code: String(province.code),
          full_name: district.name,
          short_name: district.codename
        });

        // Insert wards (nested in district's "wards" array)
        if (district.wards && Array.isArray(district.wards)) {
          district.wards.forEach(ward => {
            rows.push({
              code: String(ward.code),
              name: ward.name,
              level: 'WARD',
              parent_code: String(district.code),
              full_name: ward.name,
              short_name: ward.codename
            });
          });
        }
      });
    }
  });

  return rows;
}

/**
 * Generate SQL insert statements
 */
function generateSQL(rows) {
  const header = `-- ============================================================================
-- Vietnamese Administrative Units Seed Data
-- ============================================================================
-- Generated: ${new Date().toISOString()}
-- Source: provinces.open-api.vn/api/v2/?depth=2
-- Total records: ${rows.length}
-- ============================================================================
--
-- This file populates the ref_admin_units table with the complete Vietnamese
-- administrative hierarchy: provinces (tỉnh), districts (huyện/quận), and
-- wards (xã/phường/thị trấn).
--
-- IMPORTANT: This script is RERUNNABLE - it uses INSERT ... ON CONFLICT to
-- safely update existing records or insert new ones.
-- ============================================================================

-- Delete existing admin units to ensure clean data
-- (Commented out by default - uncomment if you want to clear existing data)
-- DELETE FROM public.ref_admin_units;

`;

  const inserts = [];

  // Group by level for better organization
  const provinces = rows.filter(r => r.level === 'PROVINCE');
  const districts = rows.filter(r => r.level === 'DISTRICT');
  const wards = rows.filter(r => r.level === 'WARD');

  // Generate provinces
  inserts.push('-- ============================================================================');
  inserts.push(`-- PROVINCES (${provinces.length} records)`);
  inserts.push('-- ============================================================================');
  inserts.push('');

  provinces.forEach(row => {
    inserts.push(
      `INSERT INTO public.ref_admin_units (code, name, level, parent_code, full_name, short_name)` +
      `\nVALUES ('${escapeSql(row.code)}', '${escapeSql(row.name)}', '${row.level}', NULL, '${escapeSql(row.full_name)}', '${escapeSql(row.short_name)}')` +
      `\nON CONFLICT (code) DO UPDATE SET` +
      `\n  name = EXCLUDED.name,` +
      `\n  level = EXCLUDED.level,` +
      `\n  parent_code = EXCLUDED.parent_code,` +
      `\n  full_name = EXCLUDED.full_name,` +
      `\n  short_name = EXCLUDED.short_name;`
    );
    inserts.push('');
  });

  // Generate districts
  inserts.push('-- ============================================================================');
  inserts.push(`-- DISTRICTS (${districts.length} records)`);
  inserts.push('-- ============================================================================');
  inserts.push('');

  districts.forEach(row => {
    inserts.push(
      `INSERT INTO public.ref_admin_units (code, name, level, parent_code, full_name, short_name)` +
      `\nVALUES ('${escapeSql(row.code)}', '${escapeSql(row.name)}', '${row.level}', '${escapeSql(row.parent_code)}', '${escapeSql(row.full_name)}', '${escapeSql(row.short_name)}')` +
      `\nON CONFLICT (code) DO UPDATE SET` +
      `\n  name = EXCLUDED.name,` +
      `\n  level = EXCLUDED.level,` +
      `\n  parent_code = EXCLUDED.parent_code,` +
      `\n  full_name = EXCLUDED.full_name,` +
      `\n  short_name = EXCLUDED.short_name;`
    );
    inserts.push('');
  });

  // Generate wards
  inserts.push('-- ============================================================================');
  inserts.push(`-- WARDS/COMMUNES (${wards.length} records)`);
  inserts.push('-- ============================================================================');
  inserts.push('');

  wards.forEach(row => {
    inserts.push(
      `INSERT INTO public.ref_admin_units (code, name, level, parent_code, full_name, short_name)` +
      `\nVALUES ('${escapeSql(row.code)}', '${escapeSql(row.name)}', '${row.level}', '${escapeSql(row.parent_code)}', '${escapeSql(row.full_name)}', '${escapeSql(row.short_name)}')` +
      `\nON CONFLICT (code) DO UPDATE SET` +
      `\n  name = EXCLUDED.name,` +
      `\n  level = EXCLUDED.level,` +
      `\n  parent_code = EXCLUDED.parent_code,` +
      `\n  full_name = EXCLUDED.full_name,` +
      `\n  short_name = EXCLUDED.short_name;`
    );
    inserts.push('');
  });

  const footer = `-- ============================================================================
-- COMPLETION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Vietnamese administrative units imported successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - Provinces: ${provinces.length}';
  RAISE NOTICE '  - Districts: ${districts.length}';
  RAISE NOTICE '  - Wards/Communes: ${wards.length}';
  RAISE NOTICE '  - Total: ${rows.length}';
  RAISE NOTICE '';
END $$;
`;

  return header + inserts.join('\n') + '\n' + footer;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🔄 Step 1: Fetching list of provinces...');
    console.log(`📡 URL: ${PROVINCES_API_URL}`);

    const provincesList = await fetchData(PROVINCES_API_URL);
    console.log(`✅ Fetched ${provincesList.length} provinces`);

    console.log('\n🔄 Step 2: Fetching detailed data for each province (with districts and wards)...');
    console.log('⏱️  This may take a few minutes...');

    const provincesWithDetails = [];
    for (let i = 0; i < provincesList.length; i++) {
      const province = provincesList[i];
      try {
        const detailUrl = `${PROVINCE_DETAIL_API_URL}${province.code}?depth=2`;
        const detailedProvince = await fetchData(detailUrl);
        provincesWithDetails.push(detailedProvince);

        // Show progress
        const progress = Math.floor((i + 1) / provincesList.length * 100);
        process.stdout.write(`\r   Progress: ${i + 1}/${provincesList.length} (${progress}%) - ${province.name}`);

        // Rate limiting - wait 100ms between requests
        if (i < provincesList.length - 1) {
          await sleep(100);
        }
      } catch (error) {
        console.error(`\n⚠️  Error fetching ${province.name}:`, error.message);
      }
    }
    console.log('\n✅ Fetched detailed data for all provinces');

    console.log('\n🔄 Step 3: Transforming data...');
    const rows = transformData(provincesWithDetails);
    console.log(`✅ Transformed ${rows.length} total records`);

    console.log('\n🔄 Step 4: Generating SQL...');
    const sql = generateSQL(rows);

    // Write to file
    const outputPath = path.join(__dirname, '..', 'supabase', 'seed-admin-units.sql');
    fs.writeFileSync(outputPath, sql, 'utf8');
    console.log(`✅ SQL file generated: ${outputPath}`);

    // Generate summary
    const provinces_count = rows.filter(r => r.level === 'PROVINCE').length;
    const districts_count = rows.filter(r => r.level === 'DISTRICT').length;
    const wards_count = rows.filter(r => r.level === 'WARD').length;

    console.log('\n📊 Summary:');
    console.log(`   Provinces: ${provinces_count}`);
    console.log(`   Districts: ${districts_count}`);
    console.log(`   Wards/Communes: ${wards_count}`);
    console.log(`   Total: ${rows.length}`);
    console.log('\n✅ Done! Run this SQL file in your Supabase SQL Editor.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
