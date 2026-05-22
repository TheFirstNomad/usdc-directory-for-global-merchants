REVOKE EXECUTE ON FUNCTION public.cleanup_agent_rate_limits()  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_deployment_checks()   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_admin_sig_nonces()    FROM PUBLIC, anon, authenticated;