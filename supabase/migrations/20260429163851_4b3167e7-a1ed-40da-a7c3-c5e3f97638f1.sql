ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS badge_voucher_issued_at timestamptz,
  ADD COLUMN IF NOT EXISTS badge_token_id integer,
  ADD COLUMN IF NOT EXISTS badge_tx_hash text,
  ADD COLUMN IF NOT EXISTS badge_nonce integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_partners_badge_token_id ON public.partners(badge_token_id);