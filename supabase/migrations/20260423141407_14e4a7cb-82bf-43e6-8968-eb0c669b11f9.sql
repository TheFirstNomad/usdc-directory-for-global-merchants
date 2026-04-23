
CREATE TABLE IF NOT EXISTS public.deployment_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now(),
  status_code integer,
  mount_success boolean NOT NULL DEFAULT false,
  has_root boolean,
  has_module_script boolean,
  script_count integer,
  html_bytes integer,
  duration_ms integer,
  error text
);

CREATE INDEX IF NOT EXISTS deployment_checks_checked_at_idx
  ON public.deployment_checks (checked_at DESC);

ALTER TABLE public.deployment_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read deployment checks"
  ON public.deployment_checks FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "No client inserts"
  ON public.deployment_checks FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "No client updates"
  ON public.deployment_checks FOR UPDATE
  TO anon, authenticated
  USING (false);

CREATE POLICY "No client deletes"
  ON public.deployment_checks FOR DELETE
  TO anon, authenticated
  USING (false);

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
