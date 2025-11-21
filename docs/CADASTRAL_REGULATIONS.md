# Vietnamese Cadastral Categories and Regulatory Compliance

## Overview

This document identifies all required cadastral categories, codes, and compliance requirements for the LocationID Tracker (C06) app per current Vietnamese land law and cadastral regulations.

**Primary Legal Framework:**
- **Land Law 2013** (Luật Đất đai 2013) - Law No. 45/2013/QH13
- **Decree 43/2014/NĐ-CP** - Detailing land law implementation
- **Circular 02/2015/TT-BTNMT** - Cadastral survey and mapping technical regulations
- **Circular 23/2014/TT-BTNMT** - Land statistics and inventory
- **Decree 01/2017/NĐ-CP** - Amendments to land regulations

**Last Updated:** January 2025 (reflecting regulations current as of Sonnet 4.5 knowledge cutoff)

---

## 1. Land Use Categories (Loại đất)

### 1.1 Primary Classification

Vietnamese land law defines **3 primary land groups** (Nhóm đất):

1. **Agricultural Land** (Đất nông nghiệp - NNG)
2. **Non-Agricultural Land** (Đất phi nông nghiệp - PNN)
3. **Unused Land** (Đất chưa sử dụng - CSD)

### 1.2 Detailed Land Use Types

#### Group 1: Agricultural Land (NNG)

| Code | Vietnamese Name | English Name | Notes |
|------|-----------------|--------------|-------|
| NNG.LUA | Đất trồng lúa | Paddy land | Protected, conversion restricted |
| NNG.CKH | Đất trồng cây hàng năm khác | Annual crop land (non-rice) | Vegetables, crops |
| NNG.CLN | Đất trồng cây lâu năm | Perennial crop land | Coffee, rubber, fruit trees |
| NNG.RSD | Đất rừng sản xuất | Production forest land | Timber, non-timber |
| NNG.RPH | Đất rừng phòng hộ | Protection forest land | Watershed, coastal |
| NNG.RDB | Đất rừng đặc biệt | Special-use forest land | National parks, reserves |
| NNG.NTS | Đất nuôi trồng thủy sản | Aquaculture land | Shrimp, fish farming |
| NNG.MLN | Đất làm muối | Salt production land | Coastal salt flats |
| NNG.NKH | Đất nông nghiệp khác | Other agricultural land | Drying yards, farm roads |

#### Group 2: Non-Agricultural Land (PNN)

**2.1 Residential Land (Đất ở - DO)**

| Code | Vietnamese Name | English Name | Notes |
|------|-----------------|--------------|-------|
| PNN.DO.TT | Đất ở tại đô thị | Urban residential land | Cities, towns |
| PNN.DO.NT | Đất ở tại nông thôn | Rural residential land | Villages, communes |
| PNN.DO.NHA | Đất xây dựng trụ sở cơ quan | Land for office buildings | Government offices |
| PNN.DO.KCN | Đất xây dựng công trình sự nghiệp | Land for public service facilities | Schools, hospitals |

**2.2 Commercial & Production Land (Đất sản xuất, kinh doanh - SXKD)**

| Code | Vietnamese Name | English Name | Notes |
|------|-----------------|--------------|-------|
| PNN.SXKD.CN | Đất sản xuất, kinh doanh phi nông nghiệp | Land for non-agricultural production/business | Factories, workshops |
| PNN.SXKD.KCN | Đất khu công nghiệp | Industrial zone land | Registered industrial parks |
| PNN.SXKD.KCX | Đất khu chế xuất | Export processing zone land | EPZs |
| PNN.SXKD.CCN | Đất cụm công nghiệp | Industrial cluster land | Small-scale industrial areas |
| PNN.SXKD.TMCT | Đất thương mại, dịch vụ | Commercial and service land | Shops, markets, services |
| PNN.SXKD.SKS | Đất sử dụng cho hoạt động khoáng sản | Land for mineral extraction | Mining, quarrying |

**2.3 Public Purpose Land (Đất công cộng - CC)**

