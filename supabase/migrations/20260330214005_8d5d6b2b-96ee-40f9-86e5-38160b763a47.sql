
-- 1. Fix exposed sensitive data: Block direct SELECT on partners table
-- (all public reads go through partners_public view which omits wallet_address/payment_id)
DROP POLICY IF EXISTS "Public can read completed partners" ON public.partners;

CREATE POLICY "No direct partner reads"
  ON public.partners FOR SELECT
  TO anon, authenticated
  USING (false);

-- 2. Fix missing storage policies: Deny client-side writes to logos bucket
CREATE POLICY "No client logo inserts"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id <> 'logos');

CREATE POLICY "No client logo updates"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id <> 'logos');

CREATE POLICY "No client logo deletes"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id <> 'logos');
