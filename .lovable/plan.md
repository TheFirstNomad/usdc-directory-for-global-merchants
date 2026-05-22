# Deep Audit — USDC Directory

Below is a complete audit organized by severity. Each item is concrete and fixable. Approve and I'll work through them in order.

---

## CRITICAL (fix first)

### S1. Wallet addresses publicly leak from `partners` table
The `Public can read confirmed partners` RLS policy on `partners` exposes **every column**, including `wallet_address`, `payment_id`, `badge_*`, `boosted_until`. The frontend reads from the `partners_public` view (which hides those columns), but any anon client can query the base table directly and harvest all paid agent/merchant wallets.
- **Fix:** Replace the broad SELECT policy with one that returns only the safe columns, or drop the policy entirely and force public reads through `partners_public` (set as `security_invoker = false` + grant SELECT to anon).

### S2. `check-deployment` is an open SSRF
Anyone can POST any URL and the function fetches it server-side, returning status/HTML. Lets attackers probe internal addresses or proxy traffic.
- **Fix:** Allowlist to `usdc.directory`, `*.lovable.app`, and the project's Supabase host. Reject private IP ranges. Add per-IP rate limit (5/min).

### S3. `upload-logo` accepts SVG with no auth or rate limit
- Anyone can flood storage (2 MB × ∞) without proving wallet ownership.
- SVG files can carry `<script>`; served from a `*.supabase.co` origin they can still XSS via direct visit / iframe.
- `wallet_address` is accepted as any ≤256-char string and `upsert: true` lets one user overwrite another's logo if they guess the filename pattern.
- **Fix:** Remove SVG from the allow-list (or sanitize with DOMPurify-style strip in a worker); validate wallet as `0x[a-f0-9]{40}` or Solana/Sui/Near pattern; require an admin-style signature OR a per-wallet IP rate limit (10/hour); drop `upsert: true` and include a random suffix.

### S4. `circle-proxy` has no auth or rate limit
Any browser globally can call `circle-proxy` and burn the ARC_KIT_KEY quota / make arbitrary Circle stablecoinKit calls under your account.
- **Fix:** Validate the caller's Supabase JWT (`getClaims`) **or** add a per-IP token bucket (e.g. 30/min) **and** narrow the path allow-list further.

---

## HIGH

### S5. x402 payment-method dedup gap
`agents-api` records confirmed listings with `payment_id = "x402:<chain>:<nonce>"` or `txHash`, while `submit-ai-agent` writes `"<chain>:<tx>"`. Same on-chain tx can be reused across the two paths.
- **Fix:** Normalize both paths to write `chain:txHash` and add a unique index on `partners.payment_id`.

### S6. Admin signature replay window
Owner signature is valid for 5 minutes with no nonce. If an attacker captures it from any logged request, they can replay against admin endpoints.
- **Fix:** Add a `used_admin_sigs(signature, used_at)` table with unique index; reject re-use. Reduce window to 90 s. Don't log the signature.

### P1. Frontend loads the entire app on every route
All 19 pages are eager-imported in `App.tsx`. First paint pulls in Reown AppKit + wagmi + framer-motion + every admin page.
- **Fix:** Convert routes to `React.lazy()` + `Suspense`. Split admin pages, Swap, Bridge, Map behind dynamic imports. Estimated ~40–60% drop in initial JS.

### P2. `Web3Provider` always mounts AppKit + WalletConnect
WalletConnect bundle is huge and only needed when the user clicks Connect. Right now it loads on `/`.
- **Fix:** Lazy-mount `Web3Provider` only inside routes that need wallet (`/submit`, `/swap`, `/bridge`, `/my-listings`, `/admin/*`).

### P3. `Index.tsx` re-fetches up to 3000 partners on every mount, no cache
`fetchPartners` is called with `useEffect`; React Query is already in the tree but unused here.
- **Fix:** Move to `useQuery(['partners'], fetchPartners, { staleTime: 5 * 60_000 })`. Same for `MerchantDetail`, `AIAgents`, `Insights`, `MapView`.

---

## MEDIUM

