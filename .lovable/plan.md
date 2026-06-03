## Add cirBTC to Arc Testnet swaps

Swap is working — only adding the new token, no other changes.

### Changes

1. **`src/lib/swap/tokens.ts`**
   - Add cirBTC to `ARC_TESTNET_TOKENS`:
     - symbol: `cirBTC`
     - name: `Circle BTC`
     - address: `0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF`
     - decimals: 8
     - logo: `/tokens/btc.png`
   - Extend `POPULAR_PAIRS[5042002]` with `USDC/cirBTC` and `cirBTC/USDC` so users get one-click pairs.

2. **`src/lib/swap/useQuote.ts`** (display only)
   - Add a rough cirBTC display estimate when paired with USDC/EURC so the "You Receive" field shows a number before the swap. Actual execution stays on Circle App Kit, which is the source of truth.

Nothing else is touched — Arc swap flow, chain switching logic, and proxy stay exactly as they are now.