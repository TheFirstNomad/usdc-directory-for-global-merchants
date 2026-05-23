-- 1. Reinstall pg_net in the extensions schema (it does not support ALTER ... SET SCHEMA).
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Remove the broad public SELECT policy on the logos bucket so anonymous clients
-- can no longer list files. Public bucket URLs continue to work without this policy.
DROP POLICY IF EXISTS "Public logo read" ON storage.objects;