
-- Remove the stale permissive policy
DROP POLICY IF EXISTS "Wallet owners can read own partners" ON public.partners;
