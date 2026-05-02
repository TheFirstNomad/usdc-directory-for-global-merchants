
-- Audit log for admin moderation actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_address TEXT NOT NULL,
  action TEXT NOT NULL,
  partner_id UUID,
  partner_name TEXT,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_partner_id ON public.admin_audit_log(partner_id);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client reads audit log"
  ON public.admin_audit_log FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "No client inserts audit log"
  ON public.admin_audit_log FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "No client updates audit log"
  ON public.admin_audit_log FOR UPDATE TO anon, authenticated USING (false);
CREATE POLICY "No client deletes audit log"
  ON public.admin_audit_log FOR DELETE TO anon, authenticated USING (false);

-- Reject reason on submissions for visibility back to submitter
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS reject_reason TEXT;
