# Add ERC-8021 Builder Code (bc_madq6cms) to Base swaps & approvals

1. Add `ox` dependency.
2. Create `src/lib/builderCode.ts` exporting `BUILDER_CODE`, `DATA_SUFFIX` (via `Attribution.toDataSuffix({ codes: ['bc_madq6cms'] })`), and `withAttribution(data)` helper that appends the suffix to hex calldata.
3. Edit `src/lib/swap/useSwap.ts` — Base branch only:
   - Add `useSendTransaction` from wagmi.
   - Approve: encode `approve(router, amount)` calldata, append suffix, send via `sendTransactionAsync({ to: tokenAddress, data, account, chainId })`. Keep allowance read & `needsApproval` logic intact.
   - Swap: keep existing `multicall` calldata build, append suffix, send via `sendTransactionAsync({ to: UNISWAP_V3_ROUTER, data, value: isNativeIn ? amountInParsed : 0n, account, chainId: 8453 })`.
   - Arc Testnet branch (Circle App Kit) untouched.
   - Preserve receipt waiting, error handling, state machine, txHash capture.
4. No changes to Web3Provider, arcAppKit, bridge, admin, or UI.