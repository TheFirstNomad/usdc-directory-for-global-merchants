
-- 1. Create a public view for partners that excludes sensitive columns
CREATE OR REPLACE VIEW public.partners_public AS
SELECT
  id, name, description, website, logo_url, logo_emoji,
  categories, region, use_cases, featured, created_at, updated_at,
  usdc_score, networks
FROM public.partners
WHERE payment_status = 'completed';

-- 2. Enable RLS on submissions table
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 3. Allow anyone to INSERT submissions (public form)
CREATE POLICY "Anyone can submit a listing"
ON public.submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 4. Restrict SELECT on submissions — no public reads
CREATE POLICY "Only service role can read submissions"
ON public.submissions
FOR SELECT
TO authenticated
USING (false);

-- 5. Restrict the logos storage bucket — remove the overly permissive policy if it exists
DROP POLICY IF EXISTS "Anyone can upload logos" ON storage.objects;

-- 6. Create a restrictive upload policy (only via edge function with service role)
-- No direct client uploads allowed