### Sc1. Unbounded growth tables
`agent_rate_limits`, `x402_nonces`, `agent_api_payments`, `deployment_checks` will grow forever. There is no cleanup.
- **Fix:** Add a `pg_cron` job: delete `agent_rate_limits` rows older than 24 h and `deployment_checks` older than 30 days; archive `x402_nonces` settled rows older than 90 days into a cold table.

### Sc2. Single-RPC dependencies in payment verifiers
`submit-listing`, `submit-ai-agent`, `agents-api` each rely on one RPC URL per chain (e.g. `eth.llamarpc.com`, `polygon-rpc.com`). Any outage breaks paid flows.
- **Fix:** Add a small `withFallback([url1, url2, url3])` helper with 6 s timeout per attempt. Use 2–3 public RPCs per chain.

### Sc3. No `Cache-Control` on public read endpoints
`agents-api` `GET /agents`, `sitemap`, `og-agent`, MCP `list_agents` return fresh JSON on every call.
- **Fix:** Add `Cache-Control: public, max-age=60, stale-while-revalidate=300` to GET responses. Saves DB load at scale.

### P4. Images are not lazy-loaded or sized
`PartnerCard`, `FeaturedCarousel` render logos without `loading="lazy"`, `decoding="async"`, or `width/height`. Large grids cause layout shift.
- **Fix:** Add the attributes; set explicit dimensions.

### P5. Missing index on `partners(created_at)`
`fetchPartners` and `agents-api` both sort by `created_at DESC`. No index exists.
- **Fix:** `CREATE INDEX idx_partners_created_at ON partners(created_at DESC);`

### S7. `agents-api` rate-limits only the 402 challenge
A paid caller can hammer `GET /agents` (500 rows) at $0.001 each. At small scale this is fine; at scale a rogue agent can flood Postgres.
- **Fix:** Add post-payment per-wallet token bucket (e.g. 60 req/min/wallet) using the existing `agent_rate_limits` table.

### S8. `recoverMessageAddress` import differs across admin functions
Some admins import `viem@2.21.0`, others bundle differently. Increases attack surface from version drift.
- **Fix:** Pin all admin functions to the same viem version and share a `verifyAdmin` helper file pattern (copy via npm specifier).

---

## LOW / polish

- **S9.** `circle-proxy` logs full target URL — fine, but don't log request bodies (may contain wallet hints).
- **S10.** `index.html` has no `Content-Security-Policy`, no canonical link, no `og:image`. Add CSP (script-src 'self' 'unsafe-inline' https:; connect-src 'self' https://*.supabase.co https://*.walletconnect.com …) and the missing SEO tags.
- **P6.** `useMemo` chain in `Index.tsx` rebuilds whenever any filter changes; the `uniquePartners` Map dedup runs on every render of partners array. Cheap, but consider memoizing by partner count + last id.
- **P7.** `submit-listing` and `submit-ai-agent` duplicate ~200 lines of verifier code. Extract to a shared module to reduce drift (and audit surface).
- **Sc4.** No global error reporting/observability beyond `console.log`. Consider piping edge function errors to a `function_errors` table (already a pattern Lovable supports) for trend analysis.

---

## Proposed execution order

```text
Phase 1 (security must-fix, ~1 turn)
  S1 RLS column lock-down on partners
  S2 SSRF allowlist for check-deployment
  S3 upload-logo hardening (auth/validation/no-SVG/no-upsert)
  S4 circle-proxy rate-limit + JWT check

Phase 2 (payment integrity, ~1 turn)
  S5 unify payment_id format + unique index
  S6 admin signature nonce table

Phase 3 (performance, ~1 turn)
  P1 route-level code splitting
  P2 lazy Web3Provider
  P3 React Query for partners
  P4 image lazy loading
  P5 created_at index

Phase 4 (scale, ~1 turn)
  Sc1 pg_cron cleanup jobs
  Sc2 multi-RPC fallback helper
  Sc3 cache headers
  S7 per-wallet post-payment rate limit

Phase 5 (polish)
  S8/S9/S10/P6/P7/Sc4
```

Approve and I'll start with Phase 1.
