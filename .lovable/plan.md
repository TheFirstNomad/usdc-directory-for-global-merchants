## Goal

Make `/swap` on Arc Testnet succeed end-to-end without the generic "Swap request failed" error.

## What I found

I inspected `@circle-fin/app-kit@1.4.1` (current installed version) and our `arcAppKit.ts`. Three real bugs are stacking on top of each other:

1. **`globalThis.fetch` patch is racey.** `withCircleProxy` swaps `globalThis.fetch` only for the duration of `kit.swap()`, but the SDK builds its HTTP client once at construction time and may hold its own reference to the original `fetch`. When that happens, the proxy is bypassed, the browser hits `api.circle.com` directly, CORS blocks it, and the SDK throws a generic network error — which matches what we see: zero `circle-proxy` invocations in the edge logs even though the user clicked Swap.

2. **Wallet chain mismatch.** We skip the `wrongChain` check on Arc (`src/pages/Swap.tsx:61`) because wagmi can't auto-switch, but Reown's `useAppKitProvider("eip155")` returns the EIP-1193 provider for whatever EVM chain the wallet is actually on (usually Base or Ethereum). The Circle SDK then calls `eth_chainId` on that provider, sees it's not `5042002`, and rejects before any HTTP call.

3. **Payload shape is slightly off for v1.4.x.** The SDK now expects `from.chain` as the `SwapChain` enum value (or its exact string `"Arc_Testnet"` — which we already pass, good) and a `config` block with `slippageBps`. We currently pass only `{ kitKey }`, so the SDK falls back to a default that on Arc Testnet rejects the quote.

## Fixes

All changes are frontend-only. No backend, no schema, no new secrets.

### 1. `src/lib/arcAppKit.ts`

- **Install the proxy globally, once, at module load** (not per-call). Patch `globalThis.fetch` immediately so every request from the SDK to `api.circle.com` is rewritten to our `circle-proxy` edge function, regardless of when the SDK captured its fetch reference. Keep the retry/backoff logic for 5xx/429. This is the single biggest fix.
- **Add `ensureArcChain(provider)`** that calls `wallet_switchEthereumChain` to `0x4cf532` (5042002) and, if that fails, `wallet_addEthereumChain` with Arc Testnet's RPC + USDC native currency metadata, then retries the switch. Called inside `createViemAdapterFromWallet` before returning the adapter.
- **Update `swapViaKit` payload** to include `config: { slippageBps: <bps>, allowanceStrategy: 'approve', kitKey: ARC_KIT_KEY }`. Accept a `slippage` arg (default 0.5%) so the UI can pass the user's chosen slippage.
- Keep all the diagnostic `console.debug` checkpoints so we can confirm the path on the next run.

### 2. `src/lib/swap/useSwap.ts`

- Pass `slippage` from the hook into `swapViaKit`.
- Tighten the error mapping: when the proxy responds 4xx with a Circle error body, surface Circle's `message` field verbatim instead of overwriting it with the generic line.

### 3. `src/pages/Swap.tsx`

- Before calling `swap()`, await `ensureArcChain(walletProvider)` so the user is prompted to switch/add Arc Testnet in their wallet rather than failing silently. Show a toast on rejection.
- The cosmetic "Swap Tokens on Base" heading already got fixed last round — no change needed.

### Out of scope

- Bridge (`/bridge`) and listing-fee `kit.send()` already work and aren't touched.
- Base Mainnet swap path is untouched.
- No package updates — we stay on `@circle-fin/app-kit@1.4.1`.

## Verification

After the changes, on `/swap`:

1. Switch chain selector to Arc Testnet.
2. Connect wallet → wallet prompts to add/switch to Arc Testnet → approve.
3. Enter `1 USDC → EURC`, click Swap.
4. Expected console trail:
   ```
   [arcAppKit] createViemAdapter ok
   [arcAppKit] ensureArcChain → switched
   [swapViaKit] kit.swap invoked
   [circle-proxy] POST /v1/stablecoinKits/swap/createSwap (attempt 1/3)
   [swapViaKit] kit.swap returned { txHash: 0x... }
   ```
5. Expected edge function logs: a fresh `circle-proxy` invocation with status `200`.
6. Success modal appears with an ArcScan link.

If any step still fails, the new logs name the exact layer and a follow-up fix lands in the same file.
