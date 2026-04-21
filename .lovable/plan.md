

# Deep Audit & Improvement Plan

## Critical Security Fixes

### 1. Admin auth bypass in two edge functions
Both `admin-featured` and `admin-payments` call `verifyAdmin(req)` **without `await`**. Since `verifyAdmin` is async, it returns a Promise — which is always truthy — so `if (!verifyAdmin(req))` never blocks. **Anyone on the internet can read all submissions, payment data, and toggle featured listings.**

Fix: add `await` (matches the already-correct pattern in `admin-listings`).

### 2. `submit-listing` accepts unverified writes
The function inserts directly into `partners` and `submissions` with no validation that `tx_hash` corresponds to a real on-chain payment to the treasury, and no input length / format limits. A bot hitting the URL can spam the directory for free.

Fix (this pass — quick wins):
- Add zod-style validation: company_name (1–80), description (1–500), website (valid URL, max 200), email (valid + max 255), categories (array of strings from allowed list, max 5), region (one of allowed list).
- Reject duplicate `tx_hash` (`payment_id` already used).
- Reject obviously-malformed tx_hash (must be `0x` + 64 hex chars).
- Note: full on-chain payment verification (RPC `eth_getTransactionReceipt` against treasury wallet + USDC amount) is a follow-up — call it out but don't ship today unless you confirm.

### 3. Ownership check on update
`type === "update"` updates a partner by `partner_id` without verifying the calling wallet is the owner. Add a check: load the partner, confirm `wallet_address === walletLower` before updating.

## Runtime Errors

### 4. React "function components cannot be given refs" warnings
`HeroSection` and `PartnerCard` are wrapped in `React.lazy()` then rendered inside `<Suspense>`. React forwards a ref through Suspense to the lazy component, triggering the warning on every render.

Fix: remove the unnecessary lazy import for these two — they're above-the-fold and already loaded eagerly via the route bundle. Keeps console clean and removes the Suspense fallback flicker.

## Design Polish

### 5. Footer balance
With three columns (Directory / Contact / Follow Us) on the right and a wide tagline on the left, alignment looks a bit lopsided on desktop. Tighten gap-10 → gap-12, and ensure the right-side block uses a 3-col grid on `md+` so columns align cleanly.

### 6. PartnerCard color map gaps
`categoryColors` is missing newer categories ("AI Agents", "DeFi", "Onramp", etc.) so they fall back to plain muted gray. Add entries so every category in `CATEGORIES` has a color, keeping the palette harmonious.

### 7. Sort dropdown styling
The native `<select>` in Index.tsx breaks visual consistency with the shadcn components used everywhere else. Replace with shadcn `<Select>`.

### 8. Hero trust strip
Add a small "Trusted by X+ merchants · Y countries · Z networks" stat strip under the search bar to reinforce credibility (uses data already in state — zero extra fetches).

## Out of scope (for follow-up)
- Full on-chain payment verification in `submit-listing` (needs RPC call + USDC transfer log decoding — bigger task).
- Migrating from anon-only auth to a real user-roles table (currently admin = single hardcoded wallet, which is acceptable for a one-owner project but limits scale).

## Files Touched
- `supabase/functions/admin-featured/index.ts` — add `await`
- `supabase/functions/admin-payments/index.ts` — add `await`
- `supabase/functions/submit-listing/index.ts` — input validation, dup tx_hash check, ownership check on update
- `src/pages/Index.tsx` — drop lazy for HeroSection/PartnerCard, replace native select with shadcn Select
- `src/components/PartnerCard.tsx` — fill in missing category colors
- `src/components/HeroSection.tsx` — add trust stat strip
- `src/components/Footer.tsx` — grid alignment polish

