

# Circle App Kit status: still installed and wired up

Short answer: **No — Circle App Kit was not removed.** The recent dependency change only touched `wagmi` (downgraded from a non-existent v3 to the correct v2), plus added `@wagmi/core` and `@wagmi/connectors` as peers. Nothing Circle-related was uninstalled or rewired.

## What's still in place

- **`@circle-fin/app-kit`** and **`@circle-fin/adapter-viem-v2`** remain in `package.json` and are imported by `src/lib/arcAppKit.ts`.
- `src/lib/arcAppKit.ts` is unchanged and still exports:
  - `payListingFee()` — used by listing/AI agent submission flows
  - `swapViaKit()` — used by the Swap page
  - `bridgeUsdc()` — used by the Bridge page
  - `createViemAdapterFromWallet()` — adapter creation from the connected wallet
- `supabase/functions/circle-proxy/index.ts` — the CORS proxy edge function — is unchanged and still routes `api.circle.com` calls.
- `VITE_ARC_KIT_KEY` and the `ARC_KIT_KEY` server secret are untouched.
- Treasury wallet `0x13FA78ab20762c8F49B58D44DBc177a2Adb94D7c` and the Arc Testnet chain config in `Web3Provider.tsx` are unchanged.

## Why the wagmi change doesn't affect Circle

Circle App Kit operates through the Viem adapter (`createViemAdapterFromProvider`), which wraps the raw EIP-1193 provider from the wallet. It does **not** depend on wagmi's React hooks or config shape, so pinning wagmi to v2 has zero impact on payments, swaps, or bridges.

## What to do next

1. Click **Publish → Update** to ship the wagmi v2 fix to `usdc.directory`.
2. After republish, open the wallet modal, connect, and try a small Arc Testnet payment or swap to confirm Circle App Kit still executes end-to-end.

If anything Circle-related misbehaves after publish, share the console error and I'll debug — but based on the code on disk right now, the integration is fully intact.

