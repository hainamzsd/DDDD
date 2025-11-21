/**
 * Integration tests for referenceData service
 * Tests Supabase integration and caching mechanisms with mock responses
 */

import {
  getObjectTypes,
  getAdminUnits,
  getProvinces,
  getDistricts,
  getWards,
  getLandUseTypes,
  getLandUseTypesByCategory,
  getTopLevelLandUseCategories,
  clearReferenceDataCache,
} from './referenceData';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock the supabase client
jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('referenceData service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getObjectTypes', () => {
    it('should fetch object types from Supabase when cache is empty', async () => {
      const mockObjectTypes = [
        { code: 'HOUSE', name_vi: 'Nhà ở', description: 'Nhà ở dân cư', group_code: null, sort_order: 1 },
        { code: 'SHOP', name_vi: 'Cửa hàng', description: 'Cửa hàng kinh doanh', group_code: null, sort_order: 2 },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockObjectTypes,
            error: null,
          }),
        }),
      });

      const result = await getObjectTypes();

      expect(supabase.from).toHaveBeenCalledWith('ref_object_types');
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('HOUSE');
      expect(result[0].nameVi).toBe('Nhà ở');
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should use cached data when cache is fresh', async () => {
      const cachedData = {
        data: [
          { code: 'HOUSE', nameVi: 'Nhà ở', description: 'Nhà ở dân cư', groupCode: null, sortOrder: 1 },
        ],
        cachedAt: new Date().toISOString(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const result = await getObjectTypes();

      expect(result).toEqual(cachedData.data);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should refetch when cache is expired', async () => {
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 25); // 25 hours ago

      const cachedData = {
        data: [{ code: 'OLD', nameVi: 'Old data', description: '', groupCode: null, sortOrder: 1 }],
        cachedAt: expiredDate.toISOString(),
      };

      const mockObjectTypes = [
        { code: 'HOUSE', name_vi: 'Nhà ở', description: 'Nhà ở dân cư', group_code: null, sort_order: 1 },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockObjectTypes,
            error: null,
          }),
        }),
      });

      const result = await getObjectTypes();

      expect(supabase.from).toHaveBeenCalled();
      expect(result[0].code).toBe('HOUSE');
    });

    it('should return fallback data when fetch fails and no cache exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Network error' },
          }),
        }),
      });

      const result = await getObjectTypes();

      expect(result.length).toBeGreaterThan(0);
      expect(result.some(type => type.code === 'HOUSE')).toBe(true);
    });

    it('should return expired cache when fetch fails', async () => {
      const expiredDate = new Date();
      expiredDate.setHours(expiredDate.getHours() - 48); // 48 hours ago

      const cachedData = {
        data: [{ code: 'CACHED', nameVi: 'Cached data', description: '', groupCode: null, sortOrder: 1 }],
        cachedAt: expiredDate.toISOString(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Network error' },
          }),
        }),
      });

      const result = await getObjectTypes();

      expect(result).toEqual(cachedData.data);
    });
  });

  describe('getAdminUnits', () => {
    it('should fetch all admin units when no filters provided', async () => {
      const mockUnits = [
        { code: '01', name: 'Hà Nội', level: 'PROVINCE', parent_code: null, full_name: 'Thành phố Hà Nội', short_name: 'Hà Nội' },
        { code: '001', name: 'Ba Đình', level: 'DISTRICT', parent_code: '01', full_name: 'Quận Ba Đình', short_name: 'Ba Đình' },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockUnits,
            error: null,
          }),
        }),
      });

      const result = await getAdminUnits();

      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('01');
      expect(result[0].name).toBe('Hà Nội');
    });

    it('should filter by level', async () => {
      jest.clearAllMocks();

      // Mock no cache
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const mockProvinces = [
        { code: '01', name: 'Hà Nội', level: 'PROVINCE', parent_code: null, full_name: 'Thành phố Hà Nội', short_name: 'Hà Nội' },
      ];

      // Mock the query chain: from() → select() → order() → eq() → resolve
      const mockEq = jest.fn().mockResolvedValue({
        data: mockProvinces,
        error: null,
      });

      const mockOrder = jest.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: mockOrder,
        }),
      });

      const result = await getAdminUnits('PROVINCE');

      expect(mockEq).toHaveBeenCalledWith('level', 'PROVINCE');
      expect(result[0].level).toBe('PROVINCE');
    });

    it('should filter by parent code', async () => {
      jest.clearAllMocks();

      // Mock no cache
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const mockDistricts = [
        { code: '001', name: 'Ba Đình', level: 'DISTRICT', parent_code: '01', full_name: 'Quận Ba Đình', short_name: 'Ba Đình' },
      ];

      // Mock the query chain: from() → select() → order() → eq() → eq() → resolve
      const mockEq2 = jest.fn().mockResolvedValue({
        data: mockDistricts,
        error: null,
      });

      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockOrder = jest.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: mockOrder,
        }),
      });

      const result = await getAdminUnits('DISTRICT', '01');

      expect(mockEq1).toHaveBeenCalledWith('level', 'DISTRICT');
      expect(mockEq2).toHaveBeenCalledWith('parent_code', '01');
      expect(result[0].parentCode).toBe('01');
    });

    it('should cache only when fetching full list', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      // Full list - should cache
      await getAdminUnits();
      expect(AsyncStorage.setItem).toHaveBeenCalled();

      jest.clearAllMocks();

      // Filtered - should not cache
      const mockOrder2 = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const mockEq = jest.fn().mockReturnValue({
        order: mockOrder2,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: mockOrder2,
          eq: mockEq,
        }),
      });

      await getAdminUnits('PROVINCE');
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('getProvinces', () => {
    it('should fetch provinces (level=PROVINCE)', async () => {
      jest.clearAllMocks();

      // Mock no cache
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const mockProvinces = [
        { code: '01', name: 'Hà Nội', level: 'PROVINCE', parent_code: null, full_name: 'Thành phố Hà Nội', short_name: 'Hà Nội' },
      ];

      // Mock the query chain: from() → select() → order() → eq() → resolve
      const mockEq = jest.fn().mockResolvedValue({
        data: mockProvinces,
        error: null,
      });

      const mockOrder = jest.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: mockOrder,
        }),
      });

      const result = await getProvinces();

      expect(mockEq).toHaveBeenCalledWith('level', 'PROVINCE');
      expect(result[0].level).toBe('PROVINCE');
    });
  });

  describe('getDistricts', () => {
    it('should fetch districts for given province', async () => {
      jest.clearAllMocks();

      // Mock no cache
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const mockDistricts = [
        { code: '001', name: 'Ba Đình', level: 'DISTRICT', parent_code: '01', full_name: 'Quận Ba Đình', short_name: 'Ba Đình' },
      ];

      // Mock the query chain: from() → select() → order() → eq() → eq() → resolve
      const mockEq2 = jest.fn().mockResolvedValue({
        data: mockDistricts,
        error: null,
      });

      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockOrder = jest.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: mockOrder,
        }),
      });

      const result = await getDistricts('01');

      expect(mockEq1).toHaveBeenCalledWith('level', 'DISTRICT');
      expect(mockEq2).toHaveBeenCalledWith('parent_code', '01');
    });
  });

  describe('getWards', () => {
    it('should fetch wards for given district', async () => {
      jest.clearAllMocks();

      // Mock no cache
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const mockWards = [
        { code: '00001', name: 'Phúc Xá', level: 'WARD', parent_code: '001', full_name: 'Phường Phúc Xá', short_name: 'Phúc Xá' },
      ];

      // Mock the query chain: from() → select() → order() → eq() → eq() → resolve
      const mockEq2 = jest.fn().mockResolvedValue({
        data: mockWards,
        error: null,
      });

      const mockEq1 = jest.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockOrder = jest.fn().mockReturnValue({
        eq: mockEq1,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: mockOrder,
        }),
      });

      const result = await getWards('001');

      expect(mockEq1).toHaveBeenCalledWith('level', 'WARD');
      expect(mockEq2).toHaveBeenCalledWith('parent_code', '001');
    });
  });

  describe('getLandUseTypes', () => {
    it('should fetch land use types with is_active=true filter', async () => {
      const mockTypes = [
        { code: 'NNG.LUA', name_vi: 'Đất trồng lúa', description: 'Đất chuyên trồng lúa', category: 'agricultural', parent_code: 'NNG', is_active: true, sort_order: 101 },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const mockEq = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: mockTypes,
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      const result = await getLandUseTypes();

      expect(mockEq).toHaveBeenCalledWith('is_active', true);
      expect(result[0].code).toBe('NNG.LUA');
    });

    it('should filter by category', async () => {
      const mockTypes = [
        { code: 'NNG.LUA', name_vi: 'Đất trồng lúa', description: 'Đất chuyên trồng lúa', category: 'agricultural', parent_code: 'NNG', is_active: true, sort_order: 101 },
      ];

      const mockEq = jest.fn()
        .mockReturnValueOnce({ // First call for is_active
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockTypes,
              error: null,
            }),
          }),
        });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      const result = await getLandUseTypes('agricultural');

      expect(result[0].category).toBe('agricultural');
    });

    it('should use cached land use types when fresh', async () => {
      const cachedData = {
        data: [
          { code: 'NNG.LUA', nameVi: 'Đất trồng lúa', description: '', category: 'agricultural', parentCode: 'NNG', isActive: true, sortOrder: 101 },
        ],
        cachedAt: new Date().toISOString(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedData));

      const result = await getLandUseTypes();

      expect(result).toEqual(cachedData.data);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should return fallback data with official Vietnamese codes when fetch fails', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const mockEq = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Network error' },
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      const result = await getLandUseTypes();

      expect(result.length).toBeGreaterThan(0);
      // Check for official Vietnamese cadastral codes
      expect(result.some(type => type.code === 'NNG')).toBe(true);
      expect(result.some(type => type.code === 'PNN')).toBe(true);
      expect(result.some(type => type.code === 'CSD')).toBe(true);
      expect(result.some(type => type.code === 'NNG.LUA')).toBe(true);
    });
  });

  describe('getLandUseTypesByCategory', () => {
    it('should call getLandUseTypes with category filter', async () => {
      jest.clearAllMocks();

      // Mock no cache
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const mockTypes = [
        { code: 'PNN.DO.TT', name_vi: 'Đất ở tại đô thị', description: '', category: 'residential', parent_code: 'PNN.DO', is_active: true, sort_order: 211 },
      ];

      // Mock the query chain: from() → select() → eq('is_active') → order() → eq('category') → resolve
      const mockEq2 = jest.fn().mockResolvedValue({
        data: mockTypes,
        error: null,
      });

      const mockOrder = jest.fn().mockReturnValue({
        eq: mockEq2,
      });

      const mockEq1 = jest.fn().mockReturnValue({
        order: mockOrder,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: mockEq1,
        }),
      });

      const result = await getLandUseTypesByCategory('residential');

      expect(mockEq1).toHaveBeenCalledWith('is_active', true);
      expect(mockEq2).toHaveBeenCalledWith('category', 'residential');
      expect(result[0].category).toBe('residential');
    });
  });

  describe('getTopLevelLandUseCategories', () => {
    it('should return only types with no parent code', async () => {
      const mockTypes = [
        { code: 'NNG', name_vi: 'Đất nông nghiệp', description: '', category: 'agricultural', parent_code: null, is_active: true, sort_order: 100 },
        { code: 'NNG.LUA', name_vi: 'Đất trồng lúa', description: '', category: 'agricultural', parent_code: 'NNG', is_active: true, sort_order: 101 },
        { code: 'PNN', name_vi: 'Đất phi nông nghiệp', description: '', category: 'non-agricultural', parent_code: null, is_active: true, sort_order: 200 },
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const mockEq = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: mockTypes,
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: mockEq,
        }),
      });

      const result = await getTopLevelLandUseCategories();

      expect(result).toHaveLength(2);
      expect(result.every(type => type.parentCode === null)).toBe(true);
      expect(result[0].code).toBe('NNG');
      expect(result[1].code).toBe('PNN');
    });
  });

  describe('clearReferenceDataCache', () => {
    it('should clear all cached reference data', async () => {
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

      await clearReferenceDataCache();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@ref_object_types',
        '@ref_admin_units',
        '@ref_land_use_types',
      ]);
    });
  });
});
