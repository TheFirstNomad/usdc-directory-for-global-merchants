
-- Add wallet_address to partners for ownership
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS wallet_address text;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS payment_id text;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS networks text[] NOT NULL DEFAULT '{}'::text[];

-- Add wallet_address to submissions
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS wallet_address text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS payment_id text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS networks text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.partners(id);

-- Create logo storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: anyone can read logos
CREATE POLICY "Public logo read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'logos');
-- Anyone can upload logos (no auth required since we use wallet-only)
CREATE POLICY "Anyone can upload logos" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'logos');

-- Drop old submission insert policy (edge functions will use service role)
DROP POLICY IF EXISTS "Anyone can submit" ON public.submissions;
