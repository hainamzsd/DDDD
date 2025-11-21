/**
 * Survey Store - Manages current survey in progress
 * Uses Zustand for state management
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SurveyLocation, SurveyMedia, SurveyVertex } from '../types/survey';

interface SurveyState {
  // Current survey being edited
  currentSurvey: Partial<SurveyLocation> | null;
  currentPhotos: SurveyMedia[];
  currentVertices: SurveyVertex[];

  // Survey flow state
  step: 'start' | 'gps' | 'photos' | 'info' | 'polygon' | 'review';
  isLoading: boolean;
  error: string | null;

  // Actions
  startNewSurvey: (officerId: string) => void;
  updateSurvey: (updates: Partial<SurveyLocation>) => Promise<void>;
  addPhoto: (photo: SurveyMedia) => Promise<void>;
  removePhoto: (photoId: string) => Promise<void>;
  setVertices: (vertices: SurveyVertex[]) => Promise<void>;
  setStep: (step: SurveyState['step']) => void;
  saveDraft: () => Promise<void>;
  loadDraft: (surveyId: string) => Promise<void>;
  clearCurrent: () => Promise<void>;
  setError: (error: string | null) => void;
}

const DRAFT_STORAGE_PREFIX = '@survey_draft_';

export const useSurveyStore = create<SurveyState>((set, get) => ({
  // Initial state
  currentSurvey: null,
  currentPhotos: [],
  currentVertices: [],
  step: 'start',
  isLoading: false,
  error: null,

  // Start a new survey
  startNewSurvey: (officerId: string) => {
    const surveyId = `draft_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const newSurvey: Partial<SurveyLocation> = {
      clientLocalId: surveyId,
      createdBy: officerId,
      status: 'draft',
      hasRoughArea: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set({
      currentSurvey: newSurvey,
      currentPhotos: [],
      currentVertices: [],
      step: 'start',
      error: null,
    });

    console.log('[SurveyStore] Started new survey:', surveyId);
  },

  // Update current survey
  updateSurvey: async (updates: Partial<SurveyLocation>) => {
    const { currentSurvey } = get();
    if (!currentSurvey) {
      throw new Error('No active survey');
    }

    const updatedSurvey = {
      ...currentSurvey,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    set({ currentSurvey: updatedSurvey });
    await get().saveDraft();

    console.log('[SurveyStore] Updated survey:', updatedSurvey.clientLocalId);
  },

  // Add photo to current survey
  addPhoto: async (photo: SurveyMedia) => {
    const { currentPhotos } = get();
    const updatedPhotos = [...currentPhotos, photo];

    set({ currentPhotos: updatedPhotos });
    await get().saveDraft();

    console.log('[SurveyStore] Added photo:', photo.id);
  },

  // Remove photo from current survey
  removePhoto: async (photoId: string) => {
    const { currentPhotos } = get();
    const updatedPhotos = currentPhotos.filter((p) => p.id !== photoId);

    set({ currentPhotos: updatedPhotos });
    await get().saveDraft();

    console.log('[SurveyStore] Removed photo:', photoId);
  },

  // Set polygon vertices
  setVertices: async (vertices: SurveyVertex[]) => {
    set({ currentVertices: vertices });
    await get().saveDraft();

    // Update survey to indicate it has a rough area
    if (vertices.length >= 3) {
      await get().updateSurvey({ hasRoughArea: true });
    }

    console.log('[SurveyStore] Set vertices:', vertices.length);
  },

  // Set current step in survey flow
  setStep: (step: SurveyState['step']) => {
    set({ step });
    console.log('[SurveyStore] Changed step:', step);
  },

  // Save draft to AsyncStorage
  saveDraft: async () => {
    const { currentSurvey, currentPhotos, currentVertices } = get();
    if (!currentSurvey?.clientLocalId) {
      console.warn('[SurveyStore] Cannot save draft: no survey ID');
      return;
    }

    const draft = {
      survey: currentSurvey,
      photos: currentPhotos,
      vertices: currentVertices,
      savedAt: new Date().toISOString(),
    };

    const key = `${DRAFT_STORAGE_PREFIX}${currentSurvey.clientLocalId}`;
    await AsyncStorage.setItem(key, JSON.stringify(draft));

    console.log('[SurveyStore] Saved draft:', currentSurvey.clientLocalId);
  },

  // Load draft from AsyncStorage
  loadDraft: async (surveyId: string) => {
    set({ isLoading: true, error: null });

    try {
      const key = `${DRAFT_STORAGE_PREFIX}${surveyId}`;
      const draftJson = await AsyncStorage.getItem(key);

      if (!draftJson) {
        throw new Error('Draft not found');
      }

      const draft = JSON.parse(draftJson);

      set({
        currentSurvey: draft.survey,
        currentPhotos: draft.photos || [],
        currentVertices: draft.vertices || [],
        isLoading: false,
      });

      console.log('[SurveyStore] Loaded draft:', surveyId);
    } catch (error: any) {
      console.error('[SurveyStore] Failed to load draft:', error);
      set({
        error: error.message || 'Failed to load draft',
        isLoading: false,
      });
    }
  },

  // Clear current survey
  clearCurrent: async () => {
    const { currentSurvey } = get();

    // Optionally delete the draft from storage
    if (currentSurvey?.clientLocalId) {
      const key = `${DRAFT_STORAGE_PREFIX}${currentSurvey.clientLocalId}`;
      await AsyncStorage.removeItem(key);
      console.log('[SurveyStore] Deleted draft:', currentSurvey.clientLocalId);
    }

    set({
      currentSurvey: null,
      currentPhotos: [],
      currentVertices: [],
      step: 'start',
      error: null,
    });

    console.log('[SurveyStore] Cleared current survey');
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },
}));

// Helper function to get all drafts
export const getAllDrafts = async (): Promise<string[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const draftKeys = keys.filter((key) => key.startsWith(DRAFT_STORAGE_PREFIX));
    return draftKeys.map((key) => key.replace(DRAFT_STORAGE_PREFIX, ''));
  } catch (error) {
    console.error('[SurveyStore] Failed to get all drafts:', error);
    return [];
  }
};

// Helper function to delete a draft
export const deleteDraft = async (surveyId: string): Promise<void> => {
  const key = `${DRAFT_STORAGE_PREFIX}${surveyId}`;
  await AsyncStorage.removeItem(key);
  console.log('[SurveyStore] Deleted draft:', surveyId);
};
