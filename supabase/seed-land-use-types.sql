-- ============================================================================
-- Seed Data: Land Use Types (Cadastral Categories)
-- ============================================================================
-- Based on Vietnamese land use and cadastral regulations
-- This includes common land use categories for field surveys

-- Clear existing data (if re-running)
TRUNCATE TABLE public.ref_land_use_types CASCADE;

-- ============================================================================
-- RESIDENTIAL LAND (Đất ở)
-- ============================================================================
INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('RES', 'Đất ở', 'Đất sử dụng cho mục đích ở', 'residential', NULL, TRUE, 10),
('RES_URBAN', 'Đất ở đô thị', 'Đất ở tại khu vực đô thị', 'residential', 'RES', TRUE, 11),
('RES_RURAL', 'Đất ở nông thôn', 'Đất ở tại khu vực nông thôn', 'residential', 'RES', TRUE, 12),
('RES_VILLA', 'Đất ở biệt thự', 'Đất ở dạng biệt thự, nhà vườn', 'residential', 'RES', TRUE, 13),
('RES_APARTMENT', 'Đất chung cư', 'Đất xây dựng chung cư', 'residential', 'RES', TRUE, 14);

-- ============================================================================
-- COMMERCIAL LAND (Đất thương mại, dịch vụ)
-- ============================================================================
INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('COM', 'Đất thương mại, dịch vụ', 'Đất sử dụng cho hoạt động thương mại, dịch vụ', 'commercial', NULL, TRUE, 20),
('COM_OFFICE', 'Đất văn phòng', 'Đất xây dựng văn phòng làm việc', 'commercial', 'COM', TRUE, 21),
('COM_SHOP', 'Đất cửa hàng', 'Đất kinh doanh cửa hàng, shop', 'commercial', 'COM', TRUE, 22),
('COM_MARKET', 'Đất chợ', 'Đất xây dựng chợ, khu mua bán', 'commercial', 'COM', TRUE, 23),
('COM_HOTEL', 'Đất khách sạn, nhà hàng', 'Đất xây dựng khách sạn, nhà hàng', 'commercial', 'COM', TRUE, 24),
('COM_ENTERTAINMENT', 'Đất vui chơi, giải trí', 'Đất xây dựng khu vui chơi giải trí', 'commercial', 'COM', TRUE, 25);

-- ============================================================================
-- INDUSTRIAL LAND (Đất sản xuất, kinh doanh)
-- ============================================================================
INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('IND', 'Đất sản xuất, kinh doanh', 'Đất sử dụng cho hoạt động sản xuất công nghiệp', 'industrial', NULL, TRUE, 30),
('IND_FACTORY', 'Đất nhà xưởng', 'Đất xây dựng nhà xưởng sản xuất', 'industrial', 'IND', TRUE, 31),
('IND_WAREHOUSE', 'Đất kho bãi', 'Đất xây dựng kho bãi, lưu trữ', 'industrial', 'IND', TRUE, 32),
('IND_CRAFT', 'Đất làng nghề', 'Đất sản xuất làng nghề thủ công', 'industrial', 'IND', TRUE, 33),
('IND_ZONE', 'Đất khu công nghiệp', 'Đất thuộc khu công nghiệp', 'industrial', 'IND', TRUE, 34);

-- ============================================================================
-- AGRICULTURAL LAND (Đất nông nghiệp)
-- ============================================================================
INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('AGR', 'Đất nông nghiệp', 'Đất sử dụng cho mục đích nông nghiệp', 'agricultural', NULL, TRUE, 40),
('AGR_RICE', 'Đất trồng lúa', 'Đất chuyên trồng lúa nước', 'agricultural', 'AGR', TRUE, 41),
('AGR_CROP', 'Đất trồng cây hàng năm', 'Đất trồng cây ngắn ngày', 'agricultural', 'AGR', TRUE, 42),
('AGR_PERENNIAL', 'Đất trồng cây lâu năm', 'Đất trồng cây công nghiệp, cây ăn quả lâu năm', 'agricultural', 'AGR', TRUE, 43),
('AGR_FOREST', 'Đất rừng sản xuất', 'Đất rừng trồng', 'agricultural', 'AGR', TRUE, 44),
('AGR_AQUA', 'Đất nuôi trồng thủy sản', 'Đất ao, hồ nuôi trồng thủy sản', 'agricultural', 'AGR', TRUE, 45),
('AGR_GARDEN', 'Đất vườn', 'Đất trồng cây ăn quả, vườn tạp', 'agricultural', 'AGR', TRUE, 46);

