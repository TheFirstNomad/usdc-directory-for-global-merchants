-- S1: Lock down partners table — remove public column-level leak.
-- Public reads must go through partners_public view (which omits wallet_address, payment_id, badge_*).
DROP POLICY IF EXISTS "Public can read confirmed partners" ON public.partners;

-- Ensure the view is readable by anon/authenticated (view runs as owner, bypassing RLS).
GRANT SELECT ON public.partners_public TO anon, authenticated;

-- S5: Prevent duplicate listings from the same payment.
-- Partial unique so historical NULLs are allowed.
CREATE UNIQUE INDEX IF NOT EXISTS partners_payment_id_uidx
  ON public.partners (payment_id)
  WHERE payment_id IS NOT NULL;

-- P5: speed up the homepage + paid agents listing.
CREATE INDEX IF NOT EXISTS idx_partners_created_at
  ON public.partners (created_at DESC);

-- S6: Admin signature replay protection.
CREATE TABLE IF NOT EXISTS public.admin_sig_nonces (
  signature text PRIMARY KEY,
  admin_address text NOT NULL,
  used_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_sig_nonces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No client reads admin_sig_nonces"   ON public.admin_sig_nonces FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "No client inserts admin_sig_nonces" ON public.admin_sig_nonces FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client updates admin_sig_nonces" ON public.admin_sig_nonces FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No client deletes admin_sig_nonces" ON public.admin_sig_nonces FOR DELETE TO anon, authenticated USING (false);
CREATE INDEX IF NOT EXISTS admin_sig_nonces_used_at_idx
  ON public.admin_sig_nonces (used_at);

-- Sc1: Cleanup helpers (cheap, called opportunistically by edge functions).
CREATE OR REPLACE FUNCTION public.cleanup_agent_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.agent_rate_limits WHERE created_at < now() - interval '24 hours';
$$;

CREATE OR REPLACE FUNCTION public.cleanup_deployment_checks()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.deployment_checks WHERE checked_at < now() - interval '30 days';
$$;

CREATE OR REPLACE FUNCTION public.cleanup_admin_sig_nonces()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.admin_sig_nonces WHERE used_at < now() - interval '1 day';
$$;