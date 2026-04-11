
Goal: fix the real Arc Testnet swap path without touching the working Base Mainnet flow.

What I found
- `src/lib/arcAppKit.ts` is still not aligned with the Arc docs. `kit.swap()` is currently receiving chain objects (`ArcTestnet`, `Base`) instead of the documented string literals `"Arc_Testnet"` and `"Base"`.
- The helper still uses a hardcoded kit key, so your updated allowed origins may be applied to one key while the app is still sending a different one.
- The adapter is built from `window.ethereum`, which is brittle when the connected wallet comes through Reown/Wagmi instead of a plain injected provider.
- Arc swap UI copy is still partially misleading (`Uniswap V2`, platform fee details) even though Arc swaps are executed through Circle App Kit.

Implementation plan
1. Rebuild `src/lib/arcAppKit.ts` around the documented API
   - Read `import.meta.env.VITE_ARC_KIT_KEY` instead of relying on hardcoded-only behavior.
   - Add a small chain mapper:
     - `8453 -> "Base"`
     - `5042002 -> "Arc_Testnet"`
   - Update `swapViaKit()` to use the exact documented shape:
     `kit.swap({ from: { adapter, chain }, tokenIn, tokenOut, amountIn, config: { kitKey } })`
   - Keep existing named exports stable so we do not reintroduce the earlier build/import errors.

2. Fix wallet/provider wiring
   - Refactor adapter creation so it can use the active connected wallet provider/client, not just `window.ethereum`.
   - Thread that through the existing callers (`useSwap.ts`, `ArcPaymentPanel.tsx`, `Bridge.tsx`, `SubmitAIAgent.tsx`) without changing their public behavior.

3. Tighten Arc-only swap behavior
   - Keep Base Mainnet exactly as-is (Uniswap V3 path unchanged).
   - Keep Arc on the Circle App Kit path only.
   - Ensure the verified Arc route is `USDC -> EURC`; if the reverse direction is not confirmed by the SDK during verification, gate it instead of pretending both paths are equally supported.
   - Remove misleading Arc-specific labels/details that imply a DEX route rather than Circle App Kit.

4. Improve failure handling
   - Replace the generic fetch-style failure with clearer Arc-specific errors for:
     - missing/invalid kit key
     - wrong or unavailable wallet provider
     - unsupported token/chain combination
     - origin/network request failures

5. Verify before calling it fixed
   - Confirm the build passes with no TypeScript/export regressions.
   - Inspect the actual outgoing Arc swap request and verify it uses:
     - `chain: "Arc_Testnet"`
     - `config.kitKey = import.meta.env.VITE_ARC_KIT_KEY`
   - Regression check Base swap still uses the old Uniswap V3 path.
   - End-to-end validation target: connect wallet, switch to Arc Testnet, swap `5 USDC -> EURC`, and confirm tx hash/explorer success. If wallet automation cannot complete the final signature in preview, I will still verify the exact request payload and leave only the wallet-confirm step to you.

Technical notes
- The main bug is in the shared App Kit helper, not just the `/swap` page.
- Your origin whitelist update may not be taking effect yet because the current code still appears to use the hardcoded key path.
- I will keep the fix narrow and surgical: Arc swap integration only, no unnecessary rewrites to the working Base flow.
