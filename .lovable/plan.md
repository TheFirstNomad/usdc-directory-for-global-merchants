

## Fix Arc Testnet Swap & Related Issues

### Problem
The Arc Testnet swap fails with "Stablecoin Service createSwap failed: Maximum retry attempts (3) exceeded: Failed to fetch". The root cause is that `swapViaKit` passes the `Blockchain.Arc_Testnet` enum value as the `chain` parameter, but the official Circle docs require the **string literal** `"Arc_Testnet"`.

### Changes

**1. Fix `swapViaKit` in `src/lib/arcAppKit.ts`**
- Change `swapViaKit` to pass the chain as a **string literal** (`"Arc_Testnet"` or `"Base"`) instead of the `Blockchain` enum value
- Add a `toChainString` helper that maps `PaymentChainId` → the exact string the API expects
- Remove any remaining error suppression for Arc Testnet operations in `friendlyError`

```text
Chain ID mapping:
  8453    → "Base"
  5042002 → "Arc_Testnet"
```

The corrected swap call will match the docs exactly:
```ts
const result = await kit.swap({
  from: { adapter, chain: "Arc_Testnet" },  // string, not enum
  tokenIn,
  tokenOut,
  amountIn: amount,
  config: { kitKey: ARC_KIT_KEY },
});
```

**2. No changes needed to `useSwap.ts` or `Swap.tsx`**
- The hook already correctly delegates Arc swaps to `swapViaKit` — only the internal implementation of that function needs the fix.

### Technical Detail
The `Blockchain` enum from `@circle-fin/app-kit` may serialize to something other than the raw string `"Arc_Testnet"` when passed into `kit.swap()`. The docs explicitly use string literals. Switching to strings ensures the API receives the expected chain identifier.