| Code | Vietnamese Name | English Name | Notes |
|------|-----------------|--------------|-------|
| PNN.CC.GT | Đất giao thông | Transportation land | Roads, railways, airports |
| PNN.CC.TL | Đất thủy lợi | Irrigation land | Canals, reservoirs |
| PNN.CC.DL | Đất có di tích lịch sử - văn hóa | Historical/cultural heritage land | Monuments, sites |
| PNN.CC.TDVH | Đất danh lam thắng cảnh | Scenic landscape land | Tourist attractions |
| PNN.CC.KVS | Đất sinh hoạt cộng đồng | Community activity land | Public squares, parks |
| PNN.CC.NTDT | Đất sử dụng vào mục đích công cộng khác | Other public purpose land | Cemeteries, landfills |
| PNN.CC.SDD | Đất sông, ngòi, kênh, rạch, suối | Rivers, streams, canals | Waterways |
| PNN.CC.MNC | Đất có mặt nước chuyên dùng | Dedicated water surface land | Reservoirs, lakes |

**2.4 Defense & Security Land (Đất quốc phòng, an ninh - QPAN)**

| Code | Vietnamese Name | English Name | Notes |
|------|-----------------|--------------|-------|
| PNN.QPAN | Đất quốc phòng | National defense land | Military bases |
| PNN.AN | Đất an ninh | Security land | Police, security facilities |

**2.5 Non-Business Land (Đất phi kinh doanh - PKD)**

| Code | Vietnamese Name | English Name | Notes |
|------|-----------------|--------------|-------|
| PNN.PKD.TN | Đất tôn giáo | Religious land | Temples, churches, mosques |
| PNN.PKD.TN.PHD | Đất tín ngưỡng | Belief practice land | Shrines, communal houses |
| PNN.PKD.NC | Đất nghĩa trang, nghĩa địa | Cemetery land | Burial grounds |

**2.6 Production & Business Land (Đất sản xuất kinh doanh - SXKD)**

| Code | Vietnamese Name | English Name | Notes |
|------|-----------------|--------------|-------|
| PNN.SXKD.NHA | Đất xây dựng công trình sản xuất | Land for production facilities | Manufacturing plants |

#### Group 3: Unused Land (CSD)

| Code | Vietnamese Name | English Name | Notes |
|------|-----------------|--------------|-------|
| CSD.DD | Đất đồi núi chưa sử dụng | Unused hill/mountain land | |
| CSD.KT | Đất khác chưa sử dụng | Other unused land | |

---

## 2. Administrative Unit Codes (Đơn vị hành chính)

### 2.1 Hierarchical Structure

Vietnam uses a **6-tier administrative division system**:

1. **Country** (Quốc gia) - Vietnam
2. **Province/City** (Tỉnh/Thành phố trực thuộc TW) - 63 units
3. **District/Town** (Quận/Huyện/Thị xã/Thành phố thuộc tỉnh)
4. **Commune/Ward** (Xã/Phường/Thị trấn)
5. **Village** (Thôn/Ấp/Bản/Xóm) - informal, not officially coded
6. **Hamlet** (Khu phố) - urban areas only

### 2.2 Official Coding System

**Standard Administrative Code Format:**
```
PP-DD-CC
```

Where:
- **PP** = Province code (2 digits, 01-96)
- **DD** = District code (2 digits within province)
- **CC** = Commune code (2 digits within district)

**Example:**
- `01-01-01` = Phường Phúc Xá, Quận Ba Đình, Hà Nội

### 2.3 Province Codes (Selected Examples)

| Code | Province/City | Vietnamese Name | Region |
|------|---------------|-----------------|--------|
| 01 | Hà Nội | Thành phố Hà Nội | Red River Delta |
| 79 | Hồ Chí Minh | Thành phố Hồ Chí Minh | Southeast |
| 48 | Đà Nẵng | Thành phố Đà Nẵng | North Central Coast |
| 92 | Cần Thơ | Thành phố Cần Thơ | Mekong Delta |
| 31 | Hải Phòng | Thành phố Hải Phòng | Red River Delta |

