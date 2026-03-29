

## Replace RainbowKit with Reown AppKit + Rename to "Sign In"

**What changes**: Remove RainbowKit entirely, replace with Reown AppKit which supports direct browser extension wallets (MetaMask, etc.) AND WalletConnect QR for mobile. Rename "Connect Wallet" to "Sign In" everywhere.

### Dependencies
- **Install**: `@reown/appkit`, `@reown/appkit-adapter-wagmi`
- **Remove**: `@rainbow-me/rainbowkit`

### Files to modify

1. **`src/components/Web3Provider.tsx`** — Full rewrite:
   - Import `WagmiAdapter` from `@reown/appkit-adapter-wagmi`
   - Import `createAppKit` from `@reown/appkit/react`
   - Define Arc Testnet as an AppKit-compatible network object
   - Create adapter with project ID from `import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID`
   - Call `createAppKit()` at module level with metadata (name, description, URL, icon)
   - Export provider wrapping `WagmiProvider` + `QueryClientProvider` (no RainbowKitProvider)

2. **`src/components/Header.tsx`** — Replace RainbowKit `ConnectButton`:
   - Use `useAppKit()` for `open()` method, `useAppKitAccount()` for connection state
   - Rename button label from "Connect Wallet" to **"Sign In"**
   - Connected state shows truncated address; clicking opens account view
   - Same changes for both desktop and mobile menu

3. **`src/components/PaymentModal.tsx`** — Replace `<ConnectButton />` fallback:
   - Use `useAppKit()` to trigger `open()` instead of RainbowKit's ConnectButton
   - Label the fallback button "Sign In to Pay"
   - Keep all existing wagmi hooks (`useAccount`, `useSendTransaction`) unchanged

### What stays the same
- `src/lib/web3.ts` — chain config, treasury address, fees
- All wagmi transaction hooks throughout the app

