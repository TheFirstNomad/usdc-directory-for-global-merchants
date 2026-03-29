

## Store WalletConnect Project ID

The user provided their WalletConnect Project ID: `3592c16759a9b6907bc4eb5afd455b15`

Since `VITE_WALLETCONNECT_PROJECT_ID` is a **publishable key** (it's exposed client-side in every WalletConnect dApp), it's safe to store directly in the codebase.

### Steps

1. **Hardcode the Project ID in `src/components/Web3Provider.tsx`** — replace the fallback `"demo"` with the actual ID `3592c16759a9b6907bc4eb5afd455b15`

That's it. The `Web3Provider` already reads this value; we just need to set the real ID so RainbowKit can initialize properly.

