# Fix: Swap failing on Arc Testnet

## Root cause

The recent security hardening of `supabase/functions/circle-proxy/index.ts` made the edge function reject any request without a `Bearer <jwt>` Authorization header (returns 401 "Unauthorized").

But the browser-side proxy interceptor in `src/lib/arcAppKit.ts` → `withCircleProxy()` posts to that edge function with only `Content-Type: application/json` — no `Authorization`, no `apikey`. So every call the Circle SDK makes to `api.circle.com` is intercepted, forwarded to our edge function, and immediately 401s. The SDK surfaces this as "createSwap failed", and `useSwap.ts` maps that to the user-visible "Swap request failed. Ensure your wallet is connected to the correct network and try again."

This breaks the same way for:
- `kit.swap()` on Arc (Swap page)
- `kit.bridge()` (Bridge page) — `bridgeUsdc` does NOT wrap with `withCircleProxy` today, so it ALSO fails due to raw CORS to `api.circle.com`
- `kit.send()` (listing/agent/boost fees on Arc) when the proxy path is used

## Fix

1. **`src/lib/arcAppKit.ts` — add auth header to proxy call**
   - In `withCircleProxy`, attach the Supabase anon key as both `Authorization: Bearer <VITE_SUPABASE_PUBLISHABLE_KEY>` and `apikey: <VITE_SUPABASE_PUBLISHABLE_KEY>` headers on the POST to `PROXY_URL`. This satisfies the hardened edge function (which calls `sb.auth.getClaims` on the token; the anon JWT validates fine).
   - Also wrap `bridgeUsdc` and `payListingFee` execution with `withCircleProxy` so they go through the same authenticated proxy path (currently only `swapViaKit` does).

2. **No changes to `circle-proxy/index.ts`.** The hardening stays. Path is still locked to `/v1/stablecoinKits/*`, rate is still bounded by the JWT check.

3. **No DB or RLS changes.**

## Verification

- Reload preview, connect wallet, attempt EURC → USDC swap on Arc Testnet → should now reach Circle, return calldata, prompt wallet signature.
- Bridge Sepolia ↔ Arc should also succeed (previously broken by CORS).
- Listing fee payment on Arc should continue to work.

## Files touched

- `src/lib/arcAppKit.ts` (small edit to `withCircleProxy` + wrap bridge/send)
