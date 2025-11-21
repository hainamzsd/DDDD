/**
 * Reference Data Service
 * Fetches and caches reference data (object types, admin units, etc.)
 */

import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ObjectType, AdminUnit } from '../types/survey';

const OBJECT_TYPES_CACHE_KEY = '@ref_object_types';
const ADMIN_UNITS_CACHE_KEY = '@ref_admin_units';
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

    const objectTypes: ObjectType[] = data.map((row) => ({
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

    const { data, error } = await query;

    if (error) throw error;

    const adminUnits: AdminUnit[] = data.map((row) => ({
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
 * Clear all reference data cache
 */
export const clearReferenceDataCache = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    OBJECT_TYPES_CACHE_KEY,
    ADMIN_UNITS_CACHE_KEY,
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
