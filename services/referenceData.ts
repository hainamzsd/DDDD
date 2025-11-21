/**
 * Reference Data Service
 * Fetches and caches reference data (object types, admin units, etc.)
 */

import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ObjectType, AdminUnit, LandUseType } from '../types/survey';
import type { Database } from '../types/database';

const OBJECT_TYPES_CACHE_KEY = '@ref_object_types';
const ADMIN_UNITS_CACHE_KEY = '@ref_admin_units';
const LAND_USE_TYPES_CACHE_KEY = '@ref_land_use_types';
const CACHE_EXPIRY_HOURS = 24;

interface CacheData<T> {
  data: T[];
  cachedAt: string;
}

// Helper function to check if cache is expired
const isCacheExpired = (cachedAt: string): boolean => {
  const cacheTime = new Date(cachedAt).getTime();
  const now = Date.now();
  const expiryMs = CACHE_EXPIRY_HOURS * 60 * 60 * 1000;
  return now - cacheTime > expiryMs;
};

/**
 * Get object types with caching
 */
export const getObjectTypes = async (): Promise<ObjectType[]> => {
  try {
    // Try to get from cache first
    const cachedJson = await AsyncStorage.getItem(OBJECT_TYPES_CACHE_KEY);
    if (cachedJson) {
      const cached: CacheData<ObjectType> = JSON.parse(cachedJson);
      if (!isCacheExpired(cached.cachedAt)) {
        console.log('[RefData] Using cached object types');
        return cached.data;
      }
    }

    // Fetch from Supabase
    const { data, error } = await supabase
      .from('ref_object_types')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    const objectTypes: ObjectType[] = data.map((row: any) => ({
      code: row.code,
      nameVi: row.name_vi,
      description: row.description,
      groupCode: row.group_code,
      sortOrder: row.sort_order,
    }));

    // Cache the results
    const cacheData: CacheData<ObjectType> = {
      data: objectTypes,
      cachedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(OBJECT_TYPES_CACHE_KEY, JSON.stringify(cacheData));

    console.log('[RefData] Fetched and cached object types:', objectTypes.length);
    return objectTypes;
  } catch (error) {
    console.error('[RefData] Failed to get object types:', error);

    // If fetch fails, try to return cached data even if expired
    const cachedJson = await AsyncStorage.getItem(OBJECT_TYPES_CACHE_KEY);
    if (cachedJson) {
      const cached: CacheData<ObjectType> = JSON.parse(cachedJson);
      console.log('[RefData] Using expired cache for object types');
      return cached.data;
    }

    // If no cache, return fallback data
    return getFallbackObjectTypes();
  }
};

/**
 * Get admin units with caching
 */
export const getAdminUnits = async (
  level?: 'PROVINCE' | 'DISTRICT' | 'WARD',
  parentCode?: string
): Promise<AdminUnit[]> => {
  try {
    // Try to get from cache first (only for full list)
    if (!level && !parentCode) {
      const cachedJson = await AsyncStorage.getItem(ADMIN_UNITS_CACHE_KEY);
      if (cachedJson) {
        const cached: CacheData<AdminUnit> = JSON.parse(cachedJson);
        if (!isCacheExpired(cached.cachedAt)) {
          console.log('[RefData] Using cached admin units');
          return cached.data;
        }
      }
    }

    // Build query
    let query = supabase
      .from('ref_admin_units')
      .select('*')
      .order('code', { ascending: true });

    if (level) {
      query = query.eq('level', level);
    }

    if (parentCode) {
      query = query.eq('parent_code', parentCode);
    }

    const { data, error } = await query as { data: Database['public']['Tables']['ref_admin_units']['Row'][] | null; error: any };

    if (error) throw error;

    const adminUnits: AdminUnit[] = (data || []).map((row) => ({
      code: row.code,
      name: row.name,
      level: row.level,
      parentCode: row.parent_code,
      fullName: row.full_name,
      shortName: row.short_name,
    }));

    // Cache only the full list
    if (!level && !parentCode) {
      const cacheData: CacheData<AdminUnit> = {
        data: adminUnits,
        cachedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(ADMIN_UNITS_CACHE_KEY, JSON.stringify(cacheData));
      console.log('[RefData] Fetched and cached admin units:', adminUnits.length);
    }

    return adminUnits;
  } catch (error) {
    console.error('[RefData] Failed to get admin units:', error);

    // If fetch fails, try to return cached data
    if (!level && !parentCode) {
      const cachedJson = await AsyncStorage.getItem(ADMIN_UNITS_CACHE_KEY);
      if (cachedJson) {
        const cached: CacheData<AdminUnit> = JSON.parse(cachedJson);
        console.log('[RefData] Using expired cache for admin units');
        return cached.data;
      }
    }

    return [];
  }
};

/**
 * Get provinces
 */
export const getProvinces = async (): Promise<AdminUnit[]> => {
  return getAdminUnits('PROVINCE');
};

/**
 * Get districts by province
 */
export const getDistricts = async (provinceCode: string): Promise<AdminUnit[]> => {
  return getAdminUnits('DISTRICT', provinceCode);
};

/**
 * Get wards by district
 */
export const getWards = async (districtCode: string): Promise<AdminUnit[]> => {
  return getAdminUnits('WARD', districtCode);
};

/**
 * Get land use types with caching
 */
export const getLandUseTypes = async (
  category?: string,
  parentCode?: string
): Promise<LandUseType[]> => {
  try {
    // Try to get from cache first (only for full list)
    if (!category && !parentCode) {
      const cachedJson = await AsyncStorage.getItem(LAND_USE_TYPES_CACHE_KEY);
      if (cachedJson) {
        const cached: CacheData<LandUseType> = JSON.parse(cachedJson);
        if (!isCacheExpired(cached.cachedAt)) {
          console.log('[RefData] Using cached land use types');
          return cached.data;
        }
      }
    }

    // Build query
    let query = supabase
      .from('ref_land_use_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    if (parentCode) {
      query = query.eq('parent_code', parentCode);
    }

    const { data, error } = await query as { data: Database['public']['Tables']['ref_land_use_types']['Row'][] | null; error: any };

    if (error) throw error;

    const landUseTypes: LandUseType[] = (data || []).map((row) => ({
      code: row.code,
      nameVi: row.name_vi,
      description: row.description,
      category: row.category,
      parentCode: row.parent_code,
      isActive: row.is_active,
      sortOrder: row.sort_order,
    }));

    // Cache only the full list
    if (!category && !parentCode) {
      const cacheData: CacheData<LandUseType> = {
        data: landUseTypes,
        cachedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(LAND_USE_TYPES_CACHE_KEY, JSON.stringify(cacheData));
      console.log('[RefData] Fetched and cached land use types:', landUseTypes.length);
    }

    return landUseTypes;
  } catch (error) {
    console.error('[RefData] Failed to get land use types:', error);

    // If fetch fails, try to return cached data
    if (!category && !parentCode) {
      const cachedJson = await AsyncStorage.getItem(LAND_USE_TYPES_CACHE_KEY);
      if (cachedJson) {
        const cached: CacheData<LandUseType> = JSON.parse(cachedJson);
        console.log('[RefData] Using expired cache for land use types');
        return cached.data;
      }
    }

    // Return fallback data if no cache
    return getFallbackLandUseTypes();
  }
};

/**
 * Get land use types by category
 */
export const getLandUseTypesByCategory = async (category: string): Promise<LandUseType[]> => {
  return getLandUseTypes(category);
};

/**
 * Get top-level land use categories (no parent)
 */
export const getTopLevelLandUseCategories = async (): Promise<LandUseType[]> => {
  const allTypes = await getLandUseTypes();
  return allTypes.filter(type => !type.parentCode);
};

/**
 * Clear all reference data cache
 */
export const clearReferenceDataCache = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    OBJECT_TYPES_CACHE_KEY,
    ADMIN_UNITS_CACHE_KEY,
    LAND_USE_TYPES_CACHE_KEY,
  ]);
  console.log('[RefData] Cleared all reference data cache');
};

