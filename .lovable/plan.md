

## Fix: "Invalid App Configuration" — Reown AppKit Network Setup

### Problem
The wallet modal shows "Invalid App Configuration" because the network object is manually defined with an incorrect format. The runtime error confirms: `Invalid CAIP-2 network id: eip155:eip155:5042002` — the library internally prepends `eip155:` to the `id`, causing a double prefix.

### Solution
Import `base` directly from `@reown/appkit/networks` instead of manually defining the network object. This is the official approach per Reown docs.

### Changes

**`src/components/Web3Provider.tsx`**
- Replace the manual `baseMainnetNetwork` object with: `import { base } from '@reown/appkit/networks'`
- Use `base` in both `WagmiAdapter({ networks: [base] })` and `createAppKit({ networks: [base] })`
- Remove the entire `baseMainnetNetwork` block (lines 9–28)

The rest of the file (metadata, theme, queryClient, provider component) stays the same.

