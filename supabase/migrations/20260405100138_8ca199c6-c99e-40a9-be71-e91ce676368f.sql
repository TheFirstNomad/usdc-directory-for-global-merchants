
-- 1. Add explicit deny policies for UPDATE and DELETE on submissions
CREATE POLICY "No direct submission updates"
  ON public.submissions FOR UPDATE
  TO anon, authenticated
  USING (false);

CREATE POLICY "No direct submission deletes"
  ON public.submissions FOR DELETE
  TO anon, authenticated
  USING (false);

-- 2. Create ownership verification function
CREATE OR REPLACE FUNCTION public.is_listing_owner(_listing_id uuid, _wallet_address text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.partners
    WHERE id = _listing_id
      AND wallet_address = lower(_wallet_address)
  );
$$;

-- 3. Fix Security Definer View: recreate as SECURITY INVOKER
DROP VIEW IF EXISTS public.partners_public;

-- Add a safe SELECT policy on partners for anon (only safe columns exposed via view)
CREATE POLICY "Public can read partner safe columns via view"
  ON public.partners FOR SELECT
  TO anon, authenticated
  USING (payment_status = 'confirmed' OR payment_status = 'finished' OR payment_status = 'sending' OR payment_status = 'pending');

-- Recreate view with security_invoker = true
CREATE VIEW public.partners_public
WITH (security_invoker = true) AS
  SELECT id, name, description, website, logo_url, logo_emoji, categories, region,
         use_cases, networks, usdc_score, featured, created_at, updated_at
  FROM public.partners;