/**
 * Fallback object types (used when offline and no cache)
 */
const getFallbackObjectTypes = (): ObjectType[] => {
  return [
    { code: 'HOUSE', nameVi: 'Nhà ở', description: 'Nhà ở dân cư', groupCode: null, sortOrder: 1 },
    { code: 'SHOP', nameVi: 'Cửa hàng', description: 'Cửa hàng kinh doanh', groupCode: null, sortOrder: 2 },
    { code: 'OFFICE', nameVi: 'Văn phòng', description: 'Văn phòng làm việc', groupCode: null, sortOrder: 3 },
    { code: 'FACTORY', nameVi: 'Nhà xưởng', description: 'Nhà xưởng sản xuất', groupCode: null, sortOrder: 4 },
    { code: 'SCHOOL', nameVi: 'Trường học', description: 'Trường học', groupCode: null, sortOrder: 5 },
    { code: 'HOSPITAL', nameVi: 'Bệnh viện', description: 'Cơ sở y tế', groupCode: null, sortOrder: 6 },
    { code: 'TEMPLE', nameVi: 'Đền chùa', description: 'Cơ sở tôn giáo', groupCode: null, sortOrder: 7 },
    { code: 'PARK', nameVi: 'Công viên', description: 'Công viên, khu vui chơi', groupCode: null, sortOrder: 8 },
    { code: 'OTHER', nameVi: 'Khác', description: 'Loại hình khác', groupCode: null, sortOrder: 99 },
  ];
};

