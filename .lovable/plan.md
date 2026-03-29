

# Admin Payment Monitor Dashboard

## Overview
Build a protected `/admin/payments` page that displays payment activity from the `submissions` table, gated to your owner wallet address (`0x13FA78ab20762c8F49B58D44DBc177a2Adb94D7c`).

## Architecture

Since the `submissions` table has RLS blocking all reads from the client, we need a secure edge function to fetch payment data server-side using the service role key, with wallet-based authorization.

```text
┌─────────────┐     ┌──────────────────────┐     ┌──────────────┐
│  Admin Page  │────▶│  admin-payments EF   │────▶│ submissions  │
│  (React)     │     │  (wallet auth check) │     │   table      │
└─────────────┘     └──────────────────────┘     └──────────────┘
```

## Steps

### 1. Create `admin-payments` edge function
- Accepts the caller's wallet address as a header or query param
- Validates it matches the hardcoded owner address
- Queries `submissions` table via service role for all records with `payment_status != 'pending'` from last 60 days
- Returns payment list + summary stats (total revenue today, this month, total paid, pending count)

### 2. Create `/admin/payments` page (`src/pages/AdminPayments.tsx`)
- **Access gate**: Only renders content when connected wallet matches the owner/treasury address; otherwise shows "Unauthorized"
- **Summary cards** at top: Revenue Today, Revenue This Month, Total Paid Listings, Pending Payments
- **Data table** with columns: Date, Company Name, Amount (USDC), Payment Status (badge), Payment ID, Wallet Address
- Search input + status filter dropdown (All / Pending / Confirmed / Failed)
- Refresh button + auto-refresh every 30 seconds via `setInterval`
- Loading skeletons, error toast, empty state
- Matches existing dark UI style (shadcn Card, Table, Badge, Input, Select)

### 3. Update routing (`src/App.tsx`)
- Add route: `<Route path="/admin/payments" element={<AdminPayments />} />`

### 4. Update navigation (`src/components/Header.tsx`)
- Conditionally add "Admin" nav link when `address?.toLowerCase() === TREASURY_ADDRESS.toLowerCase()`
- Both desktop and mobile nav

### Technical Details
- Owner wallet check uses `TREASURY_ADDRESS` from `src/lib/web3.ts`
- Edge function hardcodes the same owner address for server-side validation
- Amount display: listing = 10 USDC, update = 5 USDC (derived from submission context)
- Payment statuses from NOWPayments: `awaiting_payment`, `confirming`, `confirmed`, `sending`, `finished`, `failed`, `expired`
- The page URL will be: `https://usdc-directory.lovable.app/admin/payments`

