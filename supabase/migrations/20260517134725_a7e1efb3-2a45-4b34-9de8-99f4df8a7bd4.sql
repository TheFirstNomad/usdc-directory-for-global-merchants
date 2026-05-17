CREATE OR REPLACE VIEW public.partners_public
WITH (security_invoker = false, security_barrier = true) AS
SELECT id, name, description, website, logo_url, logo_emoji, categories, region,
       use_cases, networks, usdc_score, featured, created_at, updated_at,
       boosted_until, verified
FROM public.partners
WHERE payment_status = ANY (ARRAY['confirmed'::text, 'finished'::text, 'sending'::text]);