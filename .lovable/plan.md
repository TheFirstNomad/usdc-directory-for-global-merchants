

## Fix: Arc Testnet Swap "Failed to fetch"

### Root cause analysis

The swap SDK call (`kit.swap()`) throws "createSwap failed: Maximum retry attempts (3) exceeded: Failed to fetch". The bridge works with the same adapter, so the adapter creation isn't fundamentally broken. The issue is likely one of two things:

1. **Provider mismatch**: `window.ethereum` may not be the same provider that Reown AppKit connected through (especially with multiple wallet extensions). The Circle SDK needs the exact provider that has signing authority on Arc Testnet.

2. **Missing `capabilities` on adapter**: The SDK docs show `createViemAdapterFromProvider` accepts `capabilities: { addressContext: 'user-controlled' }` which may affect how the SDK resolves accounts for the swap API call.

### Changes

**1. `src/lib/arcAppKit.ts` — Use Reown's provider, add capabilities**

Instead of blindly using `window.ethereum`, get the actual provider from Reown AppKit's `getAppKitProvider` (non-hook version) or pass it in. Also add `capabilities: { addressContext: 'user-controlled' }` per the SDK docs.

Additionally, add detailed `console.error` logging before throwing so we can see the actual SDK error in the console.

**2. `src/lib/swap/useSwap.ts` — Log raw errors for debugging**

Add `console.error("Arc swap raw error:", err)` before the readable error conversion so we can see the full error object in console on next failure.

**3. `src/pages/Swap.tsx` — Pass wallet provider from Reown hook**

Use `useAppKitProvider('eip155')` in the Swap component to get the actual connected provider and pass it down through useSwap → createViemAdapterFromWallet, ensuring the Circle SDK gets the correct provider.

### Files to edit
- `src/lib/arcAppKit.ts` — accept optional provider param, add capabilities, add logging
- `src/lib/swap/useSwap.ts` — pass provider, add raw error logging  
- `src/pages/Swap.tsx` — get provider from `useAppKitProvider` and pass to useSwap

### Technical detail
The key change is threading the Reown provider through:
```
Swap.tsx (useAppKitProvider) → useSwap (provider param) → createViemAdapterFromWallet(provider) → createViemAdapterFromProvider({ provider, capabilities })
```

This ensures the Circle SDK uses the exact wallet connection rather than an arbitrary `window.ethereum` injection.

