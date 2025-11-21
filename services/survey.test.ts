/**
 * Integration tests for survey service
 * Tests Supabase database integration with mock responses
 */

import { surveyService } from './survey';
import { supabase } from './supabase';

// Mock the supabase client
jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(),
  EncodingType: {
    Base64: 'base64',
  },
}));

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

describe('surveyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLocationsByUser', () => {
    it('should fetch and map survey locations correctly', async () => {
      const mockDbLocations = [
        {
          id: 'loc-1',
          mission_id: 'mission-1',
          created_by: 'user-123',
          province_code: '01',
          district_code: '001',
          ward_code: '00001',
          temp_name: 'Nhà ông A',
          object_type_code: 'HOUSE',
          land_use_type_code: 'NNG.LUA',
          house_number: '123',
          street_name: 'Lê Lợi',
          gps_point: '{"type":"Point","coordinates":[105.8,21.0]}',
          gps_accuracy_m: 5.0,
          status: 'submitted',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockDbLocations,
                error: null,
              }),
            }),
          }),
        }),
      });

      const locations = await surveyService.getLocationsByUser('user-123');

      expect(supabase.from).toHaveBeenCalledWith('survey_locations');
      expect(locations).toHaveLength(1);
      expect(locations[0].id).toBe('loc-1');
      expect(locations[0].tempName).toBe('Nhà ông A');
      expect(locations[0].provinceCode).toBe('01');
    });

    it('should apply default limit of 100 results', async () => {
      const mockLimit = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: mockLimit,
            }),
          }),
        }),
      });

      await surveyService.getLocationsByUser('user-123');

      expect(mockLimit).toHaveBeenCalledWith(100);
    });

    it('should apply custom limit when provided', async () => {
      const mockLimit = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: mockLimit,
            }),
          }),
        }),
      });

      await surveyService.getLocationsByUser('user-123', 50);

      expect(mockLimit).toHaveBeenCalledWith(50);
    });

    it('should throw error if database query fails', async () => {
      const mockError = new Error('Database error');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: mockError,
              }),
            }),
          }),
        }),
      });

      await expect(surveyService.getLocationsByUser('user-123')).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getLocationById', () => {
    it('should fetch single location by ID', async () => {
      const mockDbLocation = {
        id: 'loc-1',
        mission_id: 'mission-1',
        created_by: 'user-123',
        province_code: '01',
        district_code: '001',
        ward_code: '00001',
        temp_name: 'Nhà ông A',
        status: 'draft',
        created_at: '2024-01-01T00:00:00Z',
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockDbLocation,
              error: null,
            }),
          }),
        }),
      });

      const location = await surveyService.getLocationById('loc-1');

      expect(location.id).toBe('loc-1');
      expect(location.tempName).toBe('Nhà ông A');
    });

    it('should throw error if location not found', async () => {
      const error = new Error('Location not found');
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: error,
            }),
          }),
        }),
      });

      await expect(surveyService.getLocationById('nonexistent')).rejects.toThrow(
        'Location not found'
      );
    });
  });

  describe('mapLocationFromDb', () => {
    it('should map snake_case database fields to camelCase', () => {
      const dbLocation = {
        id: 'loc-1',
        mission_id: 'mission-1',
        created_by: 'user-123',
        assigned_to: 'user-456',
        province_code: '01',
        district_code: '001',
        ward_code: '00001',
        temp_name: 'Test Location',
        description: 'Test description',
        object_type_code: 'HOUSE',
        land_use_type_code: 'NNG.LUA',
        raw_address: '123 Lê Lợi',
        house_number: '123',
        street_name: 'Lê Lợi',
        gps_accuracy_m: 5.0,
        gps_source: 'device',
        status: 'draft',
        client_local_id: 'local-1',
        submitted_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mapped = surveyService.mapLocationFromDb(dbLocation);

      expect(mapped.id).toBe('loc-1');
      expect(mapped.missionId).toBe('mission-1');
      expect(mapped.createdBy).toBe('user-123');
      expect(mapped.assignedTo).toBe('user-456');
      expect(mapped.provinceCode).toBe('01');
      expect(mapped.districtCode).toBe('001');
      expect(mapped.wardCode).toBe('00001');
      expect(mapped.tempName).toBe('Test Location');
      expect(mapped.description).toBe('Test description');
      expect(mapped.objectTypeCode).toBe('HOUSE');
      expect(mapped.landUseTypeCode).toBe('NNG.LUA');
      expect(mapped.rawAddress).toBe('123 Lê Lợi');
      expect(mapped.houseNumber).toBe('123');
      expect(mapped.streetName).toBe('Lê Lợi');
      expect(mapped.gpsAccuracyM).toBe(5.0);
      expect(mapped.gpsSource).toBe('device');
      expect(mapped.status).toBe('draft');
      expect(mapped.clientLocalId).toBe('local-1');
    });

    it('should handle null values correctly', () => {
      const dbLocation = {
        id: 'loc-1',
        province_code: '01',
        district_code: '001',
        ward_code: '00001',
        mission_id: null,
        assigned_to: null,
        temp_name: null,
        description: null,
        object_type_code: null,
        land_use_type_code: null,
        raw_address: null,
        house_number: null,
        street_name: null,
        gps_accuracy_m: null,
        status: 'draft',
        created_at: '2024-01-01T00:00:00Z',
      };

      const mapped = surveyService.mapLocationFromDb(dbLocation);

      expect(mapped.missionId).toBeNull();
      expect(mapped.assignedTo).toBeNull();
      expect(mapped.tempName).toBeNull();
      expect(mapped.description).toBeNull();
    });
  });

  describe('getMissions', () => {
    it('should fetch and map survey missions', async () => {
      const mockMissions = [
        {
          id: 'mission-1',
          code: 'M-2024-001',
          name: 'Khảo sát xã Test',
          description: 'Description',
          ward_code: '00001',
          district_code: '001',
          province_code: '01',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          created_by: 'user-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockMissions,
              error: null,
            }),
          }),
        }),
      });

      const missions = await surveyService.getMissions('user-123');

      expect(missions).toHaveLength(1);
      expect(missions[0].code).toBe('M-2024-001');
      expect(missions[0].wardCode).toBe('00001');
    });

    it('should throw error if query fails', async () => {
      const mockError = new Error('Database error');

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      await expect(surveyService.getMissions('user-123')).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getLocationsByMission', () => {
    it('should fetch locations for a specific mission', async () => {
      const mockDbLocations = [
        {
          id: 'loc-1',
          mission_id: 'mission-1',
          temp_name: 'Location 1',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'loc-2',
          mission_id: 'mission-1',
          temp_name: 'Location 2',
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockDbLocations,
              error: null,
            }),
          }),
        }),
      });

      const locations = await surveyService.getLocationsByMission('mission-1');

      expect(locations).toHaveLength(2);
      expect(locations[0].missionId).toBe('mission-1');
      expect(locations[1].missionId).toBe('mission-1');
    });
  });
});
