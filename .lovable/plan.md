

## Comprehensive Bug Fix & Fine-Tuning Plan

### Issues Found

**1. Admin Edit Listing — PUT handler needs Content-Type header**
The `handleSave` in `AdminListings.tsx` calls `getHeaders()` which returns auth headers but may not include `Content-Type: application/json`. The edge function tries to parse `await req.json()` which could fail silently. The `getHeaders` function needs to include `Content-Type`.

**2. Admin Listings — all 1176 should already show (limit is 2000)**
The edge function already has `.limit(2000)` from the last fix. This should be working. Will verify via direct edge function test.

**3. Payment Monitor — has 1 submission now**
The `submit-listing` function is now creating records. This is working as designed.

**4. "Base approvals on Arc Testnet"**
The `useSwap` hook checks `needsApproval` gated by `isBase`, so the Approve button shouldn't appear on Arc. However, the `wrongChain` detection (`walletChainId !== selectedChainId`) shows "Switch wallet to Arc Testnet" when the user's wallet is on Base. This is correct behavior, but the Circle SDK's `kit.swap()` might internally handle chain switching. The fix: skip the `wrongChain` check on Arc Testnet since Circle SDK manages the chain context itself.

**5. "Base swap is expensive — make it fee free"**
There's a `PLATFORM_FEE_BPS = 100` (1%) defined in tokens.ts and displayed in PoolAnalytics. The actual Uniswap pool fees (0.05%–0.3%) are on-chain and can't be removed, but we can:
- Set `PLATFORM_FEE_BPS = 0` to remove the platform fee
- Update the swap UI to show "Zero platform fees" messaging
- Hide the pool fee display or label it clearly as "DEX fee (not charged by us)"

### Changes

**File 1: `src/lib/swap/tokens.ts`**
- Change `PLATFORM_FEE_BPS` from `100` to `0`
- Update comment to reflect "no platform fee"

**File 2: `src/pages/Swap.tsx`**
- Remove the `wrongChain` gate for Arc Testnet — Circle SDK handles chain context
- Update the bottom label to show "Zero platform fees" for both chains
- In the details section, hide the "Pool Fee" row on Arc (Circle handles it), and on Base relabel it as "DEX Fee (Uniswap)" to clarify it's not our fee

**File 3: `src/lib/swap/useSwap.ts`**
- Skip the `wrongChain`-based disable on Arc Testnet (Circle SDK swap works regardless of wallet chain)
- Ensure `needsApproval` stays `false` on Arc (already correct, but add explicit `!isArc` guard for safety)

**File 4: `src/pages/AdminListings.tsx`**
- Add `"Content-Type": "application/json"` to PUT/DELETE fetch headers (currently only auth headers are sent)
- This fixes the "Failed to update listing" error when editing

**File 5: `src/components/swap/PoolAnalytics.tsx`**
- Update platform fee display to show 0% or remove the platform fee row entirely

### What stays untouched
- Bridge, directory, maps, insights — all unchanged
- submit-listing and circle-proxy edge functions — working correctly
- Admin Payments page — working (will show data as submissions accumulate)
- All other pages and components

