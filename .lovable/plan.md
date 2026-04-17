

## Fix: New listings not showing + remaining ethers/Deno issues

### Root causes

**1. New user listings don't appear in the directory**
`fetchPartners()` and `fetchFeaturedPartners()` in `src/lib/partners.ts` query `partners_public` ordered by `created_at ASC` with no range. PostgREST caps at 1000 rows server-side. The DB has 1177 confirmed listings — the 177 newest (including artespraticas) are silently dropped. They appear in the admin Payment Monitor because that view queries the `submissions` table, not `partners_public`.

**2. admin-payments still broken (ethers/Deno)**
Logs show repeated `module "/bufferutil@4.1.0/denonext/package.json" not found` errors. The function still imports `ethers@6.13.1` from esm.sh. Delete button on the Payment Monitor will fail silently. (admin-listings was already migrated to viem; only admin-payments and admin-featured remain.)

**3. admin-listings PUT signature still failing**
viem's `verifyMessage` in Deno can return false for EOA signatures because it tries an ERC-1271 contract check first without an RPC client. Switch to `recoverMessageAddress` (pure ECDSA) and compare the recovered address directly — no network calls, works for any EOA wallet signature. Apply the same to all three admin functions.

### Fixes

**File 1: `src/lib/partners.ts`**
- Change `fetchPartners` and `fetchFeaturedPartners` to sort `created_at DESC` and add `.range(0, 2999)` to bypass the 1000-row cap.
- Newest listings then load first and all 1177+ partners are returned.

**File 2: `supabase/functions/admin-listings/index.ts`**
- Replace `verifyMessage` with `recoverMessageAddress` from viem (pure ECDSA, no RPC).
- Compare recovered address to `OWNER_WALLET` directly.
- Add a debug log for any auth failure showing recovered vs expected.

**File 3: `supabase/functions/admin-payments/index.ts`**
- Replace `ethers` import with viem's `recoverMessageAddress`.
- Eliminates the `bufferutil` boot errors and makes the delete button work.

**File 4: `supabase/functions/admin-featured/index.ts`**
- Same viem migration so the Featured toggle works reliably.

### Verified working (no changes)
- `submit-listing` — confirmed creating partners with `payment_status='confirmed'` (artespraticas saved correctly today).
- `partners_public` view — already includes confirmed/finished/sending statuses.
- Swap, Bridge, MyListings, Insights, Map, AI Agents.
- Frontend `AdminListings.tsx` — already sends Content-Type and surfaces backend errors.

### Untouched
- DB schema, RLS, view definitions
- `src/lib/adminAuth.ts` (signing flow is correct)
- All other pages

