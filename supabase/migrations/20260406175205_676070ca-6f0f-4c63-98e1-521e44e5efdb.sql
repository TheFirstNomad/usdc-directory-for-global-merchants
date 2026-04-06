-- Revoke SELECT on sensitive columns from client roles
-- This prevents direct REST API reads of wallet_address, payment_id, payment_status
-- while still allowing the partners_public view to work (it only selects safe columns)
REVOKE SELECT (wallet_address, payment_id, payment_status) ON public.partners FROM anon, authenticated;