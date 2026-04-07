-- Drop the existing flawed policies
DROP POLICY IF EXISTS "No client logo inserts" ON storage.objects;
DROP POLICY IF EXISTS "No client logo updates" ON storage.objects;
DROP POLICY IF EXISTS "No client logo deletes" ON storage.objects;

-- Create proper deny-all policies for write operations
CREATE POLICY "Deny all client inserts"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "Deny all client updates"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (false);

CREATE POLICY "Deny all client deletes"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (false);