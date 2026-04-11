

## Deep Scan Results and Fix Plan

### Root Cause: Arc Testnet Swap

The official Circle Arc docs explicitly state:

> **"Swap is not available on Arc Testnet and other testnets. Use mainnet for Swap."**

This is a **platform limitation** — `kit.swap()` will never work on Arc Testnet regardless of code changes, key rotation, or domain whitelisting. The "createSwap failed: Failed to fetch" error is the Circle API rejecting the request because swap is not a supported operation on testnets.

**Your Kit Key is fine. No need to delete or regenerate it.**

### What Actually Works on Arc Testnet
- `kit.send()` — sending USDC (listing payments) — **works**
- `kit.bridge()` — bridging USDC between Sepolia and Arc — **works** (the multi-signature flow you saw is normal CCTP behavior)
- `kit.swap()` — **not supported on any testnet**

### The Plan

**1. Remove Arc swap and show honest messaging**

On the Swap page, when Arc Testnet is selected, replace the swap form with a clear message: "Swap is only available on mainnet chains. Switch to Base to swap, or use the Bridge to move USDC to/from Arc Testnet." Include a button to switch to Base and a link to the Bridge page.

Files: `src/pages/Swap.tsx`, `src/lib/swap/useSwap.ts`

**2. Fix Bridge page — remove fragile `Blockchain` enum dependency**

The bridge currently imports `Blockchain` from `@circle-fin/app-kit`. While this enum exists in the current installed version, using string literals (`"Ethereum_Sepolia"`, `"Arc_Testnet"`) is safer and matches the official docs. Also improve error messages for bridge failures.

Files: `src/pages/Bridge.tsx`

**3. Keep Arc as default chain, clean up Base/testnet mixing**

Arc Testnet stays as the default selected chain. On Base Mainnet, hide faucet links and testnet messaging. On Arc, show bridge and send as the available actions, with swap clearly marked as mainnet-only.

Files: `src/pages/Swap.tsx`, `src/components/ArcPaymentPanel.tsx`

### Summary

| Feature | Arc Testnet | Base Mainnet |
|---------|------------|--------------|
| Swap | Not supported (Circle limitation) | Works via Uniswap V3 |
| Bridge | Works (Sepolia ↔ Arc) | Not applicable |
| Send/Pay | Works via kit.send() | Works via kit.send() |

The code changes are small and surgical — disable the Arc swap path with a helpful redirect, harden the bridge imports, and clean up UI messaging.

