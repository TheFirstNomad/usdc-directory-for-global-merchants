

# Deep Analysis: USDC Directory App — What's Working vs What's Broken

## Critical Data Issue Found

The most serious problem is **not related to the logo removal** — it's a data integrity issue from the CSV import:

**All 1,171 merchants have:**
- `categories = []` (empty array)
- `website = NULL`
- Only `name`, `description`, and `logo_url` were populated

This means:
- Category filtering does nothing (no merchants match any category)
- "Visit Site" button never appears on merchant detail pages (website is null)
- AI Agents page shows zero results (filters on category "AI Agents")
- Insights charts show empty/zero data for categories
- USDC Score is not populated

---

## What's Working

| Feature | Status | Notes |
|---|---|---|
| **Header text branding** | Working | "USDC Directory" gradient text renders correctly, no logo dependency |
| **Footer text branding** | Working | Clean text-only branding |
| **Directory page loads** | Working | 1,171 merchants load and display |
| **Partner cards** | Working | Cards render with Clearbit logo fallback |
| **Search** | Working | Name/description search functions |
| **Merchant detail page** | Working | Loads partner data, shows description, region |
| **Wallet Connect** | Working | Reown AppKit integration intact |
| **Theme toggle** | Working | Dark/light mode works |
| **Swap page structure** | Working | Token config uses local `/tokens/*.png` paths |
| **Admin page structure** | Working | CRUD edge function is properly coded |
| **Featured carousel** | Working | (but 0 featured merchants currently) |
| **Routing** | Working | All routes defined and functional |
| **Database** | Working | 1,171 rows in partners table, `partners_public` view exists |

---

## What's Broken / Not Working

### 1. Empty Categories (Critical)
- All 1,171 merchants have `categories = []`
- Category filter sidebar has zero matches
- AI Agents page returns 0 results (filters on category)
- Insights category chart shows nothing meaningful

### 2. Missing Website URLs (Critical)
- All merchants have `website = NULL`
- "Visit Site" button never appears on merchant detail pages
- Clearbit logo fallback generates bad URLs (appends `.com` to business name)

### 3. Zero Featured Merchants
- `featured_count = 0` — Featured carousel is empty

### 4. Residual Logo References (Minor)
- `src/components/Logo.tsx` still exists (references `/usdc-directory-logo.png`) — unused but leftover
- `AdminListings.tsx` line 251: `onError` fallback still points to `/usdc-directory-logo.png`

### 5. Seeded Names Blocklist in MerchantDetail (Minor)
- Lines 51-56: Hardcoded `seededNames` Set is stale/irrelevant — none of these names exist in the new 1,171 merchant dataset

### 6. Category Colors Mismatch
- `PartnerCard.tsx` and `MerchantDetail.tsx` have old category color maps (Payments, Wallets, DeFi, RWA, etc.) that don't match the new 19-category list from `CATEGORIES`

### 7. Favicon
- Uses default Vite favicon (`/vite.svg`) — not branded

### 8. Token Icons for AERO/DEGEN
- Swap page: AERO and DEGEN tokens both use `/tokens/eth.png` as placeholder instead of their own icons

---

## Recommended Fix Plan

### Step 1: Fix merchant data (highest priority)
- Run a migration or data update script to populate `website` and `categories` columns from the original CSV data (the CSV had these fields but they weren't imported)
- Re-parse the CSV and update existing rows by matching on `name`

### Step 2: Clean up stale code
- Delete `src/components/Logo.tsx` (unused)
- Remove `seededNames` blocklist from `MerchantDetail.tsx`
- Update `AdminListings.tsx` onError fallback to use USDC logo URL instead of deleted PNG
- Update category color maps in `PartnerCard.tsx` and `MerchantDetail.tsx` to match the 19 new categories

### Step 3: Set some merchants as featured
- Either via admin dashboard or a migration, mark a few merchants as `featured = true`

### Step 4: Minor cleanup
- Replace Vite favicon with a proper branded one (or USDC coin icon)
- Add distinct icons for AERO and DEGEN tokens on swap page

---

## Summary

The logo removal itself is clean — Header and Footer use text-only branding correctly. The real issues are **data gaps from the CSV import** (empty categories, null websites) which cause multiple features to appear broken. Fixing the data will restore category filtering, the Visit Site button, the AI Agents page, and Insights charts.

