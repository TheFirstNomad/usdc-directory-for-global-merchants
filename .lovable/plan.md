

## Temporary: Disable Swap on Arc Testnet with "Coming Soon" State

### Summary
When the user selects Arc Testnet on the Swap page, replace the entire swap form with a clean "Coming Soon" banner. Base mainnet swap remains fully functional. Also fix the runtime error ("Component is not a function") likely caused by the `forwardRef` wrapper on `SuccessModal`.

### Changes

**1. `src/pages/Swap.tsx`**
- After the chain selector and Arc Testnet info banner, add a conditional: if `isArcTestnet`, render a "Coming Soon" card instead of the swap form
- The card will include:
  - Heading: "USDC ↔ EURC Swap on Arc Testnet — Coming Soon"
  - Subtext explaining Circle App Kit integration is in progress, with suggestion to swap on Base
  - Disabled purple gradient button: "Swap Coming Soon"
  - "Get test USDC" faucet link
  - Static rate display: "1 USDC ≈ 0.926 EURC"
- All existing swap UI (pay/receive inputs, action buttons, details, modals) wrapped in `!isArcTestnet` condition
- No other pages or components touched

**2. `src/components/swap/SuccessModal.tsx`** (runtime error fix)
- The `forwardRef` wrap may be causing the "Component is not a function" error since the parent doesn't pass a ref. Revert to a plain function component (remove `forwardRef`) to fix the crash.

### What stays untouched
- Base mainnet swap — fully operational
- Bridge, directory, maps, admin, listings — all unchanged
- All hooks, tokens, chains, contracts — unchanged

