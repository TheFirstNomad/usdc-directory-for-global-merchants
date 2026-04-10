

## Plan: Wholesale UX & Functional Improvements

### 1. Wallet Modal Simplification
The wallet modal is controlled by Reown AppKit (`createAppKit` in `Web3Provider.tsx`). We'll disable built-in features (swap, send, onramp, activity) via the `features` config so the connected wallet view only shows Disconnect.

**File: `src/components/Web3Provider.tsx`**
- Add `features: { email: false, socials: false, swaps: false, send: false, receive: false, onramp: false, history: false }` to the `createAppKit` config.

### 2. Remove Liquidity from Swap Page
Remove the Liquidity tab, the `LiquidityPanel` import, and all related conditional rendering from the Swap page.

**File: `src/pages/Swap.tsx`**
- Remove `LiquidityPanel` import and the `Droplets` icon import used for the liquidity tab.
- Remove the `activeTab` state and the `Tabs`/`TabsList`/`TabsTrigger` block that shows Swap/Liquidity tabs.
- Remove the `{isArcTestnet && activeTab === "liquidity" && <LiquidityPanel />}` block.
- Remove unused imports (`Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`, `Droplets`).

**Files to delete:**
- `src/components/swap/LiquidityPanel.tsx`
- `src/lib/swap/useLiquidity.ts`

### 3. Remove Step 2 "Networks" from Submit Flow
**File: `src/pages/Submit.tsx`**
- Remove the "Networks" step from `STEPS` array (index 1).
- Remove the `toggleNetwork` function and the step 1 UI block.
- Remove the `NETWORKS` import from `@/lib/partners`.
- Remove the networks validation in `validateStep` (step === 1 check).
- Adjust step indices: Location becomes step 1, Preview becomes step 2, Payment becomes step 3.
- Remove `networks` from form state and `submissionData`.
- Remove networks display from Preview step.

### 4. Clean Up Location/Region Fields
**File: `src/lib/partners.ts`**
- Remove country-specific entries from `REGIONS` (Uganda, Kampala, Kenya, Nigeria, South Africa) — keep only continent-level + Global + Other.
- Remove corresponding entries from `REGION_FLAGS`.

**File: `src/pages/Submit.tsx`**
- Clear default values: `region` should default to `""` (empty) instead of `"Global"`.
- Country and City fields already have empty defaults — keep them. Remove placeholder text like "Uganda" and "Kampala" from the input placeholders.

### 5. Arc App Kit Fixes
**File: `src/lib/arcAppKit.ts`**
- Update `getAppKit()` to pass `{ kitKey: ARC_KIT_KEY }` when constructing `new AppKit()`.
- Update `swapViaKit`, `bridgeUsdc`, and `payListingFee` to pass `config: { kitKey: ARC_KIT_KEY }` in their respective kit calls.
- Improve error messages: catch common errors and return friendly strings.

**File: `src/components/ArcPaymentPanel.tsx`**
- Bridge label already correctly says "Sepolia → Arc Testnet" — confirm no changes needed.
- Improve error display with friendlier messages.

### 6. General Cleanup
- No NowPayments references remain (confirmed via search).
- Remove `PaymentModal.tsx` if it still exists (already deleted per earlier conversation).
- Remove `NETWORKS` export from `src/lib/partners.ts` since it's no longer used by Submit.

### Files Modified
1. `src/components/Web3Provider.tsx` — disable wallet modal features
2. `src/pages/Swap.tsx` — remove liquidity tabs
3. `src/pages/Submit.tsx` — remove Networks step, clean location defaults
4. `src/lib/partners.ts` — clean regions, remove NETWORKS
5. `src/lib/arcAppKit.ts` — pass kitKey to AppKit, improve errors
6. `src/components/ArcPaymentPanel.tsx` — friendly error messages

### Files Deleted
1. `src/components/swap/LiquidityPanel.tsx`
2. `src/lib/swap/useLiquidity.ts`

