-- ============================================================
-- FoodShare AI — Migration: Live Location Tracking on Donations Table
-- File: supabase/migrations/20260726000000_donations_live_tracking.sql
-- ============================================================

-- 1. Ensure driver location columns exist on public.donations
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS driver_latitude DOUBLE PRECISION;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS driver_longitude DOUBLE PRECISION;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS driver_last_updated TIMESTAMPTZ;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS driver_tracking_status TEXT DEFAULT 'Inactive';

-- 2. Enable Supabase Realtime for public.donations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'donations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
  END IF;
END $$;
