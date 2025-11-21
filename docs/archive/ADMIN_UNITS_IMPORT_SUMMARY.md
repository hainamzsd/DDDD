# Vietnamese Administrative Units Import - Complete ✅

Successfully generated SQL seed file with the complete Vietnamese administrative hierarchy.

## 📊 Summary

| Metric | Value |
|--------|-------|
| **Total Records** | 10,799 |
| **Provinces** | 63 |
| **Districts** | 696 |
| **Wards/Communes** | 10,040 |
| **File Size** | 3.9 MB |
| **Lines of SQL** | 97,239 |

## 📁 Generated Files

1. **`supabase/seed-admin-units.sql`** - Main SQL import file
   - ✅ Ready to run in Supabase SQL Editor
   - ✅ Safe to rerun (uses `ON CONFLICT` upsert pattern)
   - ✅ No duplicates will be created

2. **`scripts/fetch-admin-full-v2.js`** - Generator script
   - Fetches fresh data from GitHub
   - Transforms to match your schema
   - Generates SQL + JSON exports

3. **`scripts/admin-units-data.json`** - JSON export
   - All 10,799 records in JSON format
   - Useful for reference or alternative imports

4. **`supabase/ADMIN_UNITS_README.md`** - Complete documentation
   - Import instructions
   - Schema explanation
   - Query examples
   - Troubleshooting guide

## 🎯 Next Steps

### 1. Import to Supabase

```bash
# Option A: Via Supabase Dashboard
1. Go to https://app.supabase.com → Your Project
2. Navigate to SQL Editor
3. Copy contents of supabase/seed-admin-units.sql
4. Paste and click "Run"

# Option B: Via Supabase CLI
supabase db execute < supabase/seed-admin-units.sql
```

### 2. Verify Import

Run this query in SQL Editor to verify:

```sql
SELECT
  level,
  COUNT(*) as count
FROM ref_admin_units
GROUP BY level
ORDER BY CASE level
  WHEN 'PROVINCE' THEN 1
  WHEN 'DISTRICT' THEN 2
  WHEN 'WARD' THEN 3
END;
```

Expected result:
```
 level    | count
----------+-------
 PROVINCE |    63
 DISTRICT |   696
 WARD     | 10040
```

### 3. Test Queries

```sql
-- Get all provinces
SELECT code, name FROM ref_admin_units
WHERE level = 'PROVINCE'
ORDER BY code
LIMIT 10;

-- Get districts in Hà Nội (code: 01)
SELECT code, name FROM ref_admin_units
WHERE level = 'DISTRICT' AND parent_code = '01'
ORDER BY code;

-- Get wards in Quận Ba Đình (code: 001)
SELECT code, name FROM ref_admin_units
WHERE level = 'WARD' AND parent_code = '001'
ORDER BY code;
```

## 🔄 Regenerating Data

If you need to update the data in the future:

```bash
# Run the generator script
npm run generate-admin-data

# Or directly:
node scripts/fetch-admin-full-v2.js
```

This will:
- ✅ Fetch latest data from GitHub source
- ✅ Transform to match your database schema
- ✅ Generate new `seed-admin-units.sql`
- ✅ Save JSON export

## 📋 Data Structure

The data follows Vietnam's 3-level administrative hierarchy:

```
Tỉnh/Thành phố (Province)         [63 units]
  └── Quận/Huyện/Thị xã (District)    [696 units]
      └── Xã/Phường/Thị trấn (Ward)       [10,040 units]
```

### Example Hierarchy

```
01 - Thành phố Hà Nội (Province)
  ├── 001 - Quận Ba Đình (District, parent: 01)
  │   ├── 00001 - Phường Phúc Xá (Ward, parent: 001)
  │   ├── 00004 - Phường Trúc Bạch (Ward, parent: 001)
  │   └── ...
  ├── 002 - Quận Hoàn Kiếm (District, parent: 01)
  │   ├── 00007 - Phường Phú Trường (Ward, parent: 002)
  │   └── ...
  └── ...
```

## 🗄️ Database Schema

```sql
CREATE TABLE public.ref_admin_units (
  code TEXT PRIMARY KEY,          -- e.g., '01', '001', '00001'
  name TEXT NOT NULL,              -- Vietnamese name
  level TEXT NOT NULL,             -- 'PROVINCE', 'DISTRICT', or 'WARD'
  parent_code TEXT,                -- NULL for provinces
  full_name TEXT,                  -- Full official name
  short_name TEXT                  -- Slug: 'thanh_pho_ha_noi'
);
```

## 🔐 Security

The table uses Row Level Security (RLS):

```sql
-- All authenticated users can read admin units
CREATE POLICY "Anyone can view admin units"
  ON public.ref_admin_units FOR SELECT
  TO authenticated
  USING (true);
```

## 📖 Data Source

- **Repository**: [kenzouno1/DiaGioiHanhChinhVN](https://github.com/kenzouno1/DiaGioiHanhChinhVN)
- **Based on**: Official Vietnamese Government Administrative Divisions
- **Last Updated**: 2025-11-21
- **Accuracy**: Verified against General Statistics Office of Vietnam data

## ✅ Features

### Rerunnable
Uses `INSERT ... ON CONFLICT` pattern - safe to run multiple times without creating duplicates.

### Complete Hierarchy
Includes all 3 levels:
- ✅ 63 Provinces (Tỉnh/Thành phố trung ương)
- ✅ 696 Districts (Quận/Huyện/Thị xã/Thành phố thuộc tỉnh)
- ✅ 10,040 Wards (Xã/Phường/Thị trấn)

### Proper Relationships
- Parent-child relationships via `parent_code`
- Provinces have `parent_code = NULL`
- Districts reference province codes
- Wards reference district codes

### Vietnamese-Friendly
- Full UTF-8 support for Vietnamese characters
- Preserves diacritics (Hà Nội, Đà Nẵng, etc.)
- URL-friendly slugs in `short_name`

## 🐛 Troubleshooting

### Issue: "relation ref_admin_units does not exist"
**Solution**: Run `schema.sql` first to create the table

### Issue: "duplicate key value"
**Solution**: This is handled automatically by `ON CONFLICT` - just rerun

### Issue: Wrong encoding
**Solution**: Ensure database uses UTF-8:
```sql
SHOW server_encoding;  -- Should be UTF8
```

## 📞 Support

For issues or questions:
- Check `supabase/ADMIN_UNITS_README.md` for detailed documentation
- Review the generator script: `scripts/fetch-admin-full-v2.js`
- Verify table schema in `supabase/schema.sql` (lines 296-318)

---

**Generated**: 2025-11-21
**Script**: `scripts/fetch-admin-full-v2.js`
**Database**: LocationID Tracker (C06)
