// PostGIS Geography/Geometry types
export type GeographyPoint = {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  crs?: { type: 'name'; properties: { name: string } };
};

export type GeometryPolygon = {
  type: 'Polygon';
  coordinates: number[][][]; // Array of linear rings, each ring is [lng, lat] pairs
  crs?: { type: 'name'; properties: { name: string } };
};

// Enums
export type SurveyStatus = 'draft' | 'pending' | 'submitted' | 'accepted' | 'rejected';
export type MediaType = 'photo' | 'video' | 'audio' | 'other';
export type UserRole = 'officer' | 'leader' | 'admin';
export type AdminLevel = 'PROVINCE' | 'DISTRICT' | 'WARD';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone_number: string | null;
          email: string | null;
          role: UserRole;
          unit_code: string;
          ward_code: string;
          district_code: string;
          province_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone_number?: string | null;
          email?: string | null;
          role?: UserRole;
          unit_code: string;
          ward_code: string;
          district_code: string;
          province_code: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone_number?: string | null;
          email?: string | null;
          role?: UserRole;
          unit_code?: string;
          ward_code?: string;
          district_code?: string;
          province_code?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      survey_missions: {
        Row: {
          id: string;
          code: string | null;
          name: string;
          description: string | null;
          ward_code: string;
          district_code: string;
          province_code: string;
          start_date: string | null;
          end_date: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code?: string | null;
          name: string;
          description?: string | null;
          ward_code: string;
          district_code: string;
          province_code: string;
          start_date?: string | null;
          end_date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string | null;
          name?: string;
          description?: string | null;
          ward_code?: string;
          district_code?: string;
          province_code?: string;
          start_date?: string | null;
          end_date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      survey_locations: {
        Row: {
          id: string;
          mission_id: string | null;
          created_by: string;
          assigned_to: string | null;
          province_code: string;
          district_code: string;
          ward_code: string;
          temp_name: string | null;
          description: string | null;
          object_type_code: string | null;
          raw_address: string | null;
          house_number: string | null;
          street_name: string | null;
          gps_point: GeographyPoint | null;
          gps_accuracy_m: number | null;
          gps_source: string | null;
          rough_area: GeometryPolygon | null;
          has_rough_area: boolean;
          status: SurveyStatus;
          submitted_at: string | null;
          accepted_at: string | null;
          rejected_reason: string | null;
          final_location_id: string | null;
          client_local_id: string | null;
          synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mission_id?: string | null;
          created_by: string;
          assigned_to?: string | null;
          province_code: string;
          district_code: string;
          ward_code: string;
          temp_name?: string | null;
          description?: string | null;
          object_type_code?: string | null;
          raw_address?: string | null;
          house_number?: string | null;
          street_name?: string | null;
          gps_point?: GeographyPoint | null;
          gps_accuracy_m?: number | null;
          gps_source?: string | null;
          rough_area?: GeometryPolygon | null;
          has_rough_area?: boolean;
          status?: SurveyStatus;
          submitted_at?: string | null;
          accepted_at?: string | null;
          rejected_reason?: string | null;
          final_location_id?: string | null;
          client_local_id?: string | null;
          synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mission_id?: string | null;
          created_by?: string;
          assigned_to?: string | null;
          province_code?: string;
          district_code?: string;
          ward_code?: string;
          temp_name?: string | null;
          description?: string | null;
          object_type_code?: string | null;
          raw_address?: string | null;
          house_number?: string | null;
          street_name?: string | null;
          gps_point?: GeographyPoint | null;
          gps_accuracy_m?: number | null;
          gps_source?: string | null;
          rough_area?: GeometryPolygon | null;
          has_rough_area?: boolean;
          status?: SurveyStatus;
          submitted_at?: string | null;
          accepted_at?: string | null;
          rejected_reason?: string | null;
          final_location_id?: string | null;
          client_local_id?: string | null;
          synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      survey_media: {
        Row: {
          id: string;
          survey_location_id: string;
          media_type: MediaType;
          file_path: string;
          thumbnail_path: string | null;
          captured_at: string | null;
          note: string | null;
          gps_point: GeographyPoint | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          survey_location_id: string;
          media_type: MediaType;
          file_path: string;
          thumbnail_path?: string | null;
          captured_at?: string | null;
          note?: string | null;
          gps_point?: GeographyPoint | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          survey_location_id?: string;
          media_type?: MediaType;
          file_path?: string;
          thumbnail_path?: string | null;
          captured_at?: string | null;
          note?: string | null;
          gps_point?: GeographyPoint | null;
          created_at?: string;
        };
      };
      survey_vertices: {
        Row: {
          id: string;
          survey_location_id: string;
          seq: number;
          lat: number;
          lng: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          survey_location_id: string;
          seq: number;
          lat: number;
          lng: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          survey_location_id?: string;
          seq?: number;
          lat?: number;
          lng?: number;
          created_at?: string;
        };
      };
      survey_notes: {
        Row: {
          id: string;
          survey_location_id: string;
          author_id: string;
          note_type: string | null;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          survey_location_id: string;
          author_id: string;
          note_type?: string | null;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          survey_location_id?: string;
          author_id?: string;
          note_type?: string | null;
          content?: string;
          created_at?: string;
        };
      };
      sync_events: {
        Row: {
          id: string;
          profile_id: string;
          device_id: string | null;
          event_type: string;
          payload: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          device_id?: string | null;
          event_type: string;
          payload?: Record<string, any> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          device_id?: string | null;
          event_type?: string;
          payload?: Record<string, any> | null;
          created_at?: string;
        };
      };
      ref_object_types: {
        Row: {
          code: string;
          name_vi: string;
          description: string | null;
          group_code: string | null;
          sort_order: number;
        };
        Insert: {
          code: string;
          name_vi: string;
          description?: string | null;
          group_code?: string | null;
          sort_order?: number;
        };
        Update: {
          code?: string;
          name_vi?: string;
          description?: string | null;
          group_code?: string | null;
          sort_order?: number;
        };
      };
      ref_admin_units: {
        Row: {
          code: string;
          name: string;
          level: AdminLevel;
          parent_code: string | null;
          full_name: string | null;
          short_name: string | null;
        };
        Insert: {
          code: string;
          name: string;
          level: AdminLevel;
          parent_code?: string | null;
          full_name?: string | null;
          short_name?: string | null;
        };
        Update: {
          code?: string;
          name?: string;
          level?: AdminLevel;
          parent_code?: string | null;
          full_name?: string | null;
          short_name?: string | null;
        };
      };
    };
    Enums: {
      survey_status: SurveyStatus;
      media_type: MediaType;
    };
  };
}

