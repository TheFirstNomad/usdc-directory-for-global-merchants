
-- Phase A.1: Recreate partners_public WITHOUT SECURITY DEFINER (use security_invoker)
DROP VIEW IF EXISTS public.partners_public;
CREATE VIEW public.partners_public
WITH (security_invoker = true)
AS
SELECT
  id, name, description, website, logo_url, logo_emoji,
  categories, region, use_cases, networks, usdc_score,
  featured, created_at, updated_at, boosted_until, verified
FROM public.partners
WHERE payment_status = ANY (ARRAY['confirmed','finished','sending']);

GRANT SELECT ON public.partners_public TO anon, authenticated;

-- Need an RLS policy on partners that lets the view's underlying SELECT pass through for public rows
CREATE POLICY "Public can read confirmed partners"
ON public.partners
FOR SELECT
TO anon, authenticated
USING (payment_status = ANY (ARRAY['confirmed','finished','sending']));

-- Phase A.3: x402 nonce replay-cache table
CREATE TABLE IF NOT EXISTS public.x402_nonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chain text NOT NULL,
  nonce text NOT NULL,
  payer text,
  endpoint text,
  amount_usdc bigint NOT NULL,
  tx_hash text,
  settled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS x402_nonces_chain_nonce_uidx ON public.x402_nonces(chain, nonce);
CREATE INDEX IF NOT EXISTS x402_nonces_created_at_idx ON public.x402_nonces(created_at DESC);

ALTER TABLE public.x402_nonces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No client reads x402_nonces" ON public.x402_nonces FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "No client inserts x402_nonces" ON public.x402_nonces FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client updates x402_nonces" ON public.x402_nonces FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No client deletes x402_nonces" ON public.x402_nonces FOR DELETE TO anon, authenticated USING (false);

-- Phase A.3b: Rate-limit window table
CREATE TABLE IF NOT EXISTS public.agent_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_key text NOT NULL,
  endpoint text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_rate_limits_bucket_idx ON public.agent_rate_limits(bucket_key, endpoint, created_at DESC);

ALTER TABLE public.agent_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No client reads agent_rate_limits" ON public.agent_rate_limits FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "No client inserts agent_rate_limits" ON public.agent_rate_limits FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client updates agent_rate_limits" ON public.agent_rate_limits FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No client deletes agent_rate_limits" ON public.agent_rate_limits FOR DELETE TO anon, authenticated USING (false);

-- Phase A.4: Performance indexes
CREATE INDEX IF NOT EXISTS agent_api_payments_paid_at_idx ON public.agent_api_payments(paid_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS agent_api_payments_payment_id_uidx ON public.agent_api_payments(payment_id);
CREATE INDEX IF NOT EXISTS partners_boosted_until_idx ON public.partners(boosted_until DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS partners_wallet_address_idx ON public.partners(wallet_address);
CREATE INDEX IF NOT EXISTS partners_categories_gin_idx ON public.partners USING GIN (categories);
CREATE INDEX IF NOT EXISTS agent_boosts_partner_id_idx ON public.agent_boosts(partner_id);
CREATE INDEX IF NOT EXISTS agent_boosts_expires_at_idx ON public.agent_boosts(expires_at DESC);
