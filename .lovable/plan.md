

## Fix: Chain ID double-prefix bug in Reown AppKit

**Problem**: WalletConnect fails with `"chain eip155:eip155:5042002 should conform to namespace:chainId format"`. The Arc Testnet chain is defined using viem's `defineChain()` and cast as `any` into AppKit, which double-prefixes the namespace.

**Root cause**: Reown AppKit expects networks defined with its own helper (`defineChain` from `@reown/appkit/networks`), not viem's `defineChain`. The viem chain object lacks the `caipNetworkId` property, so AppKit tries to auto-generate it incorrectly.

### Fix

**`src/components/Web3Provider.tsx`** — Define the Arc Testnet network using AppKit's expected format directly in this file, instead of importing from `src/lib/web3.ts`:

```ts
const arcTestnetNetwork = {
  id: "eip155:5042002",
  chainId: 5042002,
  name: "Arc Testnet",
  currency: "USDC",
  explorerUrl: "https://testnet.arcscan.app",
  rpcUrl: "https://rpc.testnet.arc.network",
  chainNamespace: "eip155",
} as const;
```

Pass this object (not the viem chain) to both `WagmiAdapter` and `createAppKit` `networks` arrays. Remove the `as any` casts.

**`src/lib/web3.ts`** — Keep unchanged (still used by wagmi hooks for transactions).

### Technical detail
- AppKit's network objects need `id` as `"eip155:5042002"` (string CAIP format) and a separate `chainId` as the number
- The viem chain definition stays for use with wagmi transaction hooks (`useSendTransaction`, etc.)

