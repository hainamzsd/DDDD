/**
 * Fetch Full Vietnamese Administrative Units (Provinces -> Districts -> Wards)
 * Uses kenzouno1/DiaGioiHanhChinhVN GitHub data source
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
 * Escape SQL strings
 */
function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

/**
 * Create a URL-friendly slug
 */
function createSlug(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🔄 Fetching Vietnamese administrative data...');
    console.log('📡 Source: https://github.com/kenzouno1/DiaGioiHanhChinhVN');

    const data = await fetchData('https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json');
    console.log(`✅ Fetched ${data.length} provinces`);

    console.log('\n🔄 Transforming data...');

    const rows = [];
    let provincesCount = 0;
    let districtsCount = 0;
    let wardsCount = 0;

    data.forEach(province => {
      // Add province
      rows.push({
        code: String(province.Id),
        name: province.Name,
        level: 'PROVINCE',
        parent_code: null,
        full_name: province.Name,
        short_name: createSlug(province.Name)
      });
      provincesCount++;

      // Add districts
      if (province.Districts && Array.isArray(province.Districts)) {
        province.Districts.forEach(district => {
          rows.push({
            code: String(district.Id),
            name: district.Name,
            level: 'DISTRICT',
            parent_code: String(province.Id),
            full_name: district.Name,
            short_name: createSlug(district.Name)
          });
          districtsCount++;

          // Add wards
          if (district.Wards && Array.isArray(district.Wards)) {
            district.Wards.forEach(ward => {
              rows.push({
                code: String(ward.Id),
                name: ward.Name,
                level: 'WARD',
                parent_code: String(district.Id),
                full_name: ward.Name,
                short_name: createSlug(ward.Name)
              });
              wardsCount++;
            });
          }
        });
      }
    });

    console.log(`✅ Transformed ${rows.length} total records`);
    console.log(`   - Provinces: ${provincesCount}`);
    console.log(`   - Districts: ${districtsCount}`);
    console.log(`   - Wards/Communes: ${wardsCount}`);

    console.log('\n🔄 Generating SQL...');

    // Generate SQL
    const header = `-- ============================================================================
-- Vietnamese Administrative Units Seed Data
-- ============================================================================
-- Generated: ${new Date().toISOString()}
-- Source: https://github.com/kenzouno1/DiaGioiHanhChinhVN
-- Total records: ${rows.length}
-- - Provinces: ${provincesCount}
-- - Districts: ${districtsCount}
-- - Wards/Communes: ${wardsCount}
-- ============================================================================
--
-- This file populates the ref_admin_units table with the complete Vietnamese
-- administrative hierarchy: Tỉnh/Thành phố → Quận/Huyện → Xã/Phường/Thị trấn
--
-- RERUNNABLE: Uses INSERT ... ON CONFLICT to safely update or insert.
-- Safe to run multiple times without creating duplicates.
-- ============================================================================

`;

    const inserts = [];

    // Generate province inserts
    inserts.push('-- ============================================================================');
    inserts.push(`-- PROVINCES (Tỉnh/Thành phố) - ${provincesCount} records`);
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
    inserts.push(`-- DISTRICTS (Quận/Huyện) - ${districtsCount} records`);
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
    inserts.push(`-- WARDS/COMMUNES (Xã/Phường/Thị trấn) - ${wardsCount} records`);
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
  RAISE NOTICE '  - Provinces (Tỉnh/Thành phố): ${provincesCount}';
  RAISE NOTICE '  - Districts (Quận/Huyện): ${districtsCount}';
  RAISE NOTICE '  - Wards/Communes (Xã/Phường/Thị trấn): ${wardsCount}';
  RAISE NOTICE '  - Total: ${rows.length}';
  RAISE NOTICE '';
  RAISE NOTICE '📁 Table: public.ref_admin_units';
  RAISE NOTICE '';
END $$;
`;

    const sql = header + inserts.join('\n') + footer;

    // Write SQL file
    const outputPath = path.join(__dirname, '..', 'supabase', 'seed-admin-units.sql');
    fs.writeFileSync(outputPath, sql, 'utf8');
    console.log(`✅ SQL file generated: ${outputPath}`);

    // Also save JSON for reference
    const jsonPath = path.join(__dirname, 'admin-units-data.json');
    fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2), 'utf8');
    console.log(`✅ JSON data saved: ${jsonPath}`);

    console.log('\n📊 Summary:');
    console.log(`   Provinces: ${provincesCount}`);
    console.log(`   Districts: ${districtsCount}`);
    console.log(`   Wards/Communes: ${wardsCount}`);
    console.log(`   Total: ${rows.length}`);
    console.log('\n✅ Done! Upload seed-admin-units.sql to your Supabase SQL Editor.');
    console.log('📝 The file uses INSERT ... ON CONFLICT so it\'s safe to rerun.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