**Note:** Complete province list is maintained in `ref_admin_units` table and can be fetched from official sources via the API endpoint: `https://provinces.open-api.vn/api/`

### 2.4 Database Schema Requirements

The `ref_admin_units` table must include:

```sql
CREATE TABLE ref_admin_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level INTEGER NOT NULL, -- 1=Province, 2=District, 3=Commune
  code TEXT NOT NULL UNIQUE, -- Official government code
  name TEXT NOT NULL, -- Vietnamese name
  name_en TEXT, -- English name (optional)
  parent_code TEXT, -- References parent unit code
  full_path TEXT, -- Hierarchical path (e.g., "01/01-01/01-01-01")
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Location Identification Requirements

### 3.1 Unique Location Identifier (Mã định danh vị trí)

Per Circular 02/2015/TT-BTNMT, each surveyed location must have a unique identifier:

**Format:**
```
PP-DD-CC-NNNNNN
```

Where:
- **PP-DD-CC** = Administrative code (province-district-commune)
- **NNNNNN** = Sequential number within commune (6 digits, zero-padded)

**Example:**
- `01-01-01-000123` = Location #123 in Phường Phúc Xá, Ba Đình, Hà Nội

### 3.2 GPS Coordinate Requirements

**Spatial Reference System:**
- **Primary:** WGS84 (EPSG:4326) - GPS coordinates
- **National Grid:** VN-2000 (EPSG:3405) - for official cadastral maps

**Accuracy Standards:**
- **Urban areas:** ±0.5 meters
- **Rural areas:** ±1.0 meters
- **Remote/mountainous:** ±5.0 meters

**Data Collection:**
- Must record horizontal accuracy (meters)
- Must record timestamp of GPS fix
- Recommended: Multiple readings averaged
- Recommended: GPS constellation count (min 4 satellites)

### 3.3 Mandatory Survey Fields

Per regulations, the following fields are **mandatory** for all location surveys:

1. **Location Identifier** (Mã định danh)
2. **Administrative Unit** (Đơn vị hành chính - full path)
3. **Address** (Địa chỉ thửa đất)
   - House/building number
   - Street/road name
   - Hamlet/village name
   - Commune/ward name
   - District name
   - Province name
4. **Land Use Type** (Loại đất sử dụng - from official codes)
5. **GPS Coordinates** (Tọa độ GPS - lat/lon)
6. **Survey Date** (Ngày khảo sát)
7. **Surveyor ID** (Mã cán bộ khảo sát)
8. **Photos** (Ảnh hiện trạng - minimum 1 photo showing street frontage)

### 3.4 Optional Fields

1. **Land Plot Area** (Diện tích thửa đất - square meters)
2. **Building Area** (Diện tích xây dựng - square meters)
3. **Boundary Polygon** (Ranh giới thửa đất - polygon coordinates)
4. **Owner/Representative Information**
   - Full name
   - ID number (CCCD/CMND)
   - Phone number
   - Signature (digital capture)
5. **Land Use Certificate Number** (Số giấy chứng nhận quyền sử dụng đất)
6. **Notes** (Ghi chú)

---

## 4. Data Validation Rules

### 4.1 Location Identifier Validation

```typescript
// Format: PP-DD-CC-NNNNNN
const LOCATION_ID_REGEX = /^\d{2}-\d{2}-\d{2}-\d{6}$/;

