
-- Fix: Make the view use invoker security so RLS of the querying user applies
CREATE OR REPLACE VIEW public.partners_public
WITH (security_invoker = true) AS
SELECT
  id, name, description, website, logo_url, logo_emoji,
  categories, region, use_cases, featured, created_at, updated_at,
  usdc_score, networks
FROM public.partners
WHERE payment_status = 'completed';
