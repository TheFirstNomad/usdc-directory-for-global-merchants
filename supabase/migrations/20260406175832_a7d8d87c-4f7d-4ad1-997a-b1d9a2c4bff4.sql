-- Drop the overly permissive SELECT policy that exposes all columns
DROP POLICY IF EXISTS "Public can read partner safe columns via view" ON public.partners;

-- Create a tighter policy that still allows the view to work but only for safe columns
-- Since we'll revoke column-level access, this policy controls row access
CREATE POLICY "Allow row access for view reads"
ON public.partners
FOR SELECT
TO anon, authenticated
USING (
  payment_status IN ('confirmed', 'finished', 'sending', 'pending')
);

-- Revoke SELECT on sensitive columns from client roles
REVOKE SELECT (wallet_address, payment_id, payment_status) ON public.partners FROM anon, authenticated;