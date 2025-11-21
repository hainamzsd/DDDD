/**
 * Sync Store - Manages offline queue and data synchronization
 * Uses Zustand for state management
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../services/supabase';
import * as FileSystem from 'expo-file-system';

interface SyncQueueItem {
  id: string;
  type: 'survey' | 'media' | 'vertices';
  surveyId: string;
  data: any;
  retryCount: number;
  maxRetries: number;
  lastAttempt?: string;
  error?: string;
  createdAt: string;
}

interface SyncState {
  // State
  queue: SyncQueueItem[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime?: string;
  error: string | null;

  // Actions
  addToQueue: (item: Omit<SyncQueueItem, 'id' | 'retryCount' | 'createdAt'>) => Promise<void>;
  removeFromQueue: (id: string) => Promise<void>;
  updateQueueItem: (id: string, updates: Partial<SyncQueueItem>) => Promise<void>;
  loadQueue: () => Promise<void>;
  sync: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
  clearError: () => void;
  getPendingCount: () => number;
}

const QUEUE_STORAGE_KEY = '@sync_queue';
const MAX_RETRIES = 5;

export const useSyncStore = create<SyncState>((set, get) => ({
  // Initial state
  queue: [],
  isOnline: true,
  isSyncing: false,
  lastSyncTime: undefined,
  error: null,

  // Add item to sync queue
  addToQueue: async (item) => {
    const newItem: SyncQueueItem = {
      ...item,
      id: `${item.type}_${item.surveyId}_${Date.now()}`,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    const updatedQueue = [...get().queue, newItem];
    set({ queue: updatedQueue });

    // Persist to AsyncStorage
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));

    console.log('[SyncStore] Added to queue:', newItem.id);

    // Trigger sync if online
    if (get().isOnline) {
      get().sync();
    }
  },

  // Remove item from queue
  removeFromQueue: async (id) => {
    const updatedQueue = get().queue.filter((item) => item.id !== id);
    set({ queue: updatedQueue });

    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));

    console.log('[SyncStore] Removed from queue:', id);
  },

  // Update queue item
  updateQueueItem: async (id, updates) => {
    const updatedQueue = get().queue.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    set({ queue: updatedQueue });

    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));
  },

  // Load queue from AsyncStorage
  loadQueue: async () => {
    try {
      const queueJson = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (queueJson) {
        const queue = JSON.parse(queueJson);
        set({ queue });
        console.log('[SyncStore] Loaded queue from storage:', queue.length, 'items');
      }
    } catch (error) {
      console.error('[SyncStore] Failed to load queue:', error);
    }
  },

  // Main sync function
  sync: async () => {
    const { queue, isSyncing, isOnline } = get();

    if (isSyncing) {
      console.log('[SyncStore] Sync already in progress');
      return;
    }

    if (!isOnline) {
      console.log('[SyncStore] Cannot sync: offline');
      return;
    }

    if (queue.length === 0) {
      console.log('[SyncStore] Nothing to sync');
      return;
    }

    set({ isSyncing: true, error: null });
    console.log('[SyncStore] Starting sync...', queue.length, 'items');

    try {
      // Process queue items in order
      for (const item of queue) {
        // Skip items that have exceeded max retries
        if (item.retryCount >= item.maxRetries) {
          console.warn('[SyncStore] Item exceeded max retries:', item.id);
          await get().updateQueueItem(item.id, {
            error: 'Exceeded maximum retry attempts',
          });
          continue;
        }

        try {
          await get().syncItem(item);
          await get().removeFromQueue(item.id);
          console.log('[SyncStore] Successfully synced:', item.id);
        } catch (error: any) {
          console.error('[SyncStore] Failed to sync item:', item.id, error);

          // Check if it's a network error
          if (error.message?.includes('network') || error.message?.includes('offline')) {
            console.log('[SyncStore] Network error, stopping sync');
            break; // Stop processing queue
          }

          // Update retry count
          await get().updateQueueItem(item.id, {
            retryCount: item.retryCount + 1,
            lastAttempt: new Date().toISOString(),
            error: error.message || 'Unknown error',
          });
        }
      }

      set({
        lastSyncTime: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('[SyncStore] Sync error:', error);
      set({ error: error.message || 'Sync failed' });
    } finally {
      set({ isSyncing: false });
      console.log('[SyncStore] Sync completed');
    }
  },

  // Sync individual item
  syncItem: async (item: SyncQueueItem) => {
    console.log('[SyncStore] Syncing item:', item.type, item.id);

    switch (item.type) {
      case 'survey':
        await get().syncSurvey(item.data);
        break;
      case 'media':
        await get().syncMedia(item.data);
        break;
      case 'vertices':
        await get().syncVertices(item.data);
        break;
      default:
        throw new Error(`Unknown sync type: ${item.type}`);
    }
  },

  // Sync survey data
  syncSurvey: async (surveyData: any) => {
    const { data, error } = await supabase
      .from('survey_locations')
      .insert({
        client_local_id: surveyData.id,
        created_by: surveyData.createdBy,
        province_code: surveyData.provinceCode,
        district_code: surveyData.districtCode,
        ward_code: surveyData.wardCode,
        temp_name: surveyData.tempName,
        description: surveyData.description,
        object_type_code: surveyData.objectTypeCode,
        raw_address: surveyData.rawAddress,
        gps_point: surveyData.gpsPoint,
        gps_accuracy_m: surveyData.gpsAccuracyM,
        status: surveyData.status || 'draft',
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('No data returned from survey insert');

    console.log('[SyncStore] Survey synced:', (data as any).id);
    return data;
  },

  // Sync media files
  syncMedia: async (mediaData: any) => {
    const { localUri, surveyLocationId, mediaType, capturedAt, gpsPoint } = mediaData;

    // Upload file to Supabase Storage
    const fileName = `${surveyLocationId}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

    // Read file
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (!fileInfo.exists) {
      throw new Error('File not found');
    }

    // Convert file to blob
    const response = await fetch(localUri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('survey-photos')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Insert media record
    const { data, error } = await supabase
      .from('survey_media')
      .insert({
        survey_location_id: surveyLocationId,
        media_type: mediaType || 'photo',
        file_path: fileName,
        captured_at: capturedAt,
        gps_point: gpsPoint,
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('No data returned from media insert');

    console.log('[SyncStore] Media synced:', (data as any).id);
    return data;
  },

  // Sync polygon vertices
  syncVertices: async (verticesData: any) => {
    const { surveyLocationId, vertices } = verticesData;

    const insertData = vertices.map((vertex: any, index: number) => ({
      survey_location_id: surveyLocationId,
      seq: index,
      lat: vertex.lat,
      lng: vertex.lng,
    }));

    const { data, error } = await supabase
      .from('survey_vertices')
      .insert(insertData)
      .select();

    if (error) throw error;
    if (!data) throw new Error('No data returned from vertices insert');

    console.log('[SyncStore] Vertices synced:', (data as any[]).length, 'points');
    return data;
  },

  // Set online status
  setOnlineStatus: (isOnline) => {
    set({ isOnline });

    // Trigger sync when coming online
    if (isOnline && get().queue.length > 0 && !get().isSyncing) {
      console.log('[SyncStore] Back online, triggering sync');
      get().sync();
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Get pending count
  getPendingCount: () => {
    return get().queue.length;
  },
}));

// Initialize network listener
let netInfoUnsubscribe: (() => void) | null = null;

export const initializeSyncStore = async () => {
  const store = useSyncStore.getState();

  // Load queue from storage
  await store.loadQueue();

  // Set up network listener
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
  }

  netInfoUnsubscribe = NetInfo.addEventListener((state) => {
    const isOnline = state.isConnected ?? false;
    console.log('[SyncStore] Network status:', isOnline ? 'online' : 'offline');
    store.setOnlineStatus(isOnline);
  });

  // Get initial network status
  const state = await NetInfo.fetch();
  store.setOnlineStatus(state.isConnected ?? false);

  console.log('[SyncStore] Initialized');
};

// Cleanup function
export const cleanupSyncStore = () => {
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
    netInfoUnsubscribe = null;
  }
};
