# Quick Start: Import Vietnamese Administrative Units

Import all 10,799 Vietnamese administrative units (provinces, districts, wards) into your Supabase database in 3 simple steps.

## ⚡ Quick Steps

### Step 1: Ensure Table Exists

Make sure you've run `supabase/schema.sql` first. Verify with:

```sql
SELECT * FROM ref_admin_units LIMIT 1;
```

If table doesn't exist, run `schema.sql` in Supabase SQL Editor.

### Step 2: Run the Import

**Via Supabase Dashboard:**

1. Open https://app.supabase.com → Your Project
2. Go to **SQL Editor**
3. Click **New Query**
4. Open `supabase/seed-admin-units.sql` in a text editor
5. Copy all contents (97,239 lines)
6. Paste into Supabase SQL Editor
7. Click **Run** (⌘Enter or Ctrl+Enter)
8. Wait ~30 seconds for completion

**Via Supabase CLI:**

```bash
supabase db execute < supabase/seed-admin-units.sql
```

### Step 3: Verify

Run this in SQL Editor:

```sql
SELECT level, COUNT(*) as count
FROM ref_admin_units
GROUP BY level
ORDER BY CASE level
  WHEN 'PROVINCE' THEN 1
  WHEN 'DISTRICT' THEN 2
  WHEN 'WARD' THEN 3
END;
```

**Expected Output:**
```
 level    | count
----------+-------
 PROVINCE |    63
 DISTRICT |   696
 WARD     | 10040
```

✅ If you see these numbers, import was successful!

## 🎯 What Gets Imported

| Level | Vietnamese | Examples | Count |
|-------|-----------|----------|-------|
| PROVINCE | Tỉnh/Thành phố | Hà Nội, TP.HCM, Đà Nẵng | 63 |
| DISTRICT | Quận/Huyện | Ba Đình, Hoàn Kiếm, Quận 1 | 696 |
| WARD | Xã/Phường | Phường Phúc Xá, Xã Đông Anh | 10,040 |

## 🔍 Test Queries

```sql
-- List all provinces
SELECT code, name FROM ref_admin_units
WHERE level = 'PROVINCE'
ORDER BY name;

-- Get Hà Nội districts
SELECT code, name FROM ref_admin_units
WHERE level = 'DISTRICT' AND parent_code = '01'
ORDER BY name;

-- Get wards in Ba Đình district
SELECT code, name FROM ref_admin_units
WHERE level = 'WARD' AND parent_code = '001'
ORDER BY name;

-- Full path for a ward
WITH ward_info AS (
  SELECT * FROM ref_admin_units WHERE code = '00001'
),
district_info AS (
  SELECT * FROM ref_admin_units WHERE code = (SELECT parent_code FROM ward_info)
),
province_info AS (
  SELECT * FROM ref_admin_units WHERE code = (SELECT parent_code FROM district_info)
)
SELECT
  p.name as province,
  d.name as district,
  w.name as ward
FROM ward_info w
CROSS JOIN district_info d
CROSS JOIN province_info p;
```

## ⚠️ Important Notes

### ✅ Safe to Rerun
The import uses `ON CONFLICT` pattern. You can run it multiple times:
- **First run**: Inserts all records
- **Subsequent runs**: Updates existing data
- **No duplicates**: Guaranteed

### 📊 File Size
- **Size**: 3.9 MB
- **Lines**: 97,239
- **Records**: 10,799
- **Import time**: ~30-60 seconds

### 🔄 Regenerating Data

If you need fresh data in the future:

```bash
npm run generate-admin-data
```

This regenerates `seed-admin-units.sql` from the latest source.

## 🐛 Troubleshooting

### Error: "relation ref_admin_units does not exist"
➡️ Run `schema.sql` first to create the table

### Import seems stuck
➡️ Normal for large imports. Wait 1-2 minutes. Check Supabase logs.

### Wrong data count
➡️ Run the verification query above. If counts don't match, clear and reimport:

```sql
DELETE FROM ref_admin_units;  -- Clear existing data
-- Then rerun seed-admin-units.sql
```

### Encoding issues (weird characters)
➡️ Verify UTF-8 encoding:
```sql
SHOW server_encoding;  -- Should return 'UTF8'
```

## 📚 More Information

- **Full Documentation**: `supabase/ADMIN_UNITS_README.md`
- **Import Summary**: `ADMIN_UNITS_IMPORT_SUMMARY.md`
- **Generator Script**: `scripts/fetch-admin-full-v2.js`
- **Database Schema**: `supabase/schema.sql` (lines 296-318)

## 💡 Usage in Your App

Once imported, use in TypeScript/JavaScript:

```typescript
// Get provinces for dropdown
const { data: provinces } = await supabase
  .from('ref_admin_units')
  .select('code, name')
  .eq('level', 'PROVINCE')
  .order('name');

// Get districts for selected province
const { data: districts } = await supabase
  .from('ref_admin_units')
  .select('code, name')
  .eq('level', 'DISTRICT')
  .eq('parent_code', selectedProvinceCode)
  .order('name');

// Get wards for selected district
const { data: wards } = await supabase
  .from('ref_admin_units')
  .select('code, name')
  .eq('level', 'WARD')
  .eq('parent_code', selectedDistrictCode)
  .order('name');
```

---

**Ready to import?** Open `supabase/seed-admin-units.sql` in Supabase SQL Editor and hit Run!