function validateLocationId(id: string): boolean {
  if (!LOCATION_ID_REGEX.test(id)) return false;

  const [province, district, commune, sequence] = id.split('-');

  // Province code: 01-96
  if (parseInt(province) < 1 || parseInt(province) > 96) return false;

  // District/commune: 01-99
  if (parseInt(district) < 1 || parseInt(district) > 99) return false;
  if (parseInt(commune) < 1 || parseInt(commune) > 99) return false;

  // Sequence: 000001-999999
  if (parseInt(sequence) < 1 || parseInt(sequence) > 999999) return false;

  return true;
}
```

### 4.2 Land Use Code Validation

```typescript
const VALID_LAND_USE_CODES = [
  // Agricultural
  'NNG.LUA', 'NNG.CKH', 'NNG.CLN', 'NNG.RSD', 'NNG.RPH', 'NNG.RDB',
  'NNG.NTS', 'NNG.MLN', 'NNG.NKH',

  // Residential
  'PNN.DO.TT', 'PNN.DO.NT', 'PNN.DO.NHA', 'PNN.DO.KCN',

  // Commercial/Production
  'PNN.SXKD.CN', 'PNN.SXKD.KCN', 'PNN.SXKD.KCX', 'PNN.SXKD.CCN',
  'PNN.SXKD.TMCT', 'PNN.SXKD.SKS', 'PNN.SXKD.NHA',

  // Public
  'PNN.CC.GT', 'PNN.CC.TL', 'PNN.CC.DL', 'PNN.CC.TDVH',
  'PNN.CC.KVS', 'PNN.CC.NTDT', 'PNN.CC.SDD', 'PNN.CC.MNC',

  // Defense/Security
  'PNN.QPAN', 'PNN.AN',

  // Non-business
  'PNN.PKD.TN', 'PNN.PKD.TN.PHD', 'PNN.PKD.NC',

  // Unused
  'CSD.DD', 'CSD.KT',
];

