
-- 1. Fix Security Definer View: Recreate partners_public with security_invoker=true
DROP VIEW IF EXISTS public.partners_public;

CREATE VIEW public.partners_public
WITH (security_invoker = true)
AS
SELECT id, name, description, website, logo_url, logo_emoji,
       categories, region, use_cases, featured, created_at, updated_at,
       usdc_score, networks
FROM public.partners
WHERE payment_status = 'completed';

-- 2. Update partners SELECT policy to allow public reads on completed partners
DROP POLICY IF EXISTS "Users can read own partner listings" ON public.partners;

CREATE POLICY "Public can read completed partners"
  ON public.partners FOR SELECT
  TO anon, authenticated
  USING (payment_status = 'completed');
