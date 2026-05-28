## Deep audit: Arc Testnet swap failure

The error "Swap request failed. Ensure your wallet is connected to the correct network and try again." is being thrown, but the **circle-proxy edge function shows zero recent invocations** — meaning the failure happens *before* any request ever reaches Circle. The retry layer we added last week is masking the real upstream cause.

### Diagnosis goals

Walk every layer of the Arc swap pipeline, isolate where execution stops, and fix it. The five candidates, in order of likelihood:

1. **Adapter creation** — `createViemAdapterFromWallet(walletProvider)` may be throwing because Reown's `useAppKitProvider('eip155')` returns `undefined` on Arc Testnet (Arc isn't a registered EVM chain in the AppKit config, so the provider hook may return nothing even though the wallet is "connected").
2. **Kit signature mismatch** — `@circle-fin/app-kit@^1.3.0` may have changed the `kit.swap()` payload shape. We currently pass `{ tokenIn: "USDC", tokenOut: "EURC", amountIn, config: { kitKey } }`. The SDK might now require token addresses, a different `chain` enum value, or no inner `config` block.
3. **Kit key invalid/revoked** — `VITE_ARC_KIT_KEY` may have expired or been rotated. The proxy returns 500 instantly in that case but we never see it because step 1 or 2 fails first.
4. **Proxy auth (the previous fix)** — `withCircleProxy` adds `Authorization: Bearer <anon>` + `apikey`. If the publishable key was rotated, every proxied call 401s. But this would still produce a `[circle-proxy]` log line, which we don't see.
5. **Hardcoded UI string** — the card says "Swap Tokens on Base" even on Arc; this is just a cosmetic SEO/heading bug, unrelated to the failure, but I'll fix it while I'm in the file.

### Investigation steps

1. Add structured `console.log` checkpoints in `useSwap.swap()` (Arc branch) and in `arcAppKit.swapViaKit`:
   - `[swap] start` with `{ walletProvider: !!walletProvider, chainId, tokenIn, tokenOut, amount }`
   - `[swap] adapter ok`
   - `[swap] kit.swap invoked`
   - `[swap] kit.swap result` / `[swap] kit.swap error <full err>`
2. Reproduce the failure in the live preview to capture which checkpoint is the last one printed.
3. Based on the last checkpoint:
   - **Stops at `start` with `walletProvider: false`** → fix Web3Provider/AppKit config to register Arc Testnet as an EIP-155 chain so `useAppKitProvider('eip155')` returns the provider object on Arc.
   - **Stops at `adapter ok`** → SDK call itself rejected. Print the full error and adjust `kit.swap` arguments (likely: pass token *addresses* instead of symbols, or drop the inner `config.kitKey`). Cross-check against `@circle-fin/app-kit` v1.3.0 type definitions in `node_modules`.
   - **Reaches `kit.swap invoked` but no proxy log** → SDK is throwing during request construction (e.g. unknown token symbol on Arc). Fix the token map for Arc Testnet.
   - **Proxy is hit but returns 401/500** → rotate/refresh `VITE_ARC_KIT_KEY` and/or `VITE_SUPABASE_PUBLISHABLE_KEY`.

### Fixes that will land

- **`src/lib/arcAppKit.ts`** — add the diagnostic logs above (kept as `console.debug`, not removed), and apply whichever signature/argument fix the diagnosis points to.
- **`src/lib/swap/useSwap.ts`** — surface the real underlying error message in `errorMessage` instead of the generic "Swap request failed…" so users see something actionable (e.g. "Wallet provider unavailable on Arc Testnet"). Keep the retry layer.
- **`src/components/Web3Provider.tsx`** — if step 1 is the culprit, register Arc Testnet in the AppKit `networks` array so the EIP-1193 provider is returned on Arc.
- **`src/pages/Swap.tsx`** — fix the hardcoded "Swap Tokens on Base" heading and the matching `<SEO>` title to reflect the selected chain.
- **No backend/schema changes.** `circle-proxy` stays as-is unless step 4 turns out to be the cause.

### Verification

1. Reload preview → open `/swap` → switch to Arc Testnet → connect wallet → enter 1 USDC → EURC → click Swap.
2. Confirm in the browser console: `[swap] start → adapter ok → kit.swap invoked → [circle-proxy] POST /v1/stablecoinKits/swap/createSwap`.
3. Confirm in edge function logs: a fresh `circle-proxy` invocation with status 200.
4. Confirm the wallet prompts for signature, the tx is broadcast, and the success modal appears with the ArcScan link.
5. If any step still fails, the new logs will pinpoint it and a follow-up fix lands in the same area.
