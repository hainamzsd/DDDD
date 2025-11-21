-- ============================================================================
-- LocationID Tracker (C06) - Seed Data
-- ============================================================================
-- This script populates reference tables with initial data
-- Run this AFTER schema.sql
-- ============================================================================

-- ============================================================================
-- OBJECT TYPES (Vietnamese)
-- ============================================================================
INSERT INTO public.ref_object_types (code, name_vi, description, group_code, sort_order) VALUES
  ('HOUSE', 'Nhà ở', 'Nhà ở dân cư, chung cư', 'RESIDENTIAL', 1),
  ('SHOP', 'Cửa hàng', 'Cửa hàng kinh doanh, showroom', 'COMMERCIAL', 2),
  ('OFFICE', 'Văn phòng', 'Văn phòng làm việc, công ty', 'COMMERCIAL', 3),
  ('FACTORY', 'Nhà xưởng', 'Nhà xưởng sản xuất, kho bãi', 'INDUSTRIAL', 4),
  ('SCHOOL', 'Trường học', 'Trường mầm non, tiểu học, THCS, THPT, đại học', 'PUBLIC', 5),
  ('HOSPITAL', 'Bệnh viện', 'Bệnh viện, trạm y tế, phòng khám', 'PUBLIC', 6),
  ('TEMPLE', 'Đền chùa', 'Đền, chùa, nhà thờ, thánh đường', 'RELIGIOUS', 7),
  ('PARK', 'Công viên', 'Công viên, khu vui chơi, quảng trường', 'PUBLIC', 8),
  ('GOVERNMENT', 'Cơ quan nhà nước', 'UBND, công an, quân đội', 'PUBLIC', 9),
  ('MARKET', 'Chợ', 'Chợ truyền thống, siêu thị', 'COMMERCIAL', 10),
  ('RESTAURANT', 'Nhà hàng', 'Nhà hàng, quán ăn, café', 'COMMERCIAL', 11),
  ('HOTEL', 'Khách sạn', 'Khách sạn, nhà nghỉ', 'COMMERCIAL', 12),
  ('BANK', 'Ngân hàng', 'Ngân hàng, ATM', 'COMMERCIAL', 13),
  ('GAS_STATION', 'Cây xăng', 'Trạm xăng dầu', 'COMMERCIAL', 14),
  ('PARKING', 'Bãi đỗ xe', 'Bãi đỗ xe ô tô, xe máy', 'PUBLIC', 15),
  ('WAREHOUSE', 'Kho bãi', 'Kho hàng, kho chứa', 'INDUSTRIAL', 16),
  ('SPORT', 'Thể thao', 'Sân vận động, phòng gym', 'PUBLIC', 17),
  ('CEMETERY', 'Nghĩa trang', 'Nghĩa trang, nghĩa địa', 'PUBLIC', 18),
  ('FARM', 'Trang trại', 'Trang trại, nông trường', 'AGRICULTURAL', 19),
  ('OTHER', 'Khác', 'Loại hình khác', 'OTHER', 99)
ON CONFLICT (code) DO UPDATE SET
  name_vi = EXCLUDED.name_vi,
  description = EXCLUDED.description,
  group_code = EXCLUDED.group_code,
  sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- ADMINISTRATIVE UNITS - Sample Data (Hanoi)
-- ============================================================================
-- Note: This is sample data for Hanoi. You should load complete data from
-- official Vietnamese administrative unit database.

-- Provinces (Tỉnh/Thành phố trực thuộc TW)
INSERT INTO public.ref_admin_units (code, name, level, parent_code, full_name, short_name) VALUES
  ('01', 'Hà Nội', 'PROVINCE', NULL, 'Thành phố Hà Nội', 'Hà Nội'),
  ('79', 'Thành phố Hồ Chí Minh', 'PROVINCE', NULL, 'Thành phố Hồ Chí Minh', 'TP.HCM'),
  ('31', 'Hải Phòng', 'PROVINCE', NULL, 'Thành phố Hải Phòng', 'Hải Phòng'),
  ('48', 'Đà Nẵng', 'PROVINCE', NULL, 'Thành phố Đà Nẵng', 'Đà Nẵng'),
  ('92', 'Cần Thơ', 'PROVINCE', NULL, 'Thành phố Cần Thơ', 'Cần Thơ')
ON CONFLICT (code) DO NOTHING;

