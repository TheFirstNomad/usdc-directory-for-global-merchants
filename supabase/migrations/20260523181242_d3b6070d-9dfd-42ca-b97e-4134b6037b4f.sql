ALTER VIEW public.partners_public SET (security_invoker = false);
GRANT SELECT ON public.partners_public TO anon, authenticated;