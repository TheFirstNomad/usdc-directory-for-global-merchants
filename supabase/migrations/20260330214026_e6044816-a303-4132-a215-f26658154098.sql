
-- Recreate partners_public as security definer view (intentional - hides sensitive columns)
DROP VIEW IF EXISTS public.partners_public;

CREATE VIEW public.partners_public
WITH (security_invoker = false)
AS
SELECT id, name, description, website, logo_url, logo_emoji,
       categories, region, use_cases, featured, created_at, updated_at,
       usdc_score, networks
FROM public.partners
WHERE payment_status = 'completed';
