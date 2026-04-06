-- 1. Drop the problematic policy that allows direct table reads
DROP POLICY IF EXISTS "Allow row access for view reads" ON public.partners;

-- 2. Recreate the view as SECURITY DEFINER with payment_status filter
DROP VIEW IF EXISTS public.partners_public;
CREATE VIEW public.partners_public
WITH (security_barrier = true)
AS
SELECT id, name, description, website, logo_url, logo_emoji,
       categories, region, use_cases, networks, usdc_score,
       featured, created_at, updated_at
FROM public.partners
WHERE payment_status IN ('confirmed', 'finished', 'sending');

-- Make it owned by postgres (SECURITY DEFINER by default for views owned by superuser)
-- Explicitly ensure no security_invoker
ALTER VIEW public.partners_public SET (security_invoker = false);

-- 3. Revoke everything on the base table from client roles (ensure locked down)
REVOKE ALL ON public.partners FROM anon, authenticated;

-- 4. Grant SELECT on the view only
GRANT SELECT ON public.partners_public TO anon, authenticated;