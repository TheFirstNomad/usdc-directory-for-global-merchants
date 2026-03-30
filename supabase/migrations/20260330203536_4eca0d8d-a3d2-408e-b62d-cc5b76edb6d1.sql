DROP VIEW IF EXISTS partners_public;
CREATE OR REPLACE VIEW partners_public WITH (security_invoker = false) AS
SELECT id, name, description, website, logo_url, logo_emoji, categories, region, use_cases, featured, created_at, updated_at, usdc_score, networks
FROM partners
WHERE payment_status = 'completed';

ALTER VIEW partners_public OWNER TO postgres;
GRANT SELECT ON partners_public TO anon, authenticated;