-- Districts of Hanoi (Quận/Huyện)
INSERT INTO public.ref_admin_units (code, name, level, parent_code, full_name, short_name) VALUES
  ('001', 'Ba Đình', 'DISTRICT', '01', 'Quận Ba Đình', 'Q.Ba Đình'),
  ('002', 'Hoàn Kiếm', 'DISTRICT', '01', 'Quận Hoàn Kiếm', 'Q.Hoàn Kiếm'),
  ('003', 'Tây Hồ', 'DISTRICT', '01', 'Quận Tây Hồ', 'Q.Tây Hồ'),
  ('004', 'Long Biên', 'DISTRICT', '01', 'Quận Long Biên', 'Q.Long Biên'),
  ('005', 'Cầu Giấy', 'DISTRICT', '01', 'Quận Cầu Giấy', 'Q.Cầu Giấy'),
  ('006', 'Đống Đa', 'DISTRICT', '01', 'Quận Đống Đa', 'Q.Đống Đa'),
  ('007', 'Hai Bà Trưng', 'DISTRICT', '01', 'Quận Hai Bà Trưng', 'Q.Hai Bà Trưng'),
  ('008', 'Hoàng Mai', 'DISTRICT', '01', 'Quận Hoàng Mai', 'Q.Hoàng Mai'),
  ('009', 'Thanh Xuân', 'DISTRICT', '01', 'Quận Thanh Xuân', 'Q.Thanh Xuân'),
  ('016', 'Sóc Sơn', 'DISTRICT', '01', 'Huyện Sóc Sơn', 'H.Sóc Sơn'),
  ('017', 'Đông Anh', 'DISTRICT', '01', 'Huyện Đông Anh', 'H.Đông Anh'),
  ('018', 'Gia Lâm', 'DISTRICT', '01', 'Huyện Gia Lâm', 'H.Gia Lâm'),
  ('019', 'Nam Từ Liêm', 'DISTRICT', '01', 'Quận Nam Từ Liêm', 'Q.Nam Từ Liêm'),
  ('020', 'Thanh Trì', 'DISTRICT', '01', 'Huyện Thanh Trì', 'H.Thanh Trì'),
  ('021', 'Bắc Từ Liêm', 'DISTRICT', '01', 'Quận Bắc Từ Liêm', 'Q.Bắc Từ Liêm'),
  ('250', 'Mê Linh', 'DISTRICT', '01', 'Huyện Mê Linh', 'H.Mê Linh'),
  ('268', 'Hà Đông', 'DISTRICT', '01', 'Quận Hà Đông', 'Q.Hà Đông'),
  ('269', 'Sơn Tây', 'DISTRICT', '01', 'Thị xã Sơn Tây', 'TX.Sơn Tây'),
  ('271', 'Ba Vì', 'DISTRICT', '01', 'Huyện Ba Vì', 'H.Ba Vì'),
  ('272', 'Phúc Thọ', 'DISTRICT', '01', 'Huyện Phúc Thọ', 'H.Phúc Thọ'),
  ('273', 'Đan Phượng', 'DISTRICT', '01', 'Huyện Đan Phượng', 'H.Đan Phượng'),
  ('274', 'Hoài Đức', 'DISTRICT', '01', 'Huyện Hoài Đức', 'H.Hoài Đức'),
  ('275', 'Quốc Oai', 'DISTRICT', '01', 'Huyện Quốc Oai', 'H.Quốc Oai'),
  ('276', 'Thạch Thất', 'DISTRICT', '01', 'Huyện Thạch Thất', 'H.Thạch Thất'),
  ('277', 'Chương Mỹ', 'DISTRICT', '01', 'Huyện Chương Mỹ', 'H.Chương Mỹ'),
  ('278', 'Thanh Oai', 'DISTRICT', '01', 'Huyện Thanh Oai', 'H.Thanh Oai'),
  ('279', 'Thường Tín', 'DISTRICT', '01', 'Huyện Thường Tín', 'H.Thường Tín'),
  ('280', 'Phú Xuyên', 'DISTRICT', '01', 'Huyện Phú Xuyên', 'H.Phú Xuyên'),
  ('281', 'Ứng Hòa', 'DISTRICT', '01', 'Huyện Ứng Hòa', 'H.Ứng Hòa'),
  ('282', 'Mỹ Đức', 'DISTRICT', '01', 'Huyện Mỹ Đức', 'H.Mỹ Đức')
ON CONFLICT (code) DO NOTHING;

-- Sample Wards of Ba Dinh District (Phường)
INSERT INTO public.ref_admin_units (code, name, level, parent_code, full_name, short_name) VALUES
  ('00001', 'Phúc Xá', 'WARD', '001', 'Phường Phúc Xá', 'P.Phúc Xá'),
  ('00004', 'Trúc Bạch', 'WARD', '001', 'Phường Trúc Bạch', 'P.Trúc Bạch'),
  ('00006', 'Vĩnh Phúc', 'WARD', '001', 'Phường Vĩnh Phúc', 'P.Vĩnh Phúc'),
  ('00007', 'Cống Vị', 'WARD', '001', 'Phường Cống Vị', 'P.Cống Vị'),
  ('00008', 'Liễu Giai', 'WARD', '001', 'Phường Liễu Giai', 'P.Liễu Giai'),
  ('00010', 'Nguyễn Trung Trực', 'WARD', '001', 'Phường Nguyễn Trung Trực', 'P.Nguyễn Trung Trực'),
  ('00013', 'Quán Thánh', 'WARD', '001', 'Phường Quán Thánh', 'P.Quán Thánh'),
  ('00016', 'Ngọc Hà', 'WARD', '001', 'Phường Ngọc Hà', 'P.Ngọc Hà'),
  ('00019', 'Điện Biên', 'WARD', '001', 'Phường Điện Biên', 'P.Điện Biên'),
  ('00022', 'Đội Cấn', 'WARD', '001', 'Phường Đội Cấn', 'P.Đội Cấn'),
  ('00025', 'Ngọc Khánh', 'WARD', '001', 'Phường Ngọc Khánh', 'P.Ngọc Khánh'),
  ('00028', 'Kim Mã', 'WARD', '001', 'Phường Kim Mã', 'P.Kim Mã'),
  ('00031', 'Giảng Võ', 'WARD', '001', 'Phường Giảng Võ', 'P.Giảng Võ'),
  ('00034', 'Thành Công', 'WARD', '001', 'Phường Thành Công', 'P.Thành Công')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Seed data inserted successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Data inserted:';
  RAISE NOTICE '- % object types', (SELECT COUNT(*) FROM public.ref_object_types);
  RAISE NOTICE '- % administrative units', (SELECT COUNT(*) FROM public.ref_admin_units);
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create a test user in Supabase Authentication';
  RAISE NOTICE '2. Insert a profile for that user';
  RAISE NOTICE '3. Generate TypeScript types';
  RAISE NOTICE '';
END $$;
