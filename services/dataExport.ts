import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { surveyService } from './survey';
import { useSyncStore } from '../store/syncStore';
import { getAllDrafts } from '../store/surveyStore';

export interface ExportData {
  exportDate: string;
  appVersion: string;
  userId: string;
  syncedSurveys: any[];
  pendingSurveys: any[];
  drafts: any[];
  syncQueue: any[];
  metadata: {
    totalSurveys: number;
    syncedCount: number;
    pendingCount: number;
    draftCount: number;
    queueCount: number;
  };
}

export const dataExportService = {
  /**
   * Export all survey data to JSON file
   */
  async exportAllData(userId: string): Promise<string> {
    try {
      // Gather all data
      const syncedSurveys = await surveyService.getLocationsByUser(userId);
      const { queue } = useSyncStore.getState();
      const draftIds = await getAllDrafts();
      const drafts = draftIds; // Just store the draft IDs for now

      // Extract pending surveys from sync queue
      const pendingSurveys = queue.map((item) => ({
        id: item.id,
        type: item.type,
        surveyId: item.surveyId,
        data: item.data,
        retryCount: item.retryCount,
        maxRetries: item.maxRetries,
        lastAttempt: item.lastAttempt,
        error: item.error,
        createdAt: item.createdAt,
      }));

      // Create export data structure
      const exportData: ExportData = {
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0',
        userId,
        syncedSurveys,
        pendingSurveys,
        drafts,
        syncQueue: queue,
        metadata: {
          totalSurveys: syncedSurveys.length + pendingSurveys.length,
          syncedCount: syncedSurveys.length,
          pendingCount: pendingSurveys.length,
          draftCount: drafts.length,
          queueCount: queue.length,
        },
      };

      // Create filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/:/g, '-')
        .replace(/\./g, '-')
        .substring(0, 19);
      const fileName = `LocationID_Backup_${timestamp}.json`;
      const file = new File(Paths.document, fileName);

      // Write to file
      await file.create();
      await file.write(JSON.stringify(exportData, null, 2));

      return file.uri;
    } catch (error) {
      console.error('Export error:', error);
      throw new Error('Không thể xuất dữ liệu. Vui lòng thử lại.');
    }
  },

  /**
   * Share exported file
   */
  async shareExportFile(filePath: string): Promise<void> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Tính năng chia sẻ không khả dụng trên thiết bị này.');
      }

      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Chia sẻ file sao lưu dữ liệu',
        UTI: 'public.json',
      });
    } catch (error) {
      console.error('Share error:', error);
      throw new Error('Không thể chia sẻ file. Vui lòng thử lại.');
    }
  },

  /**
   * Get export file info
   */
  async getExportFileInfo(filePath: string) {
    try {
      const file = new File(filePath);

      // Check if file exists
      if (!file.exists) {
        return null;
      }

      return {
        exists: file.exists,
        uri: file.uri,
        name: file.name,
        size: file.size,
        extension: file.extension,
        md5: file.md5,
      };
    } catch (error) {
      console.error('Get file info error:', error);
      return null;
    }
  },

  /**
   * Delete export file
   */
  async deleteExportFile(filePath: string): Promise<void> {
    try {
      const file = new File(filePath);

      // Check if file exists before attempting to delete
      if (!file.exists) {
        console.warn('File does not exist:', filePath);
        return;
      }

      // Delete the file
      file.delete();
      console.log('File deleted successfully:', filePath);
    } catch (error) {
      console.error('Delete file error:', error);
      throw new Error('Không thể xóa file. Vui lòng thử lại.');
    }
  },

  /**
   * List all export files in document directory
   */
  async listExportFiles(): Promise<string[]> {
    try {
      const files = await Paths.document.list();
      return files
        .filter((file) => file instanceof File && file.name.startsWith('LocationID_Backup_') && file.name.endsWith('.json'))
        .map((file) => file.uri);
    } catch (error) {
      console.error('List files error:', error);
      return [];
    }
  },
};
