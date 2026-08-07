-- 1. Remove public read on internal monitoring data
DROP POLICY IF EXISTS "Public read deployment checks" ON public.deployment_checks;

CREATE POLICY "No client reads deployment checks"
  ON public.deployment_checks FOR SELECT
  TO anon, authenticated
  USING (false);

REVOKE SELECT ON public.deployment_checks FROM anon, authenticated;
GRANT ALL ON public.deployment_checks TO service_role;

-- 2. Explicit, scoped public read policy for the logos bucket
DROP POLICY IF EXISTS "Public read logos" ON storage.objects;
CREATE POLICY "Public read logos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'logos');