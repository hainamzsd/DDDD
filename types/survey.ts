import { GeographyPoint, GeometryPolygon, SurveyStatus, MediaType } from './database';

// Re-export database types for convenience
export type { SurveyStatus, MediaType, GeographyPoint, GeometryPolygon };

// Profile types
export interface Profile {
  id: string;
  idNumber: string;
  fullName: string;
  phoneNumber: string | null;
  email: string | null;
  role: 'officer' | 'leader' | 'admin';
  unitCode: string;
  wardCode: string;
  districtCode: string;
  provinceCode: string;
  createdAt: string;
  updatedAt: string;
}

// Survey Mission types
export interface SurveyMission {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  wardCode: string;
  districtCode: string;
  provinceCode: string;
  startDate: string | null;
  endDate: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// Survey Location types
export interface SurveyLocation {
  id: string;
  missionId: string | null;
  createdBy: string;
  assignedTo: string | null;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  tempName: string | null;
  description: string | null;
  objectTypeCode: string | null;
  rawAddress: string | null;
  houseNumber: string | null;
  streetName: string | null;
  gpsPoint: GeographyPoint | null;
  gpsAccuracyM: number | null;
  gpsSource: string | null;
  roughArea: GeometryPolygon | null;
  hasRoughArea: boolean;
  status: SurveyStatus;
  submittedAt: string | null;
  acceptedAt: string | null;
  rejectedReason: string | null;
  finalLocationId: string | null;
  clientLocalId: string | null;
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Survey Media types
export interface SurveyMedia {
  id: string;
  surveyLocationId: string;
  mediaType: MediaType;
  filePath: string;
  thumbnailPath: string | null;
  capturedAt: string | null;
  note: string | null;
  gpsPoint: GeographyPoint | null;
  createdAt: string;
  localUri?: string; // For offline storage before upload
}

// Survey Vertices types (for polygon points)
export interface SurveyVertex {
  id: string;
  surveyLocationId: string;
  seq: number;
  lat: number;
  lng: number;
  createdAt: string;
}

// Survey Notes types
export interface SurveyNote {
  id: string;
  surveyLocationId: string;
  authorId: string;
  noteType: string | null;
  content: string;
  createdAt: string;
}

// Sync Events types
export interface SyncEvent {
  id: string;
  profileId: string;
  deviceId: string | null;
  eventType: string;
  payload: Record<string, any> | null;
  createdAt: string;
}

// Reference types
export interface ObjectType {
  code: string;
  nameVi: string;
  description: string | null;
  groupCode: string | null;
  sortOrder: number;
}

export interface AdminUnit {
  code: string;
  name: string;
  level: 'PROVINCE' | 'DISTRICT' | 'WARD';
  parentCode: string | null;
  fullName: string | null;
  shortName: string | null;
}

// Draft types for local storage
export interface SurveyDraft {
  location: Partial<SurveyLocation>;
  photos: SurveyMedia[];
  vertices: SurveyVertex[];
  notes: SurveyNote[];
  isOffline: boolean;
  lastSaved: string;
}

// GPS Location helper
export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  timestamp: number;
}

// Helper function to convert GPSLocation to GeographyPoint
export function gpsToGeographyPoint(gps: GPSLocation): GeographyPoint {
  return {
    type: 'Point',
    coordinates: [gps.longitude, gps.latitude], // GeoJSON format: [lng, lat]
    crs: {
      type: 'name',
      properties: { name: 'EPSG:4326' },
    },
  };
}

// Helper function to convert array of vertices to GeometryPolygon
export function verticesToPolygon(vertices: Array<{ lat: number; lng: number }>): GeometryPolygon | null {
  if (vertices.length < 3) return null;

  // Close the polygon by adding the first point at the end
  const coordinates = [
    [...vertices.map(v => [v.lng, v.lat]), [vertices[0].lng, vertices[0].lat]],
  ];

  return {
    type: 'Polygon',
    coordinates,
    crs: {
      type: 'name',
      properties: { name: 'EPSG:4326' },
    },
  };
}

