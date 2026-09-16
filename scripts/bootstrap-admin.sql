-- Run manually in Supabase SQL Editor after the chosen account has verified
-- its email and signed into the app once. Copy its Auth UUID below.
-- This script only bootstraps the FIRST administrator. Afterwards use /admin/users.
DO $$
DECLARE
  target_id uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  PERFORM pg_advisory_xact_lock(73191, 1);
  IF target_id = '00000000-0000-0000-0000-000000000000' THEN
    RAISE EXCEPTION 'Replace target_id with the verified Auth user UUID first.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE role = 'ADMIN') THEN
    RAISE EXCEPTION 'An administrator already exists; use /admin/users.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_id AND email_confirmed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Target Auth account is missing or unconfirmed.';
  END IF;
  UPDATE public.profiles SET role = 'ADMIN', updated_at = now() WHERE id = target_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile missing; sign into the application once first.';
  END IF;
END $$;
