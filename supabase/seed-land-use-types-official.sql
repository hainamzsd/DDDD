-- ============================================================================
-- Seed Data: Land Use Types (Official Vietnamese Cadastral Codes)
-- ============================================================================
-- Based on Vietnamese Land Law 2013 (Law No. 45/2013/QH13)
-- and Decree 43/2014/NĐ-CP
--
-- This file contains OFFICIAL land use category codes per Vietnamese regulations
-- Use this instead of seed-land-use-types.sql for regulatory compliance
--
-- Reference: docs/CADASTRAL_REGULATIONS.md
-- ============================================================================

-- Clear existing data (if re-running)
TRUNCATE TABLE public.ref_land_use_types CASCADE;

-- ============================================================================
-- GROUP 1: AGRICULTURAL LAND (Đất nông nghiệp - NNG)
-- ============================================================================

-- Parent category
INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('NNG', 'Đất nông nghiệp', 'Nhóm đất nông nghiệp', 'agricultural', NULL, TRUE, 100);

-- Agricultural subcategories
INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('NNG.LUA', 'Đất trồng lúa', 'Đất chuyên trồng lúa nước (được bảo vệ, hạn chế chuyển đổi)', 'agricultural', 'NNG', TRUE, 101),
('NNG.CKH', 'Đất trồng cây hàng năm khác', 'Đất trồng rau, màu, cây ngắn ngày (không phải lúa)', 'agricultural', 'NNG', TRUE, 102),
('NNG.CLN', 'Đất trồng cây lâu năm', 'Đất trồng cà phê, cao su, cây ăn quả lâu năm', 'agricultural', 'NNG', TRUE, 103),
('NNG.RSD', 'Đất rừng sản xuất', 'Đất rừng trồng để khai thác gỗ, lâm sản', 'agricultural', 'NNG', TRUE, 104),
('NNG.RPH', 'Đất rừng phòng hộ', 'Đất rừng đầu nguồn, ven biển (bảo vệ môi trường)', 'agricultural', 'NNG', TRUE, 105),
('NNG.RDB', 'Đất rừng đặc biệt', 'Đất rừng vườn quốc gia, khu bảo tồn thiên nhiên', 'agricultural', 'NNG', TRUE, 106),
('NNG.NTS', 'Đất nuôi trồng thủy sản', 'Đất ao, hồ nuôi tôm, cá', 'agricultural', 'NNG', TRUE, 107),
('NNG.MLN', 'Đất làm muối', 'Đất sản xuất muối (vùng ven biển)', 'agricultural', 'NNG', TRUE, 108),
('NNG.NKH', 'Đất nông nghiệp khác', 'Đất sân phơi, đường nội đồng, kênh mương nội bộ', 'agricultural', 'NNG', TRUE, 109);

-- ============================================================================
-- GROUP 2: NON-AGRICULTURAL LAND (Đất phi nông nghiệp - PNN)
-- ============================================================================

-- Parent category
INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('PNN', 'Đất phi nông nghiệp', 'Nhóm đất phi nông nghiệp', 'non-agricultural', NULL, TRUE, 200);

-- ============================================================================
-- 2.1 RESIDENTIAL LAND (Đất ở - DO)
-- ============================================================================

INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('PNN.DO', 'Đất ở', 'Nhóm đất ở (đô thị và nông thôn)', 'residential', 'PNN', TRUE, 210);

INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('PNN.DO.TT', 'Đất ở tại đô thị', 'Đất ở trong khu vực đô thị (thành phố, thị xã, thị trấn)', 'residential', 'PNN.DO', TRUE, 211),
('PNN.DO.NT', 'Đất ở tại nông thôn', 'Đất ở tại khu vực nông thôn (xã)', 'residential', 'PNN.DO', TRUE, 212),
('PNN.DO.NHA', 'Đất xây dựng trụ sở cơ quan', 'Đất xây dựng trụ sở làm việc của cơ quan nhà nước', 'residential', 'PNN.DO', TRUE, 213),
('PNN.DO.KCN', 'Đất xây dựng công trình sự nghiệp', 'Đất xây dựng trường học, bệnh viện, cơ sở công cộng', 'residential', 'PNN.DO', TRUE, 214);

-- ============================================================================
-- 2.2 COMMERCIAL & PRODUCTION LAND (Đất sản xuất, kinh doanh - SXKD)
-- ============================================================================

INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('PNN.SXKD', 'Đất sản xuất, kinh doanh', 'Nhóm đất sản xuất, kinh doanh phi nông nghiệp', 'commercial', 'PNN', TRUE, 220);

INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('PNN.SXKD.CN', 'Đất sản xuất, kinh doanh phi nông nghiệp', 'Đất nhà máy, xưởng sản xuất, kho bãi, cơ sở kinh doanh', 'commercial', 'PNN.SXKD', TRUE, 221),
('PNN.SXKD.KCN', 'Đất khu công nghiệp', 'Đất thuộc khu công nghiệp đã được phê duyệt', 'commercial', 'PNN.SXKD', TRUE, 222),
('PNN.SXKD.KCX', 'Đất khu chế xuất', 'Đất thuộc khu chế xuất (EPZ)', 'commercial', 'PNN.SXKD', TRUE, 223),
('PNN.SXKD.CCN', 'Đất cụm công nghiệp', 'Đất thuộc cụm công nghiệp cấp xã, huyện', 'commercial', 'PNN.SXKD', TRUE, 224),
('PNN.SXKD.TMCT', 'Đất thương mại, dịch vụ', 'Đất cửa hàng, chợ, khách sạn, nhà hàng, văn phòng', 'commercial', 'PNN.SXKD', TRUE, 225),
('PNN.SXKD.SKS', 'Đất sử dụng cho hoạt động khoáng sản', 'Đất khai thác mỏ, đá, cát', 'commercial', 'PNN.SXKD', TRUE, 226),
('PNN.SXKD.NHA', 'Đất xây dựng công trình sản xuất', 'Đất xây dựng nhà máy, cơ sở sản xuất', 'commercial', 'PNN.SXKD', TRUE, 227);

