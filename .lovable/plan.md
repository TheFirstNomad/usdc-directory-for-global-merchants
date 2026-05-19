
# Fix empty directory + finish Agent Magnet build

## Why the directory looks empty

When Phase A recreated `partners_public` as a `security_invoker=true` view, the view now runs queries **as the caller** (anon role). The anon role no longer has the table-level `GRANT SELECT` on `public.partners`, so every request returns `401 permission denied for table partners` (visible in the latest network logs). The data is still there — it just isn't reachable.

The RLS policy `Public can read confirmed partners` already gates which rows are visible. We only need to restore the table-level grant so RLS can do its job.

## Fix + finish plan

### 1. Restore public read access (migration)
- `GRANT SELECT ON public.partners TO anon, authenticated;`
- `GRANT SELECT ON public.partners_public TO anon, authenticated;`
- Re-confirm RLS is still `ENABLED` on `partners` (it is) so only `payment_status in ('confirmed','finished','sending')` rows leak through.
- Quick `SELECT count(*)` sanity check via read_query after the migration runs.

### 2. Lock the rest of the surface
- Confirm `submissions`, `agent_api_payments`, `agent_boosts`, `x402_nonces`, `agent_rate_limits`, `admin_audit_log` remain `USING (false)` for anon/auth (already true). No client grants added.
- `logos` storage bucket stays public-read (needed for cards) but we add MIME/size guard in `upload-logo` if not already there.

### 3. Finish deferred Phase D polish (~2 credits)
- `supabase/functions/sitemap/index.ts` → dynamic `sitemap.xml` from `partners_public`, cached 1h, registered with `verify_jwt = false`.
- `supabase/functions/og-agent/index.ts` → per-agent OG image (SVG → PNG via `@resvg/resvg-wasm`) at `/og/agent/:id`; referenced from `MerchantDetail` `<SEO>` and `AIAgents` cards.
- Add `<link rel="sitemap">` + ensure `robots.txt` points at the edge function URL.

### 4. Verification pass
- Re-run `supabase--linter` and `security--run_security_scan`; fix anything new.
- `read_query` to confirm `select count(*) from partners_public` returns the original seeded count (~152+).
- Hit `/` in preview to confirm cards render; check network tab returns 200.
- Curl `/.well-known/agents.json`, `/openapi.json`, `/functions/v1/mcp` to confirm discovery surfaces still respond.

## Technical notes

- `security_invoker=true` views require BOTH (a) RLS policy on the base table AND (b) table-level GRANT to the role. We had (a) only; adding (b) is the fix.
- No code changes in `src/lib/partners.ts` needed — the query shape is already correct.
- `X402_SETTLEMENT_PRIVATE_KEY` is set; settlement will activate the moment that wallet has Base ETH. No code blocker.
- Treasury wallet `0x13FA78ab20762c8F49B58D44DBc177a2Adb94D7c` continues receiving USDC on Base + Arc via the unchanged x402 flow.

## Credits

~2 credits total (1 for the grant migration + verification, 1 for sitemap + OG image function).

Reply **"go"** to execute.
