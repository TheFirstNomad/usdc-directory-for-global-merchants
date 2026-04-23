

# End-to-end status: one real issue blocking wallets

## What's working
- UI/layout: Footer "Follow Us" column, Hero trust strip, shadcn sort dropdown, expanded category colors all rendering correctly at the current 1617px viewport.
- Edge function security: `await verifyAdmin(req)` confirmed in `admin-featured` and `admin-payments`; `submit-listing` has input validation, duplicate `tx_hash` rejection, and ownership checks.
- Production build passes cleanly.
- React ref warnings: gone in production; remaining dev-only warnings are from `lovable-tagger` and don't affect users.

## One real bug found

**`Buffer is not defined` — breaks Coinbase Wallet + modal UI injection**

The browser console shows:
```
Failed to import Coinbase Wallet SDK: ReferenceError: Buffer is not defined
Error injecting modal UI: ReferenceError: Buffer is not defined
```

Reown AppKit's Coinbase connector imports a CommonJS dependency that expects Node's global `Buffer`. Vite doesn't polyfill Node globals by default. Result: the wallet modal fails to fully initialize and Coinbase Wallet is unavailable. WalletConnect/MetaMask may still work, but the modal injection error is a serious reliability risk — every user opening the wallet picker hits this.

### Fix (one-pass, low risk)

1. Install `buffer` polyfill: `npm i buffer`
2. In `src/main.tsx`, add at the very top, before any other imports:
   ```ts
   import { Buffer } from "buffer";
   (window as any).Buffer = (window as any).Buffer || Buffer;
   ```
3. In `vite.config.ts`, add a `define` entry so libraries that reference `global` also resolve:
   ```ts
   define: { global: "globalThis" },
   ```

This is the standard Vite + Reown AppKit fix. No other behavior changes.

## Files touched
- `src/main.tsx` — prepend Buffer polyfill
- `vite.config.ts` — add `define: { global: "globalThis" }`
- `package.json` — add `buffer` dependency

## Verification after fix
- Reload `/`, open the wallet modal, confirm no `Buffer is not defined` errors and Coinbase Wallet appears as an option.

