
-- Partners table
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  website TEXT,
  logo_url TEXT,
  logo_emoji TEXT DEFAULT '🏢',
  categories TEXT[] NOT NULL DEFAULT '{}',
  region TEXT DEFAULT 'Global',
  use_cases TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Submissions table
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  website TEXT NOT NULL,
  description TEXT NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  region TEXT DEFAULT 'Global',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Partners are publicly readable
CREATE POLICY "Partners are publicly readable" ON public.partners
  FOR SELECT TO anon, authenticated USING (true);

-- Anyone can submit
CREATE POLICY "Anyone can submit" ON public.submissions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Enable realtime for partners
ALTER PUBLICATION supabase_realtime ADD TABLE public.partners;
