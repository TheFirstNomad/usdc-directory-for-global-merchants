

## Production Cleanup, Security Hardening & Bug Fixes

### Bugs Confirmed

1. **CRITICAL: Hardcoded Kit Key** in `arcAppKit.ts` — secret committed to source
2. **CRITICAL: Provider passed as address string** in `Bridge.tsx` (line 60), `ArcPaymentPanel.tsx` (lines 57, 75), and `SubmitAIAgent.tsx` (line 72) — causes `"t.request is not a function"` because `createViemAdapterFromWallet()` receives `"0x13FA..."` instead of an EIP-1193 provider object
3. **Treasury address casing mismatch** — `0x13fA78AB...` in `arcAppKit.ts` / `web3.ts` / `tokens.ts` vs user's canonical `0x13FA78ab...`
4. **Dead V2 ABIs** — `contracts.ts` has ~200 lines of unused V2 Router/Factory/Pair ABIs and Arc DEX constants that are never called

### Plan

**Priority 1 — Security fix: Remove hardcoded Kit Key**
- `src/lib/arcAppKit.ts`: Change to `const ARC_KIT_KEY = import.meta.env.VITE_ARC_KIT_KEY` with a runtime guard that logs a clear error instead of silently using a compromised key
- Remove the old fallback string entirely

**Priority 2 — Fix provider bug (Bridge, Payments, AI Agent Submit)**
- `src/pages/Bridge.tsx`: Import `useAppKitProvider` from `@reown/appkit/react`, get `walletProvider`, pass it to `createViemAdapterFromWallet(walletProvider)` instead of `address`
- `src/components/ArcPaymentPanel.tsx`: Same fix — import `useAppKitProvider`, thread `walletProvider` to both `handlePay` and `handleSwap`
- `src/pages/SubmitAIAgent.tsx`: Switch from `useAccount` (wagmi) to `useAppKitAccount` + `useAppKitProvider` (Reown), pass `walletProvider`

**Priority 3 — Modernize swap execution (use Circle App Kit for both chains)**
- `src/lib/swap/useSwap.ts`: Remove the entire Uniswap V3 router execution path (the `else` branch with `encodeFunctionData`, `multicall`, etc.). Use `swapViaKit()` for **both** Base and Arc. Remove `needsApproval` and `approve` (App Kit handles approvals internally). Keep `slippage` param for the hook interface but note it's handled by the SDK.
- `src/lib/swap/useQuote.ts`: Keep Uniswap V3 Quoter for Base (it's read-only, still useful for price display). Keep Arc estimate logic. No changes needed.
- `src/lib/swap/contracts.ts`: Remove `SWAP_ROUTER_ABI`, `V2_ROUTER_ABI`, `V2_FACTORY_ABI`, `V2_PAIR_ABI`, `ARC_V2_FACTORY`, `ARC_V2_ROUTER`. Keep only `ERC20_ABI`, `QUOTER_V2_ABI`, `UNISWAP_V3_QUOTER_V2`, and `UNISWAP_V3_ROUTER` (the router address is still referenced for allowance checks — actually, with App Kit handling execution, we can remove it too). Keep `ERC20_ABI` (used for balance reads) and `QUOTER_V2_ABI` + address.

**Priority 4 — Type safety & helper cleanup**
- `src/lib/arcAppKit.ts`: Create `extractTxHash(result: unknown): string` helper to deduplicate the 4 copy-pasted tx hash extraction blocks. Add JSDoc to all exports. Replace `any` with narrower types where possible.
- Unify treasury address to checksummed `0x13FA78ab20762c8F49B58D44DBc177a2Adb94D7c` across `arcAppKit.ts`, `web3.ts`, `tokens.ts`

**Priority 5 — Swap.tsx simplification**
- Remove `needsApproval` / `approve` button branch since App Kit handles approvals
- Keep all existing UX (QuoteTimer, SuccessModal, popular pairs, fiat prices, collapsible details, MAX, slippage)
- Reset quote and swap state on chain switch (already done in `handleChainChange`)

**Priority 6 — Better error messages**
- In `useSwap.ts` `getReadableSwapError`: Add specific message for CORS/domain issues: "Swap service unavailable. This may be a domain configuration issue — contact the admin."
- Add `console.error` with full error object before converting to readable message

### Files to edit
- `src/lib/arcAppKit.ts` — remove hardcoded key, add `extractTxHash`, JSDoc, fix treasury address
- `src/lib/swap/useSwap.ts` — use `swapViaKit` for both chains, remove V3 execution path, remove approval logic
- `src/lib/swap/contracts.ts` — remove dead V2 ABIs and unused router ABIs
- `src/pages/Swap.tsx` — remove approval UI, simplify button states
- `src/pages/Bridge.tsx` — fix provider bug
- `src/components/ArcPaymentPanel.tsx` — fix provider bug
- `src/pages/SubmitAIAgent.tsx` — fix provider bug, switch to Reown hooks
- `src/lib/web3.ts` — fix treasury address casing
- `src/lib/swap/tokens.ts` — fix treasury address casing

### What stays untouched
- All Supabase/auth/directory/map/admin pages (except the provider fix in SubmitAIAgent)
- `useQuote.ts` — Uniswap V3 Quoter is still used for Base price display
- All UI components, modals, headers, footers
- Edge functions

