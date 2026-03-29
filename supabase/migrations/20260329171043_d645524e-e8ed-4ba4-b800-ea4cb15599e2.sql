
-- Create a secure function to fetch listings by wallet address
-- This bypasses RLS using security definer to return only safe columns
CREATE OR REPLACE FUNCTION public.get_my_listings(_wallet_address text)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  logo_url text,
  logo_emoji text,
  categories text[],
  region text,
  website text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, description, logo_url, logo_emoji, categories, region, website
  FROM public.partners
  WHERE wallet_address = lower(_wallet_address)
  ORDER BY created_at DESC;
$$;
