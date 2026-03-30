
-- 1. Fix storage: Drop inverted exclusion-based write policies
DROP POLICY IF EXISTS "No direct logo uploads" ON storage.objects;
DROP POLICY IF EXISTS "No direct logo updates" ON storage.objects;
DROP POLICY IF EXISTS "No direct logo deletes" ON storage.objects;

-- 2. Fix partners table: Add explicit deny policies for INSERT/UPDATE/DELETE
CREATE POLICY "No direct partner inserts"
  ON public.partners FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "No direct partner updates"
  ON public.partners FOR UPDATE
  TO anon, authenticated
  USING (false);

CREATE POLICY "No direct partner deletes"
  ON public.partners FOR DELETE
  TO anon, authenticated
  USING (false);

-- 3. Fix submissions: Remove open INSERT policy (all inserts go through edge functions with service role)
DROP POLICY IF EXISTS "Anyone can submit a listing" ON public.submissions;

-- Add explicit deny INSERT policy for submissions (service role bypasses RLS)
CREATE POLICY "No direct submission inserts"
  ON public.submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);
