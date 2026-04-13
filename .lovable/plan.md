

## Restore Arc Testnet Swap via Server-Side Proxy

### The real problem

The Circle App Kit SDK's `kit.swap()` makes an HTTP request from the browser to `api.circle.com`. That request gets blocked by CORS because Circle's API doesn't include your domain in its allowed origins. The Circle Console doesn't expose a setting to whitelist origins for Kit Keys, so there's no way to fix this from the console side.

### About Build Secrets

The `.env` file in your project already contains `VITE_ARC_KIT_KEY` and it works — Vite injects it at build time. The "Build Secrets" tab in Workspace Settings was a separate feature for private npm packages; it's not needed here. Your current setup is correct.

### Solution: Edge Function proxy

Instead of the browser calling Circle's API directly (which gets CORS-blocked), we route that call through a backend function that runs on your server. Server-to-server calls have no CORS restrictions.

```text
 BEFORE (broken):
 Browser → api.circle.com  ← CORS blocked

 AFTER (working):
 Browser → Your Edge Function → api.circle.com → response back
              (no CORS)         (server-to-server)
```

The wallet signing still happens in the user's browser — only the Circle API call is proxied.

### Changes

**1. Create Edge Function `circle-proxy`** (`supabase/functions/circle-proxy/index.ts`)
- Generic proxy that forwards requests to `api.circle.com`
- Uses the `ARC_KIT_KEY` secret already stored in Cloud
- Adds proper CORS headers so the browser can call it
- Validates the request and passes it through

**2. Update `src/lib/arcAppKit.ts`**
- Replace the `swapViaKit()` implementation for Arc Testnet
- Instead of calling `kit.swap()` (which triggers the CORS-blocked API call), use a custom flow:
  - Call our `circle-proxy` Edge Function to get swap transaction parameters from Circle's API
  - Use the Viem adapter to sign and submit the transaction directly to Arc Testnet's RPC
- Keep `kit.swap()` as-is for Base Mainnet (it may work there, or can be proxied too)

**3. Restore swap UI in `src/pages/Swap.tsx`**
- Remove the `isArcTestnet` conditional that shows "Coming Soon"
- Show the full swap form for both Base and Arc Testnet
- Everything else stays the same (token selector, quote display, slippage, success modal)

### What stays untouched
- Base Mainnet swap — no changes
- Bridge page — no changes
- Directory, admin, maps, listings — no changes
- All secrets and environment variables — already configured correctly

### Implementation note
During implementation, I'll need to inspect the exact request format the Circle SDK sends to `api.circle.com` (endpoint path, headers, body structure) so the proxy can forward it correctly. This may require examining the SDK's network calls or source code. If the exact API format differs from what I expect, I'll adapt the proxy accordingly.

