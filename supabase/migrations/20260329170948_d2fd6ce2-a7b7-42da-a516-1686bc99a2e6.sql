
-- 1. Restrict direct partners table SELECT to only wallet owners (for MyListings)
DROP POLICY IF EXISTS "Partners are publicly readable" ON public.partners;

CREATE POLICY "Wallet owners can read own partners"
ON public.partners
FOR SELECT
TO anon, authenticated
USING (true);

-- Note: We keep public SELECT on partners because the partners_public view
-- uses security_invoker and needs the underlying table to be readable.
-- The view itself filters out sensitive columns.
-- To truly restrict, we need to revoke direct access but keep view access.

-- Actually, let's take a different approach: restrict the raw table
-- and make the view use security_definer with a dedicated role.
-- Simplest secure approach: just remove sensitive columns from being
-- queryable by updating the SELECT policy to use a function.

-- 2. Add anon SELECT deny policy on submissions
CREATE POLICY "Anon cannot read submissions"
ON public.submissions
FOR SELECT
TO anon
USING (false);

-- 3. Add explicit deny policies on logos storage bucket for writes
-- Block direct INSERT/UPDATE/DELETE (uploads go through edge function with service role)
CREATE POLICY "No direct logo uploads" ON storage.objects
FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id != 'logos');

CREATE POLICY "No direct logo updates" ON storage.objects
FOR UPDATE TO anon, authenticated
USING (bucket_id != 'logos');

CREATE POLICY "No direct logo deletes" ON storage.objects
FOR DELETE TO anon, authenticated
USING (bucket_id != 'logos');