-- ============================================================================
-- PUBLIC SERVICE LAND (Đất công cộng)
-- ============================================================================
INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('PUB', 'Đất công cộng', 'Đất sử dụng cho mục đích công cộng', 'public', NULL, TRUE, 50),
('PUB_SCHOOL', 'Đất trường học', 'Đất xây dựng trường học, cơ sở giáo dục', 'public', 'PUB', TRUE, 51),
('PUB_HOSPITAL', 'Đất y tế', 'Đất xây dựng bệnh viện, trạm y tế', 'public', 'PUB', TRUE, 52),
('PUB_CULTURE', 'Đất văn hóa, thể thao', 'Đất nhà văn hóa, sân vận động', 'public', 'PUB', TRUE, 53),
('PUB_ADMIN', 'Đất cơ quan hành chính', 'Đất UBND, cơ quan nhà nước', 'public', 'PUB', TRUE, 54),
('PUB_RELIGIOUS', 'Đất tôn giáo, tín ngưỡng', 'Đất chùa, đình, đền, miếu, nhà thờ', 'public', 'PUB', TRUE, 55),
('PUB_CEMETERY', 'Đất nghĩa trang, nghĩa địa', 'Đất nghĩa trang, nhà tang lễ', 'public', 'PUB', TRUE, 56),
('PUB_PARK', 'Đất công viên, cây xanh', 'Đất công viên, vườn hoa, cây xanh đô thị', 'public', 'PUB', TRUE, 57);

-- ============================================================================
-- INFRASTRUCTURE LAND (Đất hạ tầng)
-- ============================================================================
INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('INF', 'Đất hạ tầng', 'Đất giao thông, thủy lợi, công trình kỹ thuật', 'infrastructure', NULL, TRUE, 60),
('INF_ROAD', 'Đất giao thông', 'Đất đường bộ, đường sắt, sân bay, cảng biển', 'infrastructure', 'INF', TRUE, 61),
('INF_IRRIGATION', 'Đất thủy lợi', 'Đất kênh mương, đập, hồ chứa', 'infrastructure', 'INF', TRUE, 62),
('INF_ENERGY', 'Đất năng lượng', 'Đất nhà máy điện, trạm biến áp, đường dây điện', 'infrastructure', 'INF', TRUE, 63),
('INF_WATER', 'Đất cấp nước', 'Đất nhà máy nước, trạm bơm', 'infrastructure', 'INF', TRUE, 64),
('INF_WASTE', 'Đất xử lý chất thải', 'Đất bãi rác, nhà máy xử lý rác thải', 'infrastructure', 'INF', TRUE, 65);

-- ============================================================================
-- DEFENSE & SECURITY LAND (Đất quốc phòng, an ninh)
-- ============================================================================
INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('DEF', 'Đất quốc phòng, an ninh', 'Đất sử dụng cho mục đích quốc phòng, an ninh', 'defense', NULL, TRUE, 70),
('DEF_MILITARY', 'Đất quân sự', 'Đất trụ sở quân đội, doanh trại', 'defense', 'DEF', TRUE, 71),
('DEF_POLICE', 'Đất công an', 'Đất trụ sở công an, đồn biên phòng', 'defense', 'DEF', TRUE, 72);

-- ============================================================================
-- OTHER / UNCLASSIFIED (Đất chưa sử dụng, khác)
-- ============================================================================
INSERT INTO public.ref_land_use_types (code, name_vi, description, category, parent_code, is_active, sort_order) VALUES
('OTH', 'Đất khác', 'Đất chưa xác định, chưa sử dụng', 'other', NULL, TRUE, 90),
('OTH_UNUSED', 'Đất chưa sử dụng', 'Đất bỏ hoang, chưa sử dụng', 'other', 'OTH', TRUE, 91),
('OTH_RIVER', 'Đất sông, suối, mặt nước', 'Đất mặt nước chuyên dùng', 'other', 'OTH', TRUE, 92),
('OTH_UNKNOWN', 'Chưa xác định', 'Loại đất chưa xác định được', 'other', 'OTH', TRUE, 99);

-- ============================================================================
-- End of seed data
-- ============================================================================
