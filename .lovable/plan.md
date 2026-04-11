

## Fix: Re-enable Arc Testnet Swap

### I Was Wrong

The official Arc docs explicitly say: **"Among testnets, only Arc Testnet supports Swap (USDC and EURC only)."** Arc Testnet swap IS supported. The "Failed to fetch" error was likely caused by the adapter/provider wiring, not a platform limitation. I incorrectly disabled the swap UI for Arc.

**Your kit key is fine. No changes needed there.**

### What needs to change

**1. `src/pages/Swap.tsx` — Remove the Arc block**

Delete the entire `isArcTestnet` conditional block (lines 213-253) that shows "Swap Not Available on Testnet" and replaces the swap form. Instead, always show the swap form for both chains. Keep the Arc info banner but change it to say "USDC ↔ EURC swap via Circle App Kit" (informational, not blocking).

**2. `src/lib/arcAppKit.ts` — Fix the adapter for better provider detection**

The current `createViemAdapterFromWallet` uses raw `window.ethereum` which may not match the wallet actually connected through Reown AppKit. This is the likely cause of "Failed to fetch" — the adapter gets a stale/wrong provider. Fix to try Reown's provider first, then fall back to `window.ethereum`.

**3. `src/lib/swap/useSwap.ts` — Better Arc error messages**

Add a specific catch for "createSwap failed" / "Failed to fetch" errors to show a helpful message like "Swap request failed. Ensure your wallet is connected to Arc Testnet and try again." instead of the raw SDK error.

### Files to edit
- `src/pages/Swap.tsx` — remove Arc swap block, show swap form for all chains
- `src/lib/arcAppKit.ts` — improve adapter provider detection
- `src/lib/swap/useSwap.ts` — better error handling for Arc swap failures

### Summary
The swap code (`swapViaKit`, `useSwap` Arc path) is correctly wired. The only real issues are: (1) the UI blocks Arc swap entirely, and (2) the wallet adapter may grab the wrong provider. Both are quick fixes.

