/**
 * Cadastral Data Update Service
 *
 * Handles periodic updates of Vietnamese cadastral categories (land use types)
 * from official sources with versioning and change tracking.
 *
 * Regulatory compliance:
 * - Land Law 2013 (Luật Đất đai 2013)
 * - Decree 43/2014/NĐ-CP
 * - Circular 02/2015/TT-BTNMT
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { LandUseType } from '../types/survey';
import type { Database } from '../types/database';

const LAST_UPDATE_CHECK_KEY = '@cadastral_last_update_check';
const CURRENT_VERSION_KEY = '@cadastral_data_version';
const UPDATE_CHECK_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export interface CadastralVersion {
  version: string;
  releaseDate: string;
  description: string;
  source: string;
  changeCount: number;
}

export interface UpdateResult {
  success: boolean;
  previousVersion?: string;
  newVersion?: string;
  changesApplied: number;
  message: string;
  errors?: string[];
}

/**
 * Check if it's time to check for cadastral data updates
 * Based on UPDATE_CHECK_INTERVAL (default: 7 days)
 */
export async function shouldCheckForUpdates(): Promise<boolean> {
  try {
    const lastCheckStr = await AsyncStorage.getItem(LAST_UPDATE_CHECK_KEY);

    if (!lastCheckStr) {
      return true; // Never checked before
    }

    const lastCheck = parseInt(lastCheckStr, 10);
    const now = Date.now();

    return (now - lastCheck) >= UPDATE_CHECK_INTERVAL;
  } catch (error) {
    console.error('Error checking update schedule:', error);
    return false;
  }
}

/**
 * Get the current cadastral data version
 */
export async function getCurrentVersion(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CURRENT_VERSION_KEY);
  } catch (error) {
    console.error('Error getting current version:', error);
    return null;
  }
}

/**
 * Check for available cadastral data updates
 * Returns null if no update available, or version info if update exists
 */
export async function checkForUpdates(): Promise<CadastralVersion | null> {
  try {
    // Update last check timestamp
    await AsyncStorage.setItem(LAST_UPDATE_CHECK_KEY, Date.now().toString());

    // Query the cadastral_versions table for latest version
    const { data, error } = await supabase
      .from('ref_cadastral_versions')
      .select('*')
      .order('release_date', { ascending: false })
      .limit(1)
      .single() as { data: Database['public']['Tables']['ref_cadastral_versions']['Row'] | null; error: any };

    if (error) {
      console.error('Error checking for updates:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Check if this version is newer than current
    const currentVersion = await getCurrentVersion();

    if (!currentVersion || data.version !== currentVersion) {
      return {
        version: data.version,
        releaseDate: data.release_date,
        description: data.description,
        source: data.source,
        changeCount: data.change_count || 0,
      };
    }

    return null; // Already on latest version
  } catch (error) {
    console.error('Error checking for updates:', error);
    return null;
  }
}

/**
 * Apply cadastral data update
 * Downloads and replaces land use types with new version
 */
export async function applyUpdate(version: CadastralVersion): Promise<UpdateResult> {
  const errors: string[] = [];

  try {
    const previousVersion = await getCurrentVersion();

    // Fetch updated land use types for this version
    const { data: landUseTypes, error: fetchError } = await supabase
      .from('ref_land_use_types')
      .select('*')
      .eq('version', version.version);

    if (fetchError) {
      errors.push(`Lỗi tải dữ liệu: ${fetchError.message}`);
      return {
        success: false,
        message: 'Không thể tải dữ liệu cập nhật từ server',
        changesApplied: 0,
        errors,
      };
    }

    if (!landUseTypes || landUseTypes.length === 0) {
      return {
        success: false,
        message: 'Không tìm thấy dữ liệu cho phiên bản này',
        changesApplied: 0,
      };
    }

    // Cache the updated land use types locally
    const cacheData = {
      version: version.version,
      timestamp: Date.now(),
      data: landUseTypes,
    };

    await AsyncStorage.setItem('@land_use_types_cache', JSON.stringify(cacheData));

    // Update current version
    await AsyncStorage.setItem(CURRENT_VERSION_KEY, version.version);

    // Update last check timestamp
    await AsyncStorage.setItem(LAST_UPDATE_CHECK_KEY, Date.now().toString());

    return {
      success: true,
      previousVersion: previousVersion || 'Không có',
      newVersion: version.version,
      changesApplied: landUseTypes.length,
      message: `Cập nhật thành công ${landUseTypes.length} danh mục đất`,
    };
  } catch (error) {
    console.error('Error applying update:', error);
    errors.push(error instanceof Error ? error.message : 'Lỗi không xác định');

    return {
      success: false,
      message: 'Có lỗi xảy ra khi áp dụng cập nhật',
      changesApplied: 0,
      errors,
    };
  }
}

/**
 * Get update history
 * Returns list of all cadastral data versions
 */
export async function getUpdateHistory(): Promise<CadastralVersion[]> {
  try {
    const { data, error } = await supabase
      .from('ref_cadastral_versions')
      .select('*')
      .order('release_date', { ascending: false }) as { data: Database['public']['Tables']['ref_cadastral_versions']['Row'][] | null; error: any };

    if (error) {
      console.error('Error fetching update history:', error);
      return [];
    }

    return (data || []).map(v => ({
      version: v.version,
      releaseDate: v.release_date,
      description: v.description,
      source: v.source,
      changeCount: v.change_count || 0,
    }));
  } catch (error) {
    console.error('Error getting update history:', error);
    return [];
  }
}

/**
 * Force an immediate update check
 * Returns update info if available
 */
export async function forceUpdateCheck(): Promise<CadastralVersion | null> {
  // Clear last check timestamp to force a check
  await AsyncStorage.removeItem(LAST_UPDATE_CHECK_KEY);
  return checkForUpdates();
}

/**
 * Get last update check timestamp
 */
export async function getLastUpdateCheck(): Promise<Date | null> {
  try {
    const lastCheckStr = await AsyncStorage.getItem(LAST_UPDATE_CHECK_KEY);
    if (!lastCheckStr) return null;

    return new Date(parseInt(lastCheckStr, 10));
  } catch (error) {
    console.error('Error getting last update check:', error);
    return null;
  }
}
