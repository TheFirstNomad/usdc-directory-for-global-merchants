REVOKE EXECUTE ON FUNCTION public.is_listing_owner(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_my_listings(text)         FROM PUBLIC, anon, authenticated;