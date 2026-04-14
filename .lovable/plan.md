

## Full Project Audit & Bug Fix Plan

### Bugs Found

**Critical Bugs:**

1. **ArcPaymentPanel never saves data to the database** — The `submissionData` prop is received but completely unused. When a user pays 10 USDC to list or 5 USDC to edit, the payment goes through but no submission or partner record is ever created/updated. This means:
   - New listings are paid for but never appear in the directory
   - Edit updates are paid for but never applied
   - The Payment Monitor is empty because the submissions table has 0 rows (not a display bug — data was never written)

2. **Admin Edit Listing fails ("Failed to update listing")** — The `admin-listings` edge function uses `ethers@6.13.1` via esm.sh which produces module warnings (`bufferutil`, `utf-8-validate`). The PUT handler itself looks correct, but the signature verification may be failing intermittently. Need to add better error logging and potentially switch to a lighter verification method.

3. **Admin GET returns only 1000 of 1176 listings** — Supabase has a default 1000-row limit. The admin-listings edge function doesn't paginate, so 176 listings are invisible in the admin dashboard.

**Minor Issues:**

4. **Partner view uses `use_cases` for networks display** — MerchantDetail shows `use_cases` as "Supported Networks" but the actual networks data is in the `networks` column.

5. **No `wallet_address` column exposed in `partners_public` view** — User edit ownership check via `is_listing_owner` queries the base `partners` table directly, which works because it's a SECURITY DEFINER function. This is fine.

### Fixes

**1. ArcPaymentPanel — Create submission record after payment**
- After successful `payListingFee`, call a new edge function (or the existing `circle-proxy` repurposed) to create a submission record in the database
- For new listings: insert into `submissions` table with all form data + wallet address + tx hash, then insert into `partners` table
- For updates: insert into `submissions` as an update record, then update the existing partner
- The `submissionData` prop + `address` + `txHash` are all available — they just need to be sent to the backend

**2. Create `submit-listing` edge function**
- Accepts POST with listing data + wallet address + tx hash
- Inserts into `submissions` table (for payment tracking)
- Inserts/updates `partners` table (for directory display)
- Sets `payment_status` to `confirmed` and `wallet_address` to the payer
- No admin signature required — any wallet can submit (they're paying)

**3. Fix admin-listings edge function**
- Add `.limit(2000)` to the GET query to return all 1176 partners
- Add detailed error logging to the PUT handler to diagnose the "Failed to update" error
- Add `console.log` for the verification step and the Supabase update result

**4. Fix MerchantDetail networks display**
- Change from `partner.use_cases` to `(partner as any).networks` for the "Supported Networks" section

**5. Payment Monitor will self-fix**
- Once ArcPaymentPanel starts creating submission records (fix #1), the Payment Monitor will show data automatically — no changes needed to AdminPayments

### Files to create/modify
- **Create** `supabase/functions/submit-listing/index.ts` — new edge function to persist listings
- **Edit** `src/components/ArcPaymentPanel.tsx` — call submit-listing after payment success
- **Edit** `supabase/functions/admin-listings/index.ts` — increase limit, add logging
- **Edit** `src/pages/MerchantDetail.tsx` — fix networks display
- **Edit** `src/lib/partners.ts` — add `networks` to Partner interface

### What stays untouched
- Swap page, Bridge page — working correctly
- Admin Featured, Admin Payments UI — no code changes needed
- Directory, Map, Insights — no changes needed
- All existing edge functions except admin-listings — unchanged

