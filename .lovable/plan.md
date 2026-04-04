

# Swap Page: Testing, Mobile, and Arc Testnet Tokens

## Summary

Three tasks: (1) browser-test the swap page end-to-end, (2) verify mobile responsiveness, and (3) add Arc Testnet tokens with realistic swap support. The key discovery is that **Arc Testnet has no Curve Router NG deployed** — the only swappable tokens are USDC (native), EURC, and USYC, and there's no confirmed DEX router on-chain yet. We'll implement the best feasible approach.

---

## Arc Testnet Reality Check

From the official Arc docs (`docs.arc.network/arc/references/contract-addresses`):
- **USDC**: native gas token; ERC-20 interface at `0x3600000000000000000000000000000000000000` (6 decimals)
- **EURC**: `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` (6 decimals)
- **USYC**: `0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C` (6 decimals, permissioned — requires allowlisting)
- **No WETH** — Arc is USDC-native, not ETH-native
- **No Curve Router NG** deployed on Arc Testnet yet (Curve is listed as a launch participant but no contract address exists)
- **StableFX FxEscrow** exists at `0x867650F5eAe8df91445971f14d89fd84F0C9a9f8` for USDC/EURC settlement, but it's RFQ-based (not a simple AMM swap)

---

## Plan

### Task 1: Fix console errors
- Remove the stale `WalletConnect.tsx` HMR reference (likely an import somewhere referencing a deleted file)
- Fix the `forwardRef` warning on `PartnerCard` and `Header` components

### Task 2: Add Arc Testnet tokens
Update `src/lib/swap/tokens.ts`:
- Add **EURC** token (`0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a`, 6 decimals)
- Keep **USDC** as native gas token
- Add popular pairs: `USDC/EURC`
- Do NOT add WETH (doesn't exist on Arc)
- Do NOT add USYC (requires institutional allowlisting)

### Task 3: Arc Testnet swap — honest UX approach
Since no DEX router is deployed on Arc Testnet, we have two options:

**Option A (Recommended):** Show Arc Testnet with token balances and a clear message: "DEX routing coming soon — Curve and Uniswap are expected to deploy on Arc mainnet." Users can still view balances, select tokens, and see the UI, but the swap button says "No DEX available yet" instead of pretending swaps work.

**Option B:** Implement a simple direct ERC-20 transfer between USDC↔EURC using the StableFX FxEscrow contract. This is more complex and the StableFX API may require off-chain RFQ coordination.

### Task 4: Mobile responsiveness verification
- Test the swap card layout at 375px and 414px widths
- Ensure token selector buttons, input fields, and the reverse arrow are properly sized for touch
- Verify the chain selector tabs don't overflow on small screens

### Task 5: Clean up swap page
- Remove the disabled "No trading pairs on Arc Testnet yet" button (replaced with EURC pair)
- Add EURC fiat price estimation (~1.08 USD)
- Update `FIAT_PRICES` map in Swap.tsx

---

## Files to modify

| File | Changes |
|------|---------|
| `src/lib/swap/tokens.ts` | Add EURC to `ARC_TESTNET_TOKENS`, add USDC/EURC popular pair |
| `src/lib/swap/chains.ts` | No changes needed |
| `src/pages/Swap.tsx` | Add EURC fiat price, update Arc swap button logic |
| `src/lib/swap/useSwap.ts` | Guard Arc Testnet swaps (no router available) |
| `src/lib/swap/useQuote.ts` | No changes (already disabled for non-Base chains) |

