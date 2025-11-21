-- ============================================================================
-- LocationID Tracker (C06) - Supabase Database Schema
-- ============================================================================
-- This SQL script sets up the complete database schema for the LocationID
-- Tracker mobile application.
--
-- Run this in your Supabase SQL Editor:
-- 1. Go to https://app.supabase.com
-- 2. Select your project
-- 3. Navigate to SQL Editor
-- 4. Copy and paste this entire file
-- 5. Click "Run"
-- ============================================================================

-- Enable PostGIS extension for geographic data
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Stores officer profiles linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  role TEXT DEFAULT 'officer' CHECK (role IN ('officer', 'leader', 'admin')),
  unit_code TEXT,
  ward_code TEXT NOT NULL,
  district_code TEXT NOT NULL,
  province_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- SURVEY MISSIONS TABLE
-- ============================================================================
-- Stores survey campaigns/missions
CREATE TABLE IF NOT EXISTS public.survey_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  ward_code TEXT NOT NULL,
  district_code TEXT NOT NULL,
  province_code TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for survey missions
ALTER TABLE public.survey_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officers can view missions in their area"
  ON public.survey_missions FOR SELECT
  USING (
    ward_code = (SELECT ward_code FROM public.profiles WHERE id = auth.uid())
    OR district_code = (SELECT district_code FROM public.profiles WHERE id = auth.uid())
    OR province_code = (SELECT province_code FROM public.profiles WHERE id = auth.uid())
  );

-- ============================================================================
-- SURVEY LOCATIONS TABLE
-- ============================================================================
-- Stores individual survey records
CREATE TABLE IF NOT EXISTS public.survey_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID REFERENCES public.survey_missions(id),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),

  -- Administrative codes
  province_code TEXT NOT NULL,
  district_code TEXT NOT NULL,
  ward_code TEXT NOT NULL,

  -- Location identification (per Circular 02/2015/TT-BTNMT)
  location_identifier TEXT UNIQUE, -- Format: PP-DD-CC-NNNNNN (auto-generated)
  temp_name TEXT,
  description TEXT,
  object_type_code TEXT,
  land_use_type_code TEXT, -- Official code from ref_land_use_types (e.g., 'NNG.LUA', 'PNN.DO.TT')
  raw_address TEXT,
  house_number TEXT,
  street_name TEXT,
  hamlet_village TEXT, -- Thôn/Ấp/Bản/Xóm

  -- Optional cadastral fields (per Decree 43/2014/NĐ-CP)
  land_plot_area_m2 REAL, -- Diện tích thửa đất (m²)
  building_area_m2 REAL, -- Diện tích xây dựng (m²)
  land_use_certificate_number TEXT, -- Số giấy chứng nhận QSDĐ

  -- Owner/Representative information (optional but recommended)
  owner_name TEXT,
  owner_id_number TEXT, -- CCCD/CMND (9 or 12 digits)
  owner_phone TEXT,
  representative_name TEXT,
  survey_notes TEXT,

  -- GPS data (using PostGIS GEOGRAPHY type for accurate distance calculations)
  gps_point GEOGRAPHY(Point, 4326),
  gps_accuracy_m REAL,
  gps_source TEXT,

  -- Polygon boundary (using GEOMETRY for polygon operations)
  rough_area GEOMETRY(Polygon, 4326),
  has_rough_area BOOLEAN DEFAULT FALSE,

  -- Status tracking
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'submitted', 'accepted', 'rejected')),
  submitted_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_reason TEXT,

  -- Integration
  final_location_id TEXT,
  client_local_id TEXT,
  synced_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_survey_locations_created_by ON public.survey_locations(created_by);
CREATE INDEX IF NOT EXISTS idx_survey_locations_mission ON public.survey_locations(mission_id);
CREATE INDEX IF NOT EXISTS idx_survey_locations_status ON public.survey_locations(status);
CREATE INDEX IF NOT EXISTS idx_survey_locations_ward ON public.survey_locations(ward_code);
CREATE INDEX IF NOT EXISTS idx_survey_locations_location_id ON public.survey_locations(location_identifier);
CREATE INDEX IF NOT EXISTS idx_survey_locations_land_use ON public.survey_locations(land_use_type_code);
CREATE INDEX IF NOT EXISTS idx_survey_locations_gps ON public.survey_locations USING GIST(gps_point);
CREATE INDEX IF NOT EXISTS idx_survey_locations_area ON public.survey_locations USING GIST(rough_area);

