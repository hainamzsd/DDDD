-- ============================================================================
-- Migration: Add Cadastral Versions Tracking
-- ============================================================================
-- This migration adds support for tracking cadastral data versions and updates
-- Enables periodic updates of land use types and other reference data
-- ============================================================================

-- Create cadastral versions table
CREATE TABLE IF NOT EXISTS public.ref_cadastral_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  release_date DATE NOT NULL,
  description TEXT NOT NULL,
  source TEXT NOT NULL, -- e.g., "Bộ Tài nguyên và Môi trường", "MONRE", URL
  change_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on version and release_date for fast queries
CREATE INDEX IF NOT EXISTS idx_cadastral_versions_version
  ON public.ref_cadastral_versions(version);

CREATE INDEX IF NOT EXISTS idx_cadastral_versions_release_date
  ON public.ref_cadastral_versions(release_date DESC);

-- Add version column to ref_land_use_types
ALTER TABLE public.ref_land_use_types
  ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0.0';

-- Create index on version for land use types
CREATE INDEX IF NOT EXISTS idx_land_use_types_version
  ON public.ref_land_use_types(version);

-- RLS for cadastral versions (read-only for all authenticated users)
ALTER TABLE public.ref_cadastral_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cadastral versions"
  ON public.ref_cadastral_versions FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify (handled by service role in backend)
CREATE POLICY "Only service role can modify cadastral versions"
  ON public.ref_cadastral_versions FOR ALL
  TO service_role
  USING (true);

-- Insert initial version record
INSERT INTO public.ref_cadastral_versions (
  version,
  release_date,
  description,
  source,
  change_count,
  notes
) VALUES (
  '1.0.0',
  '2024-01-15',
  'Phiên bản ban đầu - Danh mục loại đất theo Luật Đất đai 2013 và Nghị định 43/2014/NĐ-CP',
  'Bộ Tài nguyên và Môi trường - Thông tư 02/2015/TT-BTNMT',
  47,
  'Bao gồm 47 loại đất chính: Nông nghiệp (NNG.*), Phi nông nghiệp (PNN.*), Chưa sử dụng (CSD.*)'
) ON CONFLICT (version) DO NOTHING;

-- Update existing land use types to version 1.0.0
UPDATE public.ref_land_use_types
SET version = '1.0.0'
WHERE version IS NULL OR version = '';

-- Add comment to table
COMMENT ON TABLE public.ref_cadastral_versions IS 'Theo dõi các phiên bản cập nhật danh mục địa chính từ các nguồn chính thức';
COMMENT ON COLUMN public.ref_cadastral_versions.version IS 'Số phiên bản (semantic versioning: MAJOR.MINOR.PATCH)';
COMMENT ON COLUMN public.ref_cadastral_versions.release_date IS 'Ngày phát hành phiên bản';
COMMENT ON COLUMN public.ref_cadastral_versions.source IS 'Nguồn dữ liệu chính thức (Bộ, Sở, hoặc URL)';
COMMENT ON COLUMN public.ref_cadastral_versions.change_count IS 'Số lượng thay đổi trong phiên bản này';

-- ============================================================================
-- Sample data: Add a newer version (for testing update mechanism)
-- ============================================================================
-- Uncomment below to test the update mechanism

/*
INSERT INTO public.ref_cadastral_versions (
  version,
  release_date,
  description,
  source,
  change_count,
  notes
) VALUES (
  '1.1.0',
  '2024-06-01',
  'Cập nhật bổ sung loại đất theo Nghị định XX/2024/NĐ-CP',
  'Bộ Tài nguyên và Môi trường',
  5,
  'Thêm 5 loại đất mới: Đất rừng đặc dụng, Đất năng lượng tái tạo, v.v.'
) ON CONFLICT (version) DO NOTHING;
*/
