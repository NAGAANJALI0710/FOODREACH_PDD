-- ============================================================
-- Supabase SQL Migration: Fix donations_status_check Constraint
-- Run this in Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. Drop existing CHECK constraint if present
ALTER TABLE public.donations DROP CONSTRAINT IF EXISTS donations_status_check;

-- 2. Add updated CHECK constraint supporting complete donation lifecycle
ALTER TABLE public.donations ADD CONSTRAINT donations_status_check 
  CHECK (status IN (
    'Available',
    'Pending',
    'Accepted',
    'Pickup Started',
    'Assigned',
    'Picked Up',
    'Delivered',
    'Completed',
    'Cancelled'
  ));

-- 3. Set column default value to 'Available'
ALTER TABLE public.donations ALTER COLUMN status SET DEFAULT 'Available';
