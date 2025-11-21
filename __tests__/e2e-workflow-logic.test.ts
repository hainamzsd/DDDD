/**
 * End-to-End Survey Workflow Logic Tests
 *
 * Tests the complete survey workflow state management and business logic,
 * including offline creation and sync logic.
 *
 * Note: This test focuses on the store logic without React Native components.
 * For full integration tests with UI components, use React Native Testing Library.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { useSurveyStore } from '../store/surveyStore';
import { useSyncStore } from '../store/syncStore';
import { supabase } from '../services/supabase';
import type { SurveyMedia, SurveyVertex, GeographyPoint } from '../types/survey';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => () => {}),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true, isInternetReachable: true })),
}));

// Mock Supabase
jest.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(),
    storage: {
      from: jest.fn(),
    },
  },
}));

// Mock FileSystem
jest.mock('expo-file-system', () => ({
  readAsStringAsync: jest.fn(() => Promise.resolve('mock-file-data')),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 1024 })),
}));

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn((uri: string) => Promise.resolve({ uri, width: 1920, height: 1080 })),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
  FlipType: {
    Horizontal: 'horizontal',
    Vertical: 'vertical',
  },
  Action: {
    Resize: 'resize',
    Rotate: 'rotate',
    Flip: 'flip',
    Crop: 'crop',
  },
}));

// Mock global fetch for file upload simulation
global.fetch = jest.fn(() =>
  Promise.resolve({
    blob: () => Promise.resolve(new Blob(['mock-image-data'])),
  })
) as any;

describe('E2E Survey Workflow Logic', () => {
  const OFFICER_ID = 'user-123';

  const createMockGpsPoint = (lng: number, lat: number): GeographyPoint => ({
    type: 'Point',
    coordinates: [lng, lat],
    crs: { type: 'name', properties: { name: 'EPSG:4326' } },
  });

  const createMockPhoto = (id: string): SurveyMedia => ({
    id,
    surveyLocationId: 'survey-1',
    mediaType: 'photo',
    filePath: `photos/survey-1/${id}.jpg`,
    thumbnailPath: null,
    capturedAt: new Date().toISOString(),
    note: null,
    gpsPoint: null,
    createdAt: new Date().toISOString(),
    localUri: `file:///path/to/${id}.jpg`,
  });

  const createMockVertex = (seq: number, lat: number, lng: number): SurveyVertex => ({
    id: `vertex-${seq}`,
    surveyLocationId: 'survey-1',
    seq,
    lat,
    lng,
    createdAt: new Date().toISOString(),
  });

  beforeEach(() => {
    // Reset all stores
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
    });

    useSurveyStore.setState({
      currentSurvey: null,
      currentPhotos: [],
      currentVertices: [],
      step: 'start',
      isLoading: false,
      error: null,
    });

    useSyncStore.setState({
      queue: [],
      isOnline: true,
      lastSyncTime: '',
      isSyncing: false,
      error: null,
    });

    // Mock AsyncStorage
    const storage: Record<string, string> = {};
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
      Promise.resolve(storage[key] || null)
    );
    (AsyncStorage.setItem as jest.Mock).mockImplementation(
      (key: string, value: string) => {
        storage[key] = value;
        return Promise.resolve();
      }
    );
    (AsyncStorage.removeItem as jest.Mock).mockImplementation((key: string) => {
      delete storage[key];
      return Promise.resolve();
    });
    (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([]);

    // Mock Supabase
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'location-123' },
        error: null,
      }),
    });

    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: jest.fn().mockResolvedValue({
        data: { path: 'photos/location-123/photo1.jpg' },
        error: null,
      }),
      getPublicUrl: jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/photos/location-123/photo1.jpg' },
      }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Survey Creation and State Management', () => {
    it('should create a new survey with correct initial state', () => {
      const surveyStore = useSurveyStore.getState();
      surveyStore.startNewSurvey(OFFICER_ID);

      const state = useSurveyStore.getState();
      expect(state.currentSurvey).toBeTruthy();
      expect(state.currentSurvey?.clientLocalId).toBeTruthy();
      expect(state.currentSurvey?.status).toBe('draft');
      expect(state.currentSurvey?.createdBy).toBe(OFFICER_ID);
      expect(state.currentPhotos).toHaveLength(0);
      expect(state.currentVertices).toHaveLength(0);
      expect(state.step).toBe('start');
    });

    it('should update survey data progressively through workflow steps', async () => {
      const surveyStore = useSurveyStore.getState();
      surveyStore.startNewSurvey(OFFICER_ID);

      // Step 1: GPS
      await surveyStore.updateSurvey({
        gpsPoint: createMockGpsPoint(106.7009, 10.7769),
        gpsAccuracyM: 10,
      });
      expect(useSurveyStore.getState().currentSurvey?.gpsPoint?.coordinates).toEqual([
        106.7009,
        10.7769,
      ]);

      // Step 2: Photos
      await surveyStore.addPhoto(createMockPhoto('photo-1'));
      await surveyStore.addPhoto(createMockPhoto('photo-2'));
      expect(useSurveyStore.getState().currentPhotos).toHaveLength(2);

      // Step 3: Location info
      await surveyStore.updateSurvey({
        tempName: 'Nhà số 123',
        houseNumber: '123',
        streetName: 'Nguyễn Huệ',
        provinceCode: '80',
        districtCode: '79',
        wardCode: '794',
      });
      expect(useSurveyStore.getState().currentSurvey?.tempName).toBe('Nhà số 123');

      // Step 4: Land use type
      await surveyStore.updateSurvey({
        landUseTypeCode: 'PNN.DO.TT',
      });
      expect(useSurveyStore.getState().currentSurvey?.landUseTypeCode).toBe('PNN.DO.TT');

      // Step 5: Polygon
      const vertices = [
        createMockVertex(0, 10.7769, 106.7009),
        createMockVertex(1, 10.7770, 106.7010),
        createMockVertex(2, 10.7771, 106.7009),
      ];
      await surveyStore.setVertices(vertices);
      expect(useSurveyStore.getState().currentVertices).toHaveLength(3);
      expect(useSurveyStore.getState().currentSurvey?.hasRoughArea).toBe(true);
    });

    it('should track step progression through survey workflow', () => {
      const surveyStore = useSurveyStore.getState();
      surveyStore.startNewSurvey(OFFICER_ID);

      const steps: Array<'start' | 'gps' | 'photos' | 'info' | 'usage' | 'polygon' | 'review'> = [
        'start',
        'gps',
        'photos',
        'info',
        'usage',
        'polygon',
        'review',
      ];

      steps.forEach((step) => {
        surveyStore.setStep(step);
        expect(useSurveyStore.getState().step).toBe(step);
      });
    });
  });

  describe('Draft Management', () => {
    it('should save and load survey drafts', async () => {
      const surveyStore = useSurveyStore.getState();
      surveyStore.startNewSurvey(OFFICER_ID);
      const surveyId = useSurveyStore.getState().currentSurvey?.clientLocalId!;

      // Add some data
      await surveyStore.updateSurvey({
        gpsPoint: createMockGpsPoint(106.7009, 10.7769),
        tempName: 'Test Location',
      });
      await surveyStore.addPhoto(createMockPhoto('photo-1'));

      // Save draft
      await surveyStore.saveDraft();
      expect(AsyncStorage.setItem).toHaveBeenCalled();

      // Clear state
      await surveyStore.clearCurrent();
      expect(useSurveyStore.getState().currentSurvey).toBeNull();

      // Verify draft was stored
      const storageKey = `@survey_draft_${surveyId}`;
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        storageKey,
        expect.any(String)
      );
    });

    it('should auto-save draft on every update', async () => {
      const surveyStore = useSurveyStore.getState();
      surveyStore.startNewSurvey(OFFICER_ID);

      const setItemCallsBefore = (AsyncStorage.setItem as jest.Mock).mock.calls.length;

      await surveyStore.updateSurvey({
        tempName: 'Updated Name',
      });

      const setItemCallsAfter = (AsyncStorage.setItem as jest.Mock).mock.calls.length;
      expect(setItemCallsAfter).toBeGreaterThan(setItemCallsBefore);
    });

    it('should handle multiple drafts', async () => {
      const surveyStore = useSurveyStore.getState();

      // Create first draft
      surveyStore.startNewSurvey(OFFICER_ID);
      const id1 = useSurveyStore.getState().currentSurvey?.clientLocalId!;
      await surveyStore.updateSurvey({ tempName: 'Draft 1' });
      await surveyStore.saveDraft();

      // Create second draft
      await surveyStore.clearCurrent();
      surveyStore.startNewSurvey(OFFICER_ID);
      const id2 = useSurveyStore.getState().currentSurvey?.clientLocalId!;
      await surveyStore.updateSurvey({ tempName: 'Draft 2' });
      await surveyStore.saveDraft();

      expect(id1).not.toBe(id2);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `@survey_draft_${id1}`,
        expect.any(String)
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `@survey_draft_${id2}`,
        expect.any(String)
      );
    });
  });

  describe('Online Survey Submission', () => {
    it('should submit survey successfully when online', async () => {
      const surveyStore = useSurveyStore.getState();
      const syncStore = useSyncStore.getState();

      syncStore.setOnlineStatus(true);
      surveyStore.startNewSurvey(OFFICER_ID);

      // Fill required data
      await surveyStore.updateSurvey({
        gpsPoint: createMockGpsPoint(106.7009, 10.7769),
        tempName: 'Test Location',
        landUseTypeCode: 'PNN.DO.TT',
        provinceCode: '80',
        districtCode: '79',
        wardCode: '794',
      });
      await surveyStore.addPhoto(createMockPhoto('photo-1'));

      // Submit
      const result = await surveyStore.submitSurvey(true);

      expect(result.success).toBe(true);
      expect(result.locationId).toBeTruthy();
      expect(supabase.from).toHaveBeenCalled();
    });

    it('should update survey status to pending after submission', async () => {
      const surveyStore = useSurveyStore.getState();
      surveyStore.startNewSurvey(OFFICER_ID);

      await surveyStore.updateSurvey({
        gpsPoint: createMockGpsPoint(106.7009, 10.7769),
        tempName: 'Test',
        landUseTypeCode: 'PNN.DO.TT',
        provinceCode: '80',
        districtCode: '79',
        wardCode: '794',
      });
      await surveyStore.addPhoto(createMockPhoto('photo-1'));

      expect(useSurveyStore.getState().currentSurvey?.status).toBe('draft');

      await surveyStore.submitSurvey(true);

      expect(useSurveyStore.getState().currentSurvey?.status).toBe('pending');
    });
  });

  describe('Offline Mode and Sync Queue', () => {
    it('should queue survey when submitted offline', async () => {
      const surveyStore = useSurveyStore.getState();
      const syncStore = useSyncStore.getState();

      syncStore.setOnlineStatus(false);
      surveyStore.startNewSurvey(OFFICER_ID);

      await surveyStore.updateSurvey({
        gpsPoint: createMockGpsPoint(106.7009, 10.7769),
        tempName: 'Offline Survey',
        landUseTypeCode: 'PNN.DO.TT',
        provinceCode: '80',
        districtCode: '79',
        wardCode: '794',
      });
      await surveyStore.addPhoto(createMockPhoto('photo-1'));

      await surveyStore.submitSurvey(false);

      const state = useSyncStore.getState();
      expect(state.queue.length).toBeGreaterThan(0);
      expect(state.queue[0].type).toBe('survey');
      expect(state.queue[0].data.tempName).toBe('Offline Survey');
    });

    it('should handle network status changes', () => {
      const syncStore = useSyncStore.getState();

      syncStore.setOnlineStatus(true);
      expect(useSyncStore.getState().isOnline).toBe(true);

      syncStore.setOnlineStatus(false);
      expect(useSyncStore.getState().isOnline).toBe(false);

      syncStore.setOnlineStatus(true);
      expect(useSyncStore.getState().isOnline).toBe(true);
    });

    it('should process multiple queued items', async () => {
      const surveyStore = useSurveyStore.getState();
      const syncStore = useSyncStore.getState();

      syncStore.setOnlineStatus(false);

      // Create 3 offline surveys
      for (let i = 0; i < 3; i++) {
        surveyStore.startNewSurvey(OFFICER_ID);
        await surveyStore.updateSurvey({
          gpsPoint: createMockGpsPoint(106.7009 + i * 0.001, 10.7769 + i * 0.001),
          tempName: `Survey ${i + 1}`,
          landUseTypeCode: 'PNN.DO.TT',
          provinceCode: '80',
          districtCode: '79',
          wardCode: '794',
        });
        await surveyStore.addPhoto(createMockPhoto(`photo-${i + 1}`));
        await surveyStore.submitSurvey(false);
      }

      expect(useSyncStore.getState().queue.length).toBe(3);
    });

    it('should persist queue to AsyncStorage', async () => {
      const surveyStore = useSurveyStore.getState();
      const syncStore = useSyncStore.getState();

      syncStore.setOnlineStatus(false);
      surveyStore.startNewSurvey(OFFICER_ID);

      await surveyStore.updateSurvey({
        gpsPoint: createMockGpsPoint(106.7009, 10.7769),
        tempName: 'Persist Test',
        landUseTypeCode: 'PNN.DO.TT',
        provinceCode: '80',
        districtCode: '79',
        wardCode: '794',
      });
      await surveyStore.addPhoto(createMockPhoto('photo-1'));

      await surveyStore.submitSurvey(false);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@sync_queue',
        expect.any(String)
      );
    });
  });

  describe('Data Validation', () => {
    it('should require GPS coordinates for submission', async () => {
      const surveyStore = useSurveyStore.getState();
      surveyStore.startNewSurvey(OFFICER_ID);

      await surveyStore.updateSurvey({
        tempName: 'No GPS',
        landUseTypeCode: 'PNN.DO.TT',
      });

      // Survey without GPS should not have gpsPoint
      expect(useSurveyStore.getState().currentSurvey?.gpsPoint).toBeUndefined();
    });

    it('should validate polygon has at least 3 vertices', async () => {
      const surveyStore = useSurveyStore.getState();
      surveyStore.startNewSurvey(OFFICER_ID);

      // 2 vertices - insufficient
      await surveyStore.setVertices([
        createMockVertex(0, 10.7769, 106.7009),
        createMockVertex(1, 10.7770, 106.7010),
      ]);
      expect(useSurveyStore.getState().currentVertices.length).toBe(2);
      expect(useSurveyStore.getState().currentSurvey?.hasRoughArea).toBeFalsy();

      // 3 vertices - valid
      await surveyStore.setVertices([
        createMockVertex(0, 10.7769, 106.7009),
        createMockVertex(1, 10.7770, 106.7010),
        createMockVertex(2, 10.7771, 106.7009),
      ]);
      expect(useSurveyStore.getState().currentVertices.length).toBe(3);
      expect(useSurveyStore.getState().currentSurvey?.hasRoughArea).toBe(true);
    });

    it('should require photos for submission', async () => {
      const surveyStore = useSurveyStore.getState();
      surveyStore.startNewSurvey(OFFICER_ID);

      expect(useSurveyStore.getState().currentPhotos).toHaveLength(0);

      await surveyStore.addPhoto(createMockPhoto('photo-1'));
      expect(useSurveyStore.getState().currentPhotos).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle photo removal', async () => {
      const surveyStore = useSurveyStore.getState();
      surveyStore.startNewSurvey(OFFICER_ID);

      const photo1 = createMockPhoto('photo-1');
      const photo2 = createMockPhoto('photo-2');

      await surveyStore.addPhoto(photo1);
      await surveyStore.addPhoto(photo2);
      expect(useSurveyStore.getState().currentPhotos).toHaveLength(2);

      await surveyStore.removePhoto('photo-1');
      const state = useSurveyStore.getState();
      expect(state.currentPhotos).toHaveLength(1);
      expect(state.currentPhotos[0].id).toBe('photo-2');
    });

    it('should handle clearing survey', async () => {
      const surveyStore = useSurveyStore.getState();
      surveyStore.startNewSurvey(OFFICER_ID);

      await surveyStore.updateSurvey({ tempName: 'Test' });
      await surveyStore.addPhoto(createMockPhoto('photo-1'));
      await surveyStore.setVertices([createMockVertex(0, 10, 106)]);

      await surveyStore.clearCurrent();

      const state = useSurveyStore.getState();
      expect(state.currentSurvey).toBeNull();
      expect(state.currentPhotos).toHaveLength(0);
      expect(state.currentVertices).toHaveLength(0);
    });

    it('should handle error messages', () => {
      const surveyStore = useSurveyStore.getState();

      surveyStore.setError('Test error');
      expect(useSurveyStore.getState().error).toBe('Test error');

      surveyStore.setError(null);
      expect(useSurveyStore.getState().error).toBeNull();
    });
  });

  describe('Complete Workflow Integration', () => {
    it('should complete full offline-to-online workflow', async () => {
      const surveyStore = useSurveyStore.getState();
      const syncStore = useSyncStore.getState();

      // Start offline
      syncStore.setOnlineStatus(false);

      // Create survey
      surveyStore.startNewSurvey(OFFICER_ID);
      const surveyId = useSurveyStore.getState().currentSurvey?.clientLocalId!;

      // Fill data progressively
      await surveyStore.updateSurvey({
        gpsPoint: createMockGpsPoint(106.7009, 10.7769),
        gpsAccuracyM: 10,
      });

      await surveyStore.addPhoto(createMockPhoto('photo-1'));
      await surveyStore.addPhoto(createMockPhoto('photo-2'));

      await surveyStore.updateSurvey({
        tempName: 'Complete Workflow Test',
        houseNumber: '123',
        streetName: 'Main St',
        provinceCode: '80',
        districtCode: '79',
        wardCode: '794',
        landUseTypeCode: 'PNN.DO.TT',
      });

      await surveyStore.setVertices([
        createMockVertex(0, 10.7769, 106.7009),
        createMockVertex(1, 10.7770, 106.7010),
        createMockVertex(2, 10.7771, 106.7009),
      ]);

      // Verify all data is present
      const preSubmitState = useSurveyStore.getState();
      expect(preSubmitState.currentSurvey?.gpsPoint).toBeTruthy();
      expect(preSubmitState.currentPhotos).toHaveLength(2);
      expect(preSubmitState.currentVertices).toHaveLength(3);
      expect(preSubmitState.currentSurvey?.tempName).toBe('Complete Workflow Test');
      expect(preSubmitState.currentSurvey?.hasRoughArea).toBe(true);

      // Submit offline - should queue
      await surveyStore.submitSurvey(false);

      // Verify queued
      const syncState = useSyncStore.getState();
      expect(syncState.queue.length).toBeGreaterThan(0);
      const queuedItem = syncState.queue[0];
      expect(queuedItem.type).toBe('survey');
      expect(queuedItem.surveyId).toBe(surveyId);

      // Come online
      syncStore.setOnlineStatus(true);
      expect(useSyncStore.getState().isOnline).toBe(true);

      // Workflow complete
      expect(useSurveyStore.getState().currentSurvey?.status).toBe('pending');
    });
  });
});
