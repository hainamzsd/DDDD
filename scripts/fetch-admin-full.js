/**
 * Fetch Full Vietnamese Administrative Units (Provinces -> Districts -> Wards)
 * Uses provinces.open-api.vn API v2
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

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
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Escape SQL strings
 */
function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🔄 Fetching provinces...');
    const provinces = await fetchData('https://provinces.open-api.vn/api/v2/');
    console.log(`✅ Got ${provinces.length} provinces`);

    console.log('\n🔄 Fetching all wards/communes...');
    const allWards = await fetchData('https://provinces.open-api.vn/api/v2/w/');
    console.log(`✅ Got ${allWards.length} wards/communes`);

    console.log('\n🔄 Fetching all districts...');
    const allDistricts = await fetchData('https://provinces.open-api.vn/api/v2/d/');
    console.log(`✅ Got ${allDistricts.length} districts`);

    console.log('\n🔄 Transforming data...');

    const rows = [];

    // Add provinces
    provinces.forEach(p => {
      rows.push({
        code: String(p.code),
        name: p.name,
        level: 'PROVINCE',
        parent_code: null,
        full_name: p.name,
        short_name: p.codename
      });
    });

    // Add districts
    if (allDistricts && Array.isArray(allDistricts)) {
      allDistricts.forEach(d => {
        rows.push({
          code: String(d.code),
          name: d.name,
          level: 'DISTRICT',
          parent_code: String(d.province_code),
          full_name: d.name,
          short_name: d.codename
        });
      });
    }

    // Add wards
    if (allWards && Array.isArray(allWards)) {
      allWards.forEach(w => {
        rows.push({
          code: String(w.code),
          name: w.name,
          level: 'WARD',
          parent_code: String(w.district_code),
          full_name: w.name,
          short_name: w.codename
        });
      });
    }

    console.log(`✅ Transformed ${rows.length} total records`);

    console.log('\n🔄 Generating SQL...');

    // Generate SQL
    const header = `-- ============================================================================
-- Vietnamese Administrative Units Seed Data
-- ============================================================================
-- Generated: ${new Date().toISOString()}
-- Source: provinces.open-api.vn/api/v2/
-- Total records: ${rows.length}
-- - Provinces: ${provinces.length}
-- - Districts: ${allDistricts.length}
-- - Wards/Communes: ${allWards.length}
-- ============================================================================
--
-- This file populates the ref_admin_units table with the complete Vietnamese
-- administrative hierarchy.
--
-- RERUNNABLE: Uses INSERT ... ON CONFLICT to safely update or insert.
-- ============================================================================

`;

    const inserts = [];

    // Generate province inserts
    inserts.push('-- ============================================================================');
    inserts.push(`-- PROVINCES (${provinces.length} records)`);
    inserts.push('-- ============================================================================\n');

    rows.filter(r => r.level === 'PROVINCE').forEach(row => {
      inserts.push(
        `INSERT INTO public.ref_admin_units (code, name, level, parent_code, full_name, short_name)` +
        `\nVALUES ('${escapeSql(row.code)}', '${escapeSql(row.name)}', '${row.level}', NULL, '${escapeSql(row.full_name)}', '${escapeSql(row.short_name)}')` +
        `\nON CONFLICT (code) DO UPDATE SET` +
        `\n  name = EXCLUDED.name,` +
        `\n  level = EXCLUDED.level,` +
        `\n  parent_code = EXCLUDED.parent_code,` +
        `\n  full_name = EXCLUDED.full_name,` +
        `\n  short_name = EXCLUDED.short_name;\n`
      );
    });

    // Generate district inserts
    inserts.push('\n-- ============================================================================');
    inserts.push(`-- DISTRICTS (${allDistricts.length} records)`);
    inserts.push('-- ============================================================================\n');

    rows.filter(r => r.level === 'DISTRICT').forEach(row => {
      inserts.push(
        `INSERT INTO public.ref_admin_units (code, name, level, parent_code, full_name, short_name)` +
        `\nVALUES ('${escapeSql(row.code)}', '${escapeSql(row.name)}', '${row.level}', '${escapeSql(row.parent_code)}', '${escapeSql(row.full_name)}', '${escapeSql(row.short_name)}')` +
        `\nON CONFLICT (code) DO UPDATE SET` +
        `\n  name = EXCLUDED.name,` +
        `\n  level = EXCLUDED.level,` +
        `\n  parent_code = EXCLUDED.parent_code,` +
        `\n  full_name = EXCLUDED.full_name,` +
        `\n  short_name = EXCLUDED.short_name;\n`
      );
    });

    // Generate ward inserts
    inserts.push('\n-- ============================================================================');
    inserts.push(`-- WARDS/COMMUNES (${allWards.length} records)`);
    inserts.push('-- ============================================================================\n');

    rows.filter(r => r.level === 'WARD').forEach(row => {
      inserts.push(
        `INSERT INTO public.ref_admin_units (code, name, level, parent_code, full_name, short_name)` +
        `\nVALUES ('${escapeSql(row.code)}', '${escapeSql(row.name)}', '${row.level}', '${escapeSql(row.parent_code)}', '${escapeSql(row.full_name)}', '${escapeSql(row.short_name)}')` +
        `\nON CONFLICT (code) DO UPDATE SET` +
        `\n  name = EXCLUDED.name,` +
        `\n  level = EXCLUDED.level,` +
        `\n  parent_code = EXCLUDED.parent_code,` +
        `\n  full_name = EXCLUDED.full_name,` +
        `\n  short_name = EXCLUDED.short_name;\n`
      );
    });

    const footer = `\n-- ============================================================================
-- COMPLETION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Vietnamese administrative units imported successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - Provinces: ${provinces.length}';
  RAISE NOTICE '  - Districts: ${allDistricts.length}';
  RAISE NOTICE '  - Wards/Communes: ${allWards.length}';
  RAISE NOTICE '  - Total: ${rows.length}';
  RAISE NOTICE '';
END $$;
`;

    const sql = header + inserts.join('\n') + footer;

    // Write SQL file
    const outputPath = path.join(__dirname, '..', 'supabase', 'seed-admin-units.sql');
    fs.writeFileSync(outputPath, sql, 'utf8');
    console.log(`✅ SQL file generated: ${outputPath}`);

    console.log('\n📊 Summary:');
    console.log(`   Provinces: ${provinces.length}`);
    console.log(`   Districts: ${allDistricts.length}`);
    console.log(`   Wards/Communes: ${allWards.length}`);
    console.log(`   Total: ${rows.length}`);
    console.log('\n✅ Done! Run this SQL file in your Supabase SQL Editor.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
