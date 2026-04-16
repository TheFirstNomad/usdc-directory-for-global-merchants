

## Fix Admin Listings: PUT failure + 1000-row cap

### Root causes

**1. PUT/DELETE fails ("Failed to update listing")**
The `admin-listings` edge function imports `ethers@6.13.1` from `esm.sh`, which pulls in optional WebSocket dependencies (`bufferutil`, `utf-8-validate`) that Deno can't resolve. The module either crashes on boot or `ethers.verifyMessage` throws, returning 403. Logs confirm zero successful PUT requests reach the handler.

**2. Only 1000 of 1176 listings show**
Even with `.limit(2000)` on the query builder, Supabase PostgREST enforces a hard server-side `max-rows` cap (default 1000) that overrides client `.limit()`. Need to paginate using `.range(0, 1999)` in chunks, or use `.range(0, 2999)` which bypasses the implicit cap.

### Fixes

**File 1: `supabase/functions/admin-listings/index.ts`**
- Replace `ethers` import with a lightweight pure-Deno secp256k1 verification using `npm:viem@2/utils` (`verifyMessage` from viem) — viem is pure JS, no native deps, works cleanly in Deno
- Change GET query from `.limit(2000)` to `.range(0, 2999)` to bypass PostgREST's implicit row cap
- Add explicit error logging in the catch block so future failures surface real messages

**File 2: `src/pages/AdminListings.tsx`**
- Update toast on save failure to show the actual backend error message (already partially done — just surface `err.message` in the toast description) so debugging is easier going forward

### What stays untouched
- `src/lib/adminAuth.ts` — client signs the same EIP-191 message; viem verifies the same format
- All other edge functions, swap, bridge, directory pages
- RLS policies, database schema

### Why viem instead of ethers
Viem is pure ESM JavaScript with no native Node dependencies. It already works in other Deno edge functions in this project (used by Circle Arc adapter). Switching the verification call is a 3-line change.

