import { supabase } from './supabase';
import {
  SurveyLocation,
  SurveyMission,
  SurveyMedia,
  SurveyVertex,
  SurveyNote,
  GPSLocation,
  gpsToGeographyPoint,
  verticesToPolygon,
} from '../types/survey';
import * as FileSystem from 'expo-file-system';

export const surveyService = {
  /**
   * Get all survey missions for current user
   */
  async getMissions(userId: string) {
    const { data, error } = await supabase
      .from('survey_missions')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map(mission => ({
      id: mission.id,
      code: mission.code,
      name: mission.name,
      description: mission.description,
      wardCode: mission.ward_code,
      districtCode: mission.district_code,
      provinceCode: mission.province_code,
      startDate: mission.start_date,
      endDate: mission.end_date,
      createdBy: mission.created_by,
      createdAt: mission.created_at,
      updatedAt: mission.updated_at,
    })) as SurveyMission[];
  },

  /**
   * Get survey locations for a mission
   */
  async getLocationsByMission(missionId: string) {
    const { data, error } = await supabase
      .from('survey_locations')
      .select('*')
      .eq('mission_id', missionId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map(location => this.mapLocationFromDb(location)) as SurveyLocation[];
  },

  /**
   * Get survey location by ID with related data
   */
  async getLocationById(locationId: string) {
    const { data, error } = await supabase
      .from('survey_locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (error) throw error;
    return this.mapLocationFromDb(data);
  },

  /**
   * Create a new survey location (draft)
   */
  async createLocation(location: Partial<SurveyLocation>, gps: GPSLocation) {
    const gpsPoint = gpsToGeographyPoint(gps);

    const { data, error } = await supabase
      .from('survey_locations')
      .insert({
        mission_id: location.missionId || null,
        created_by: location.createdBy!,
        assigned_to: location.assignedTo || null,
        province_code: location.provinceCode!,
        district_code: location.districtCode!,
        ward_code: location.wardCode!,
        temp_name: location.tempName || null,
        description: location.description || null,
        object_type_code: location.objectTypeCode || null,
        raw_address: location.rawAddress || null,
        house_number: location.houseNumber || null,
        street_name: location.streetName || null,
        gps_point: gpsPoint as any, // Supabase will handle PostGIS conversion
        gps_accuracy_m: gps.accuracy,
        gps_source: 'device',
        status: 'draft',
        client_local_id: location.clientLocalId || null,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapLocationFromDb(data);
  },

  /**
   * Update survey location
   */
  async updateLocation(locationId: string, updates: Partial<SurveyLocation>) {
    const updateData: any = {};

    if (updates.tempName !== undefined) updateData.temp_name = updates.tempName;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.objectTypeCode !== undefined) updateData.object_type_code = updates.objectTypeCode;
    if (updates.rawAddress !== undefined) updateData.raw_address = updates.rawAddress;
    if (updates.houseNumber !== undefined) updateData.house_number = updates.houseNumber;
    if (updates.streetName !== undefined) updateData.street_name = updates.streetName;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.roughArea !== undefined) {
      updateData.rough_area = updates.roughArea as any;
      updateData.has_rough_area = !!updates.roughArea;
    }

    if (updates.status === 'synced') {
      updateData.submitted_at = new Date().toISOString();
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('survey_locations')
      .update(updateData)
      .eq('id', locationId)
      .select()
      .single();

    if (error) throw error;
    return this.mapLocationFromDb(data);
  },

  /**
   * Submit survey location (change status to synced)
   */
  async submitLocation(locationId: string) {
    return this.updateLocation(locationId, {
      status: 'synced',
    });
  },

  /**
   * Upload media file to Supabase Storage
   */
  async uploadMedia(
    locationId: string,
    localUri: string,
    mediaType: 'photo' | 'video' | 'audio' | 'other' = 'photo'
  ): Promise<SurveyMedia> {
    // Generate unique file name
    const fileName = `${locationId}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const bucket = 'survey-media';

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to blob
    const response = await fetch(`data:image/jpeg;base64,${base64}`);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    const filePath = urlData.publicUrl;

    // Create media record
    const { data: mediaData, error: mediaError } = await supabase
      .from('survey_media')
      .insert({
        survey_location_id: locationId,
        media_type: mediaType,
        file_path: filePath,
        captured_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (mediaError) throw mediaError;

    return {
      id: mediaData.id,
      surveyLocationId: mediaData.survey_location_id,
      mediaType: mediaData.media_type,
      filePath: mediaData.file_path,
      thumbnailPath: mediaData.thumbnail_path,
      capturedAt: mediaData.captured_at,
      note: mediaData.note,
      gpsPoint: mediaData.gps_point,
      createdAt: mediaData.created_at,
    };
  },

  /**
   * Get media files for a location
   */
  async getLocationMedia(locationId: string) {
    const { data, error } = await supabase
      .from('survey_media')
      .select('*')
      .eq('survey_location_id', locationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data?.map(media => ({
      id: media.id,
      surveyLocationId: media.survey_location_id,
      mediaType: media.media_type,
      filePath: media.file_path,
      thumbnailPath: media.thumbnail_path,
      capturedAt: media.captured_at,
      note: media.note,
      gpsPoint: media.gps_point,
      createdAt: media.created_at,
    })) as SurveyMedia[];
  },

  /**
   * Save polygon vertices for a location
   */
  async saveVertices(locationId: string, vertices: Array<{ lat: number; lng: number }>) {
    // Delete existing vertices
    await supabase.from('survey_vertices').delete().eq('survey_location_id', locationId);

    // Insert new vertices
    const verticesData = vertices.map((v, index) => ({
      survey_location_id: locationId,
      seq: index + 1,
      lat: v.lat,
      lng: v.lng,
    }));

    const { error } = await supabase.from('survey_vertices').insert(verticesData);
    if (error) throw error;

    // Update location with polygon
    const polygon = verticesToPolygon(vertices);
    if (polygon) {
      await this.updateLocation(locationId, {
        roughArea: polygon,
        hasRoughArea: true,
      });
    }
  },

  /**
   * Get vertices for a location
   */
  async getVertices(locationId: string) {
    const { data, error } = await supabase
      .from('survey_vertices')
      .select('*')
      .eq('survey_location_id', locationId)
      .order('seq', { ascending: true });

    if (error) throw error;

    return data?.map(v => ({
      id: v.id,
      surveyLocationId: v.survey_location_id,
      seq: v.seq,
      lat: v.lat,
      lng: v.lng,
      createdAt: v.created_at,
    })) as SurveyVertex[];
  },

  /**
   * Helper: Map database location to SurveyLocation type
   */
  mapLocationFromDb(data: any): SurveyLocation {
    return {
      id: data.id,
      missionId: data.mission_id,
      createdBy: data.created_by,
      assignedTo: data.assigned_to,
      provinceCode: data.province_code,
      districtCode: data.district_code,
      wardCode: data.ward_code,
      tempName: data.temp_name,
      description: data.description,
      objectTypeCode: data.object_type_code,
      rawAddress: data.raw_address,
      houseNumber: data.house_number,
      streetName: data.street_name,
      gpsPoint: data.gps_point,
      gpsAccuracyM: data.gps_accuracy_m,
      gpsSource: data.gps_source,
      roughArea: data.rough_area,
      hasRoughArea: data.has_rough_area,
      status: data.status,
      submittedAt: data.submitted_at,
      acceptedAt: data.accepted_at,
      rejectedReason: data.rejected_reason,
      finalLocationId: data.final_location_id,
      clientLocalId: data.client_local_id,
      syncedAt: data.synced_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};

