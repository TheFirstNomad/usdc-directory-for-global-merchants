-- Revoke ALL privileges on partners from client roles first
REVOKE ALL ON public.partners FROM anon, authenticated;

-- Grant SELECT only on safe columns
GRANT SELECT (id, name, description, website, logo_url, logo_emoji, categories, region, use_cases, networks, usdc_score, featured, created_at, updated_at) ON public.partners TO anon, authenticated;