-- RLS for survey locations
ALTER TABLE public.survey_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officers can view own surveys"
  ON public.survey_locations FOR SELECT
  USING (created_by = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "Officers can insert own surveys"
  ON public.survey_locations FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Officers can update own surveys"
  ON public.survey_locations FOR UPDATE
  USING (created_by = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "Officers can delete own draft surveys"
  ON public.survey_locations FOR DELETE
  USING (created_by = auth.uid() AND status = 'draft');

-- ============================================================================
-- SURVEY MEDIA TABLE
-- ============================================================================
-- Stores photos and videos for surveys
CREATE TABLE IF NOT EXISTS public.survey_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_location_id UUID NOT NULL REFERENCES public.survey_locations(id) ON DELETE CASCADE,
  media_type TEXT DEFAULT 'photo' CHECK (media_type IN ('photo', 'video', 'audio', 'other')),
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  captured_at TIMESTAMPTZ,
  note TEXT,
  gps_point GEOGRAPHY(Point, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_survey_media_location ON public.survey_media(survey_location_id);

-- RLS for survey media
ALTER TABLE public.survey_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officers can view media for their surveys"
  ON public.survey_media FOR SELECT
  USING (
    survey_location_id IN (
      SELECT id FROM public.survey_locations
      WHERE created_by = auth.uid() OR assigned_to = auth.uid()
    )
  );

CREATE POLICY "Officers can insert media for their surveys"
  ON public.survey_media FOR INSERT
  WITH CHECK (
    survey_location_id IN (
      SELECT id FROM public.survey_locations WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Officers can delete media for their surveys"
  ON public.survey_media FOR DELETE
  USING (
    survey_location_id IN (
      SELECT id FROM public.survey_locations WHERE created_by = auth.uid()
    )
  );

-- ============================================================================
-- SURVEY VERTICES TABLE
-- ============================================================================
-- Stores polygon vertices for rough area boundaries
CREATE TABLE IF NOT EXISTS public.survey_vertices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_location_id UUID NOT NULL REFERENCES public.survey_locations(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(survey_location_id, seq)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_survey_vertices_location ON public.survey_vertices(survey_location_id);

-- RLS for survey vertices
ALTER TABLE public.survey_vertices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officers can view vertices for their surveys"
  ON public.survey_vertices FOR SELECT
  USING (
    survey_location_id IN (
      SELECT id FROM public.survey_locations
      WHERE created_by = auth.uid() OR assigned_to = auth.uid()
    )
  );

CREATE POLICY "Officers can insert vertices for their surveys"
  ON public.survey_vertices FOR INSERT
  WITH CHECK (
    survey_location_id IN (
      SELECT id FROM public.survey_locations WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Officers can delete vertices for their surveys"
  ON public.survey_vertices FOR DELETE
  USING (
    survey_location_id IN (
      SELECT id FROM public.survey_locations WHERE created_by = auth.uid()
    )
  );

-- ============================================================================
-- SURVEY NOTES TABLE
-- ============================================================================
-- Stores notes and comments for surveys
CREATE TABLE IF NOT EXISTS public.survey_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_location_id UUID NOT NULL REFERENCES public.survey_locations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  note_type TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_survey_notes_location ON public.survey_notes(survey_location_id);

-- RLS for survey notes
ALTER TABLE public.survey_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officers can view notes for their surveys"
  ON public.survey_notes FOR SELECT
  USING (
    survey_location_id IN (
      SELECT id FROM public.survey_locations
      WHERE created_by = auth.uid() OR assigned_to = auth.uid()
    )
  );

CREATE POLICY "Officers can insert notes for their surveys"
  ON public.survey_notes FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- ============================================================================
-- REFERENCE TABLE: OBJECT TYPES
-- ============================================================================
-- Reference data for location object types
CREATE TABLE IF NOT EXISTS public.ref_object_types (
  code TEXT PRIMARY KEY,
  name_vi TEXT NOT NULL,
  description TEXT,
  group_code TEXT,
  sort_order INTEGER DEFAULT 0
);

-- Make reference tables public readable
ALTER TABLE public.ref_object_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view object types"
  ON public.ref_object_types FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- REFERENCE TABLE: ADMINISTRATIVE UNITS
-- ============================================================================
-- Vietnamese administrative units (provinces, districts, wards)
CREATE TABLE IF NOT EXISTS public.ref_admin_units (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('PROVINCE', 'DISTRICT', 'WARD')),
  parent_code TEXT,
  full_name TEXT,
  short_name TEXT
);

-- Index for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_admin_units_parent ON public.ref_admin_units(parent_code);
CREATE INDEX IF NOT EXISTS idx_admin_units_level ON public.ref_admin_units(level);

-- Make reference tables public readable
ALTER TABLE public.ref_admin_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view admin units"
  ON public.ref_admin_units FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- REFERENCE TABLE: LAND USE TYPES (CADASTRAL CATEGORIES)
-- ============================================================================
-- Vietnamese land use and cadastral categories per current regulations:
-- - Land Law 2013 (Law No. 45/2013/QH13)
-- - Decree 43/2014/NĐ-CP
-- - Circular 02/2015/TT-BTNMT
--
-- IMPORTANT: Use official Vietnamese cadastral codes (not simplified codes):
--   ✅ CORRECT: 'NNG.LUA', 'PNN.DO.TT', 'PNN.SXKD.CN', etc.
--   ❌ WRONG:   'RES', 'COM', 'IND', 'AGR', etc.
--
-- Seed data: supabase/seed-land-use-types-official.sql
-- Documentation: docs/CADASTRAL_REGULATIONS.md
--
CREATE TABLE IF NOT EXISTS public.ref_land_use_types (
  code TEXT PRIMARY KEY, -- Official codes: NNG.*, PNN.*, CSD.*
  name_vi TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., 'agricultural', 'residential', 'commercial', 'public', 'non-agricultural', 'unused'
  parent_code TEXT, -- For hierarchical categories (e.g., 'PNN.DO.TT' has parent 'PNN.DO')
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_land_use_parent ON public.ref_land_use_types(parent_code);
CREATE INDEX IF NOT EXISTS idx_land_use_category ON public.ref_land_use_types(category);

-- Make reference tables public readable
ALTER TABLE public.ref_land_use_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view land use types"
  ON public.ref_land_use_types FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- SYNC EVENTS TABLE
-- ============================================================================
-- Track synchronization events for debugging
CREATE TABLE IF NOT EXISTS public.sync_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id),
  device_id TEXT,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_sync_events_profile ON public.sync_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_created ON public.sync_events(created_at);

-- RLS for sync events
ALTER TABLE public.sync_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Officers can view own sync events"
  ON public.sync_events FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Officers can insert own sync events"
  ON public.sync_events FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate location_identifier
-- Format: PP-DD-CC-NNNNNN (e.g., 01-01-01-000123)
-- Per Circular 02/2015/TT-BTNMT
CREATE OR REPLACE FUNCTION generate_location_identifier()
RETURNS TRIGGER AS $$
DECLARE
  next_seq INTEGER;
  location_code TEXT;
BEGIN
  -- Only generate if not already set
  IF NEW.location_identifier IS NULL THEN
    -- Get the next sequence number for this ward
    SELECT COALESCE(MAX(
      CAST(SUBSTRING(location_identifier FROM 10 FOR 6) AS INTEGER)
    ), 0) + 1
    INTO next_seq
    FROM public.survey_locations
    WHERE ward_code = NEW.ward_code;

    -- Format: PP-DD-CC-NNNNNN
    location_code := NEW.province_code || '-' ||
                     NEW.district_code || '-' ||
                     NEW.ward_code || '-' ||
                     LPAD(next_seq::TEXT, 6, '0');

    NEW.location_identifier := location_code;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_missions_updated_at BEFORE UPDATE ON public.survey_missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_survey_locations_updated_at BEFORE UPDATE ON public.survey_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for auto-generating location_identifier
CREATE TRIGGER generate_location_identifier_trigger BEFORE INSERT ON public.survey_locations
  FOR EACH ROW EXECUTE FUNCTION generate_location_identifier();

-- ============================================================================
-- STORAGE BUCKETS (Run this in Supabase Dashboard > Storage)
-- ============================================================================
-- Note: Run these commands in the Supabase Dashboard or via the API
--
-- 1. Create bucket:
--    Name: survey-photos
--    Public: false
--    File size limit: 10 MB
--    Allowed MIME types: image/jpeg, image/png, image/jpg
--
-- 2. RLS policies for storage (run in SQL Editor):
/*
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'survey-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own files
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'survey-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'survey-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
*/

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ LocationID Tracker database schema created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run the seed data script (seed.sql)';
  RAISE NOTICE '2. Create storage bucket "survey-photos" in Supabase Dashboard';
  RAISE NOTICE '3. Create a test user in Authentication';
  RAISE NOTICE '4. Generate TypeScript types';
  RAISE NOTICE '';
END $$;