/**
 * Fallback land use types (used when offline and no cache)
 * Uses OFFICIAL Vietnamese cadastral codes per Land Law 2013 and Decree 43/2014/NĐ-CP
 * @see supabase/seed-land-use-types-official.sql
 * @see docs/CADASTRAL_REGULATIONS.md
 */
const getFallbackLandUseTypes = (): LandUseType[] => {
  return [
    // Top-level categories (3 main groups per regulations)
    { code: 'NNG', nameVi: 'Đất nông nghiệp', description: 'Nhóm đất nông nghiệp', category: 'agricultural', parentCode: null, isActive: true, sortOrder: 100 },
    { code: 'PNN', nameVi: 'Đất phi nông nghiệp', description: 'Nhóm đất phi nông nghiệp', category: 'non-agricultural', parentCode: null, isActive: true, sortOrder: 200 },
    { code: 'CSD', nameVi: 'Đất chưa sử dụng', description: 'Nhóm đất chưa sử dụng', category: 'unused', parentCode: null, isActive: true, sortOrder: 300 },

    // Common agricultural subcategories
    { code: 'NNG.LUA', nameVi: 'Đất trồng lúa', description: 'Đất chuyên trồng lúa nước (được bảo vệ, hạn chế chuyển đổi)', category: 'agricultural', parentCode: 'NNG', isActive: true, sortOrder: 101 },
    { code: 'NNG.CKH', nameVi: 'Đất trồng cây hàng năm khác', description: 'Đất trồng rau, màu, cây ngắn ngày (không phải lúa)', category: 'agricultural', parentCode: 'NNG', isActive: true, sortOrder: 102 },
    { code: 'NNG.CLN', nameVi: 'Đất trồng cây lâu năm', description: 'Đất trồng cà phê, cao su, cây ăn quả lâu năm', category: 'agricultural', parentCode: 'NNG', isActive: true, sortOrder: 103 },

    // Common residential subcategories (PNN.DO)
    { code: 'PNN.DO', nameVi: 'Đất ở', description: 'Nhóm đất ở (đô thị và nông thôn)', category: 'residential', parentCode: 'PNN', isActive: true, sortOrder: 210 },
    { code: 'PNN.DO.TT', nameVi: 'Đất ở tại đô thị', description: 'Đất ở trong khu vực đô thị (thành phố, thị xã, thị trấn)', category: 'residential', parentCode: 'PNN.DO', isActive: true, sortOrder: 211 },
    { code: 'PNN.DO.NT', nameVi: 'Đất ở tại nông thôn', description: 'Đất ở tại khu vực nông thôn (xã)', category: 'residential', parentCode: 'PNN.DO', isActive: true, sortOrder: 212 },

    // Common commercial subcategories (PNN.SXKD)
    { code: 'PNN.SXKD', nameVi: 'Đất sản xuất, kinh doanh', description: 'Nhóm đất sản xuất, kinh doanh phi nông nghiệp', category: 'commercial', parentCode: 'PNN', isActive: true, sortOrder: 220 },
    { code: 'PNN.SXKD.CN', nameVi: 'Đất sản xuất, kinh doanh phi nông nghiệp', description: 'Đất nhà máy, xưởng sản xuất, kho bãi, cơ sở kinh doanh', category: 'commercial', parentCode: 'PNN.SXKD', isActive: true, sortOrder: 221 },
    { code: 'PNN.SXKD.TMCT', nameVi: 'Đất thương mại, dịch vụ', description: 'Đất cửa hàng, chợ, khách sạn, nhà hàng, văn phòng', category: 'commercial', parentCode: 'PNN.SXKD', isActive: true, sortOrder: 225 },

    // Common public land subcategories (PNN.CC)
    { code: 'PNN.CC', nameVi: 'Đất công cộng', description: 'Nhóm đất sử dụng vào mục đích công cộng', category: 'public', parentCode: 'PNN', isActive: true, sortOrder: 230 },
    { code: 'PNN.CC.GT', nameVi: 'Đất giao thông', description: 'Đất đường bộ, đường sắt, sân bay, cảng biển, bến xe', category: 'public', parentCode: 'PNN.CC', isActive: true, sortOrder: 231 },

    // Unused land
    { code: 'CSD.KT', nameVi: 'Đất khác chưa sử dụng', description: 'Đất bằng phẳng chưa sử dụng, đất bỏ hoang', category: 'unused', parentCode: 'CSD', isActive: true, sortOrder: 302 },
  ];
};
