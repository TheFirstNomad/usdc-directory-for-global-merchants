
Goal: make Arc Testnet the default selected chain and ship a working Arc swap, bridge, and listing-payment flow without breaking Base Mainnet.

What the deep scan found
- `VITE_ARC_KIT_KEY` is not currently present in the Vite-exposed environment, so the browser build is not getting a proper Arc kit key.
- `src/lib/arcAppKit.ts` explicitly blocks Arc swaps in `swapViaKit()`, even though the Arc quickstart shows Arc Testnet swap is supported with `chain: "Arc_Testnet"` and `config: { kitKey }`.
- `src/pages/Swap.tsx` also disables Arc swap in the UI and shows a false “not available on testnet” banner.
- `src/lib/arcAppKit.ts` builds the bridge request incorrectly: `to` is missing `adapter`. The Arc bridge docs/types require `to: { adapter, chain }`. This directly matches your `Invalid parameters: to: Invalid input` screenshot.
- `src/components/Web3Provider.tsx` only registers Base + Arc. Ethereum Sepolia is missing, so Sepolia↔Arc bridge routes cannot be handled correctly.
- `createViemAdapterFromWallet()` relies on `window.ethereum`, which is brittle for Reown/Wagmi-connected wallets.
- Chain state is inconsistent: `ChainContext` defaults to Base, and `Swap.tsx` keeps its own local chain state, so the header toggle and page state can drift and “mix” environments.

Why Arc swap is failing
- Right now it is not mainly a bad key problem. The app currently disables Arc swap in both the helper and the UI.
- Based on the current code scan, you do not need to regenerate the kit key first. The bigger issues are wrong request shape, missing environment wiring, missing Sepolia support, and wallet/provider wiring. I would only rotate the key if it still fails after those code fixes with an auth/origin-specific error.

Implementation plan
1. Fix the shared Arc App Kit helper
- Update `src/lib/arcAppKit.ts` to use the documented chain strings:
  - `8453 -> "Base"`
  - `5042002 -> "Arc_Testnet"`
  - bridge route support for `"Ethereum_Sepolia"`
- Remove the hard-coded Arc swap block.
- Pass `config: { kitKey: import.meta.env.VITE_ARC_KIT_KEY }` on swap calls.
- Fix bridge params so both `from` and `to` include the adapter where required.
- Keep the named exports stable so no earlier TS/build errors come back.

2. Fix environment + wallet wiring
- Configure `VITE_ARC_KIT_KEY` as a real Vite environment variable for the project, then stop relying on fallback behavior.
- Refactor adapter creation to use the active connected wallet provider/client from the Reown/Wagmi stack instead of only `window.ethereum`.
- Keep the wallet flow EVM-only so bridge/swap do not trigger unrelated Bitcoin/Solana/Tron-style prompts.

3. Repair the Arc product flows
- `src/pages/Swap.tsx`: re-enable Arc swap, remove the wrong “not available” banner, and restrict Arc to the supported stablecoin route.
- `src/pages/Bridge.tsx`: fix request construction, add source-chain validation/switching, and support only the intended Sepolia↔Arc routes.
- `src/components/ArcPaymentPanel.tsx` and `src/pages/SubmitAIAgent.tsx`: keep listing/send payments on Arc working through `kit.send()` with the corrected adapter + chain wiring.
- Clean up stale Arc UI copy that currently contradicts the actual App Kit flow.

4. Make Arc the default and stop chain mixing
- Change `src/contexts/ChainContext.tsx` default from Base to Arc Testnet.
- Sync `/swap` page state with the global chain context so the header toggle and page selector cannot drift apart.
- Keep Base Mainnet clean when selected: no faucet/testnet bridge messaging on Base screens.

5. Verify before calling it fixed
- Build/type-check passes with no import/export regressions.
- Confirm the Arc swap request uses `chain: "Arc_Testnet"` and includes the kit key config.
- Confirm the bridge request uses a valid `to` object with both `adapter` and `chain`.
- Manual preview verification:
  - Arc is preselected on load
  - Arc swap: `5 USDC -> EURC`
  - Bridge reaches the wallet signature step correctly for Sepolia↔Arc
  - Listing payment on Arc requests a wallet signature and returns an explorer link
  - Base Mainnet still behaves as pure mainnet with no testnet mixing

Technical details
- Files to update: `src/lib/arcAppKit.ts`, `src/components/Web3Provider.tsx`, `src/pages/Swap.tsx`, `src/pages/Bridge.tsx`, `src/components/ArcPaymentPanel.tsx`, `src/pages/SubmitAIAgent.tsx`, `src/contexts/ChainContext.tsx`.
- Most likely root cause of the current bridge error is already visible in code: `bridgeUsdc()` violates the App Kit bridge contract.
- The current Arc swap failure is also already visible in code: the app is intentionally blocking Arc swaps despite the Arc docs supporting them.