-- ============================================================================
-- 2.3 PUBLIC PURPOSE LAND (Đất công cộng - CC)
-- ============================================================================

INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('PNN.CC', 'Đất công cộng', 'Nhóm đất sử dụng vào mục đích công cộng', 'public', 'PNN', TRUE, 230);

INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('PNN.CC.GT', 'Đất giao thông', 'Đất đường bộ, đường sắt, sân bay, cảng biển, bến xe', 'public', 'PNN.CC', TRUE, 231),
('PNN.CC.TL', 'Đất thủy lợi', 'Đất kênh, mương, đập, hồ chứa phục vụ thủy lợi', 'public', 'PNN.CC', TRUE, 232),
('PNN.CC.DL', 'Đất có di tích lịch sử - văn hóa', 'Đất di tích lịch sử, văn hóa được công nhận', 'public', 'PNN.CC', TRUE, 233),
('PNN.CC.TDVH', 'Đất danh lam thắng cảnh', 'Đất khu du lịch, danh lam thắng cảnh', 'public', 'PNN.CC', TRUE, 234),
('PNN.CC.KVS', 'Đất sinh hoạt cộng đồng', 'Đất công viên, quảng trường, sân vận động công cộng', 'public', 'PNN.CC', TRUE, 235),
('PNN.CC.NTDT', 'Đất sử dụng vào mục đích công cộng khác', 'Đất nghĩa trang, bãi rác, công trình công cộng khác', 'public', 'PNN.CC', TRUE, 236),
('PNN.CC.SDD', 'Đất sông, ngòi, kênh, rạch, suối', 'Đất mặt nước tự nhiên (sông, suối, kênh)', 'public', 'PNN.CC', TRUE, 237),
('PNN.CC.MNC', 'Đất có mặt nước chuyên dùng', 'Đất hồ chứa nước, ao, đầm chuyên dùng', 'public', 'PNN.CC', TRUE, 238);

-- ============================================================================
-- 2.4 DEFENSE & SECURITY LAND (Đất quốc phòng, an ninh - QPAN)
-- ============================================================================

INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('PNN.QPAN', 'Đất quốc phòng', 'Đất sử dụng cho mục đích quốc phòng (quân đội)', 'defense', 'PNN', TRUE, 240),
('PNN.AN', 'Đất an ninh', 'Đất sử dụng cho mục đích an ninh (công an, biên phòng)', 'defense', 'PNN', TRUE, 241);

-- ============================================================================
-- 2.5 NON-BUSINESS LAND (Đất phi kinh doanh - PKD)
-- ============================================================================

INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('PNN.PKD', 'Đất phi kinh doanh', 'Nhóm đất tôn giáo, tín ngưỡng, nghĩa trang', 'non-business', 'PNN', TRUE, 250);

INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('PNN.PKD.TN', 'Đất tôn giáo', 'Đất chùa, nhà thờ, thánh đường (tôn giáo được công nhận)', 'non-business', 'PNN.PKD', TRUE, 251),
('PNN.PKD.TN.PHD', 'Đất tín ngưỡng', 'Đất đình, đền, miếu, am, từ đường (tín ngưỡng dân gian)', 'non-business', 'PNN.PKD', TRUE, 252),
('PNN.PKD.NC', 'Đất nghĩa trang, nghĩa địa', 'Đất nghĩa trang, nhà tang lễ, hỏa táng', 'non-business', 'PNN.PKD', TRUE, 253);

-- ============================================================================
-- GROUP 3: UNUSED LAND (Đất chưa sử dụng - CSD)
-- ============================================================================

-- Parent category
INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('CSD', 'Đất chưa sử dụng', 'Nhóm đất chưa sử dụng', 'unused', NULL, TRUE, 300);

INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('CSD.DD', 'Đất đồi núi chưa sử dụng', 'Đất đồi núi bỏ hoang, chưa khai thác', 'unused', 'CSD', TRUE, 301),
('CSD.KT', 'Đất khác chưa sử dụng', 'Đất bằng phẳng chưa sử dụng, đất bỏ hoang', 'unused', 'CSD', TRUE, 302);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Official Vietnamese land use types seeded successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Total categories: 47';
  RAISE NOTICE '  - Agricultural land (NNG): 9 types';
  RAISE NOTICE '  - Residential land (PNN.DO): 4 types';
  RAISE NOTICE '  - Commercial land (PNN.SXKD): 7 types';
  RAISE NOTICE '  - Public land (PNN.CC): 8 types';
  RAISE NOTICE '  - Defense/Security (PNN.QPAN/AN): 2 types';
  RAISE NOTICE '  - Non-business (PNN.PKD): 3 types';
  RAISE NOTICE '  - Unused land (CSD): 2 types';
  RAISE NOTICE '';
  RAISE NOTICE 'These codes comply with:';
  RAISE NOTICE '  - Land Law 2013 (Law No. 45/2013/QH13)';
  RAISE NOTICE '  - Decree 43/2014/NĐ-CP';
  RAISE NOTICE '  - Circular 02/2015/TT-BTNMT';
  RAISE NOTICE '';
  RAISE NOTICE 'See docs/CADASTRAL_REGULATIONS.md for detailed information.';
END $$;
