# Vietnamese Administrative Units Import

This directory contains SQL seed data for importing the complete Vietnamese administrative hierarchy into the `ref_admin_units` table.

## Files

- **`seed-admin-units.sql`** - Complete SQL insert script (10,799 records)
- **`scripts/fetch-admin-full-v2.js`** - Node.js script to regenerate the SQL file
- **`scripts/admin-units-data.json`** - JSON export of all administrative units

## Data Summary

| Level | Vietnamese | Count |
|-------|-----------|-------|
| PROVINCE | Tỉnh/Thành phố trung ương | 63 |
| DISTRICT | Quận/Huyện/Thị xã/Thành phố | 696 |
| WARD | Xã/Phường/Thị trấn | 10,040 |
| **Total** | | **10,799** |

## Data Source

Source: [kenzouno1/DiaGioiHanhChinhVN](https://github.com/kenzouno1/DiaGioiHanhChinhVN)

This is a well-maintained repository with complete Vietnamese administrative divisions based on official government data.

## Database Schema

The data populates the `ref_admin_units` table with this structure:

```sql
CREATE TABLE public.ref_admin_units (
  code TEXT PRIMARY KEY,              -- Administrative code
  name TEXT NOT NULL,                  -- Full Vietnamese name
  level TEXT NOT NULL,                 -- PROVINCE, DISTRICT, or WARD
  parent_code TEXT,                    -- Code of parent unit (NULL for provinces)
  full_name TEXT,                      -- Full name (same as name)
  short_name TEXT                      -- URL-friendly slug
);
```

## Hierarchy Example

```
Thành phố Hà Nội (01)                    [PROVINCE]
├── Quận Ba Đình (001)                   [DISTRICT, parent_code: 01]
│   ├── Phường Phúc Xá (00001)          [WARD, parent_code: 001]
│   ├── Phường Trúc Bạch (00004)        [WARD, parent_code: 001]
│   └── ...
├── Quận Hoàn Kiếm (002)                [DISTRICT, parent_code: 01]
│   ├── Phường Phú Trường (00007)       [WARD, parent_code: 002]
│   └── ...
└── ...
```

## How to Import

### Option 1: Run in Supabase SQL Editor

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `seed-admin-units.sql`
5. Paste and click **Run**

The script will insert all 10,799 records into your database.

### Option 2: Use Supabase CLI

```bash
supabase db execute < supabase/seed-admin-units.sql
```

## Features

### ✅ Safe to Rerun

The script uses `INSERT ... ON CONFLICT (code) DO UPDATE SET ...` pattern, which means:

- **First run**: Inserts all records
- **Subsequent runs**: Updates existing records with new data
- **No duplicates**: Primary key constraint prevents duplicate codes

You can safely rerun this script multiple times without worrying about duplicate data.

### ✅ Maintains Referential Integrity

Records are inserted in hierarchical order:

1. **Provinces first** (parent_code = NULL)
2. **Districts second** (parent_code references province)
3. **Wards last** (parent_code references district)

This ensures foreign key relationships are valid if you add constraints.

## Regenerating the Data

If you need to regenerate the SQL file (e.g., to get updated data):

```bash
cd scripts
node fetch-admin-full-v2.js
```

This will:
1. Fetch fresh data from GitHub
2. Transform it to match your schema
3. Generate new `seed-admin-units.sql`
4. Save JSON export to `scripts/admin-units-data.json`

## Querying the Data

### Get all provinces
```sql
SELECT * FROM ref_admin_units WHERE level = 'PROVINCE' ORDER BY code;
```

### Get districts in a province
```sql
SELECT * FROM ref_admin_units
WHERE level = 'DISTRICT' AND parent_code = '01'  -- Hà Nội
ORDER BY code;
```

### Get wards in a district
```sql
SELECT * FROM ref_admin_units
WHERE level = 'WARD' AND parent_code = '001'  -- Ba Đình, Hà Nội
ORDER BY code;
```

### Get full hierarchy for Hà Nội
```sql
WITH RECURSIVE hierarchy AS (
  -- Start with Hà Nội province
  SELECT code, name, level, parent_code, 0 as depth
  FROM ref_admin_units
  WHERE code = '01'

  UNION ALL

  -- Recursively get children
  SELECT r.code, r.name, r.level, r.parent_code, h.depth + 1
  FROM ref_admin_units r
  INNER JOIN hierarchy h ON r.parent_code = h.code
)
SELECT * FROM hierarchy ORDER BY depth, code;
```

## Data Validation

After import, verify the counts:

```sql
SELECT
  level,
  COUNT(*) as count
FROM ref_admin_units
GROUP BY level
ORDER BY
  CASE level
    WHEN 'PROVINCE' THEN 1
    WHEN 'DISTRICT' THEN 2
    WHEN 'WARD' THEN 3
  END;
```

Expected output:
```
 level    | count
----------+-------
 PROVINCE |    63
 DISTRICT |   696
 WARD     | 10040
```

## Integration with Your App

In your LocationID Tracker app, profiles reference these codes:

```sql
-- Profile references admin units
SELECT
  p.full_name as officer_name,
  ward.name as ward,
  district.name as district,
  province.name as province
FROM profiles p
LEFT JOIN ref_admin_units ward ON ward.code = p.ward_code
LEFT JOIN ref_admin_units district ON district.code = p.district_code
LEFT JOIN ref_admin_units province ON province.code = p.province_code
WHERE p.id = auth.uid();
```

## Notes

- **Code format**: Codes are stored as TEXT (not integers) to preserve leading zeros
  - Province: `'01'`, `'02'`, etc.
  - District: `'001'`, `'002'`, etc.
  - Ward: `'00001'`, `'00002'`, etc.

- **Short names**: Generated slugs are URL-friendly and accent-free
  - `'Thành phố Hà Nội'` → `'thanh_pho_ha_noi'`
  - Useful for URLs, file names, or searches

- **RLS**: The table has Row Level Security enabled with a policy allowing all authenticated users to read (see `schema.sql:315-318`)

## Troubleshooting

### Error: duplicate key value violates unique constraint

This means the table already has data. The script handles this automatically with `ON CONFLICT`, so just rerun it.

### Error: relation "ref_admin_units" does not exist

Run `schema.sql` first to create the table structure.

### Wrong character encoding

Ensure your database uses UTF-8 encoding:
```sql
SHOW server_encoding;  -- Should return UTF8
```

## License

Data sourced from [kenzouno1/DiaGioiHanhChinhVN](https://github.com/kenzouno1/DiaGioiHanhChinhVN), based on official Vietnamese government administrative divisions.