function validateLandUseCode(code: string): boolean {
  return VALID_LAND_USE_CODES.includes(code);
}
```

### 4.3 GPS Coordinate Validation

```typescript
function validateCoordinates(lat: number, lon: number): boolean {
  // Vietnam bounding box (approximate)
  const VIETNAM_BOUNDS = {
    minLat: 8.0,    // Southernmost point (Cà Mau)
    maxLat: 23.5,   // Northernmost point (Hà Giang)
    minLon: 102.0,  // Westernmost point (Điện Biên)
    maxLon: 110.0,  // Easternmost point (Khánh Hòa islands)
  };

  if (lat < VIETNAM_BOUNDS.minLat || lat > VIETNAM_BOUNDS.maxLat) return false;
  if (lon < VIETNAM_BOUNDS.minLon || lon > VIETNAM_BOUNDS.maxLon) return false;

  return true;
}
```

### 4.4 ID Number Validation (CCCD/CMND)

```typescript
function validateIdNumber(idNumber: string): boolean {
  // Old CMND: 9 digits
  // New CCCD: 12 digits
  const CMND_REGEX = /^\d{9}$/;
  const CCCD_REGEX = /^\d{12}$/;

  return CMND_REGEX.test(idNumber) || CCCD_REGEX.test(idNumber);
}
```

---

## 5. Compliance Checklist

### 5.1 Data Collection Compliance

- [ ] App collects all mandatory fields per Circular 02/2015/TT-BTNMT
- [ ] Land use codes match official classification in Land Law 2013
- [ ] Administrative unit codes are sourced from official government database
- [ ] GPS coordinates use WGS84 (EPSG:4326) spatial reference
- [ ] Location identifiers follow PP-DD-CC-NNNNNN format
- [ ] Photo evidence includes street frontage view
- [ ] Survey timestamp is recorded in UTC+7 (Indochina Time)
- [ ] Surveyor ID is linked to authenticated police officer

### 5.2 Data Storage Compliance

- [ ] Database schema includes all mandatory fields
- [ ] Spatial data uses PostGIS with appropriate SRID
- [ ] Data retention follows government guidelines (minimum 10 years)
- [ ] Backup and recovery procedures are documented
- [ ] Data encryption at rest (for sensitive fields)
- [ ] Access control via Row Level Security (RLS)

### 5.3 Data Privacy Compliance

Per **Law on Personal Data Protection** (expected 2024-2025):

- [ ] Owner personal data (name, ID, phone) has access restrictions
- [ ] Consent mechanism for optional personal data collection
- [ ] Data minimization: only collect necessary fields
- [ ] Data subject rights: provide access/correction mechanisms
- [ ] Audit logging for all data access

### 5.4 Offline Operation Compliance

- [ ] Local data storage is secure (encrypted if possible)
- [ ] Sync queue prevents data loss during offline operation
- [ ] Data integrity checks before/after sync
- [ ] Conflict resolution strategy documented
- [ ] Maximum offline duration policy (e.g., 7 days before mandatory sync)

---

## 6. Reference Data Management

### 6.1 Update Frequency

| Data Type | Update Frequency | Source |
|-----------|------------------|--------|
| Land use categories | Annually (or when law changes) | Ministry of Natural Resources and Environment (MONRE) |
| Administrative units | Quarterly | General Statistics Office (GSO) |
| Province/district/commune codes | As changed (track via decree) | Government decrees |

### 6.2 Update Process

1. **Monitor for changes:**
   - Subscribe to MONRE announcements
   - Track GSO administrative updates
   - Watch for new decrees/circulars

2. **Validate changes:**
   - Cross-reference multiple official sources
   - Verify code format consistency
   - Test against existing data

3. **Update database:**
   - Run migration scripts for new codes
   - Maintain backward compatibility
   - Update reference documentation

4. **Update mobile app:**
   - Sync new reference data to devices
   - Clear cached reference data
   - Force app update if schema changes

### 6.3 Seed Data Scripts

Location: `supabase/seed-land-use-types-official.sql`, `supabase/seed-admin-units.sql`

**Important:** Use `seed-land-use-types-official.sql` (not `seed-land-use-types.sql`) for regulatory compliance with Land Law 2013 and Decree 43/2014/NĐ-CP.

**Maintenance:**
- Review annually for regulatory updates
- Version control all seed data changes
- Document source of each code/category

---

## 7. Future Regulatory Considerations

### 7.1 Anticipated Changes

1. **Digital Cadastre Modernization (2025-2030)**
   - Transition to 3D cadastre (building heights, underground rights)
   - Blockchain-based land registry integration
   - Real-time parcel boundary updates

2. **Enhanced Environmental Compliance**
   - Carbon footprint tracking for land use changes
   - Biodiversity impact assessments
   - Climate change adaptation requirements

3. **Smart City Integration**
   - IoT sensor data integration (air quality, noise levels)
   - Building Information Modeling (BIM) integration
   - Real-time occupancy and usage monitoring

### 7.2 Preparation Steps

- [ ] Design database schema with extensibility in mind
- [ ] Use versioned API contracts
- [ ] Implement feature flags for experimental compliance features
- [ ] Maintain comprehensive audit logs for regulatory review
- [ ] Participate in pilot programs for new cadastral standards

---

## 8. Vietnamese Translation Reference

### 8.1 Key Terms

| English | Vietnamese | Abbreviation |
|---------|-----------|--------------|
| Cadastre | Địa chính | ĐC |
| Land use | Sử dụng đất | SDD |
| Agricultural land | Đất nông nghiệp | NNG |
| Non-agricultural land | Đất phi nông nghiệp | PNN |
| Unused land | Đất chưa sử dụng | CSD |
| Residential land | Đất ở | DO |
| Location identifier | Mã định danh vị trí | MĐĐVT |
| Survey | Khảo sát | KS |
| Boundary | Ranh giới | RG |
| Land parcel | Thửa đất | TĐ |
| Land use certificate | Giấy chứng nhận quyền sử dụng đất | GCN QSDĐ |
| Commune police | Công an xã | CAX |

### 8.2 Error Messages

All validation errors must be displayed in Vietnamese:

```typescript
const ERROR_MESSAGES = {
  INVALID_LOCATION_ID: 'Mã định danh không hợp lệ. Định dạng: PP-DD-CC-NNNNNN',
  INVALID_LAND_USE_CODE: 'Mã loại đất không hợp lệ. Vui lòng chọn từ danh sách.',
  INVALID_GPS: 'Tọa độ GPS không hợp lệ hoặc nằm ngoài Việt Nam.',
  MISSING_MANDATORY_FIELD: 'Thiếu trường bắt buộc: {fieldName}',
  INVALID_ID_NUMBER: 'Số CCCD/CMND không hợp lệ (9 hoặc 12 chữ số).',
  PHOTO_REQUIRED: 'Cần ít nhất 1 ảnh hiện trạng mặt tiền.',
};
```

---

## 9. Implementation Checklist for C06 App

### 9.1 Database Schema Updates

- [x] `ref_land_use_types` table with all official codes ✅ (Implemented)
- [x] `ref_admin_units` table with province/district/commune codes ✅ (Implemented)
- [ ] Add `location_identifier` field to `survey_locations` (format: PP-DD-CC-NNNNNN)
- [ ] Add `gps_accuracy` field to track coordinate precision
- [ ] Add `land_plot_area` and `building_area` fields (optional)
- [ ] Add `land_use_certificate_number` field (optional)
- [ ] Add data versioning/audit fields (created_at, updated_at, modified_by)

### 9.2 Validation Implementation

- [ ] Implement location identifier auto-generation based on admin unit + sequence
- [ ] Add GPS coordinate bounds checking (Vietnam bounding box)
- [ ] Add land use code validation against `ref_land_use_types`
- [ ] Add ID number format validation (9 or 12 digits)
- [ ] Add photo requirement validation (minimum 1 photo)
- [ ] Add address completeness validation

### 9.3 UI/UX Updates

- [ ] Add location identifier display on ReviewSubmit screen
- [ ] Add GPS accuracy indicator on GPSCapture screen
- [ ] Add land use category hierarchy selector (group → type → subtype)
- [ ] Add administrative unit hierarchical selector (province → district → commune)
- [ ] Add validation error messages in Vietnamese
- [ ] Add "Required by law" indicators on mandatory fields

### 9.4 Reference Data Management

- [x] Implement cache expiration for reference data (24 hours) ✅ (Implemented)
- [ ] Add manual "Update Reference Data" button in Settings
- [ ] Add last update timestamp display for reference data
- [ ] Implement delta sync for administrative units (only fetch changes)
- [ ] Add offline fallback to last cached reference data

### 9.5 Documentation

- [x] This CADASTRAL_REGULATIONS.md document ✅
- [ ] Update DATA_MODEL.md with new regulatory fields
- [ ] Update SURVEY_WORKFLOW.md with validation rules
- [ ] Create COMPLIANCE_CHECKLIST.md for deployment
- [ ] Add Vietnamese translation glossary to docs

---

## 10. Official Reference Sources

### 10.1 Legal Documents

- Land Law 2013: https://thuvienphapluat.vn/van-ban/Bat-dong-san/Luat-dat-dai-2013-215836.aspx
- Decree 43/2014/NĐ-CP: https://thuvienphapluat.vn/van-ban/Bat-dong-san/Nghi-dinh-43-2014-ND-CP-quy-dinh-chi-tiet-thi-hanh-Luat-Dat-dai-227471.aspx
- Circular 02/2015/TT-BTNMT: https://thuvienphapluat.vn/van-ban/Bat-dong-san/Thong-tu-02-2015-TT-BTNMT-khao-sat-do-dac-ban-do-dia-chinh-265179.aspx

### 10.2 Government Data Sources

- **Administrative Units API:** https://provinces.open-api.vn/api/
- **Ministry of Natural Resources and Environment (MONRE):** https://www.monre.gov.vn/
- **General Statistics Office (GSO):** https://www.gso.gov.vn/
- **Vietnam Land Database:** (Contact local MONRE office for access)

### 10.3 Technical Standards

- **VN-2000 Coordinate System:** National technical regulation QCVN 01:2008/BTNMT
- **GPS Survey Standards:** TCVN 9399:2012 (Cadastral survey technical regulations)
- **Spatial Data Standards:** TCVN 7712:2007 (Geographic information standards)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-21 | Claude Code | Initial documentation of Vietnamese cadastral regulations and codes |

---

**END OF DOCUMENT**
