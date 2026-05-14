
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS boosted_until timestamptz,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.agent_api_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id text NOT NULL,
  endpoint text NOT NULL,
  method text NOT NULL,
  amount_usdc bigint NOT NULL,
  chain text NOT NULL,
  agent_wallet text,
  scheme text NOT NULL DEFAULT 'x402',
  paid_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_api_payments_paid_at ON public.agent_api_payments (paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_api_payments_payment_id ON public.agent_api_payments (payment_id);

ALTER TABLE public.agent_api_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No client reads agent_api_payments" ON public.agent_api_payments FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "No client inserts agent_api_payments" ON public.agent_api_payments FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client updates agent_api_payments" ON public.agent_api_payments FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No client deletes agent_api_payments" ON public.agent_api_payments FOR DELETE TO anon, authenticated USING (false);

CREATE TABLE IF NOT EXISTS public.agent_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  payment_id text NOT NULL,
  amount_usdc bigint NOT NULL,
  chain text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_boosts_partner ON public.agent_boosts (partner_id);
CREATE INDEX IF NOT EXISTS idx_agent_boosts_expires_at ON public.agent_boosts (expires_at DESC);

ALTER TABLE public.agent_boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No client reads agent_boosts" ON public.agent_boosts FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "No client inserts agent_boosts" ON public.agent_boosts FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client updates agent_boosts" ON public.agent_boosts FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No client deletes agent_boosts" ON public.agent_boosts FOR DELETE TO anon, authenticated USING (false);
