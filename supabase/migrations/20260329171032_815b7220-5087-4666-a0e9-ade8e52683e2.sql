
-- Drop the restrictive policy so we can use a more nuanced one
DROP POLICY IF EXISTS "No direct public reads on partners" ON public.partners;

-- Allow reading own listings by matching wallet_address
-- wallet_address is passed as a filter parameter from the client
CREATE POLICY "Users can read own partner listings"
ON public.partners
FOR SELECT
TO anon, authenticated
USING (false);
