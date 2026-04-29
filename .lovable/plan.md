## Goal

Deploy a minimal soulbound ERC-721 contract on Base mainnet that issues a non-transferable "USDC Directory Listed" badge to each listed wallet. Mints are gated by an EIP-712 voucher signed by your backend after a verified listing payment. Users claim by submitting a tiny mint tx themselves.

## Architecture

```text
Listing payment (Base USDC transfer, ERC-8021 attributed)
        │
        ▼
submit-listing edge fn  ──►  partner row inserted
        │
        ▼
issue-badge-voucher edge fn  ──►  EIP-712 voucher { wallet, partnerId, tokenURI, nonce, deadline, sig }
        │
        ▼
Frontend "Claim Badge" button  ──►  contract.mintWithVoucher(voucher)
        │
        ▼
Soulbound NFT minted to user's wallet on Base
```

## Contract: `USDCDirectoryBadge.sol`

- **Standard:** ERC-721 with soulbound enforcement (override `_update` to revert on any non-mint, non-burn transfer; expose `locked(tokenId)` for ERC-5192-style indication).
- **Mint path:** `mintWithVoucher(Voucher v, bytes sig)` — verifies EIP-712 sig was produced by `signer` (backend address), checks `block.timestamp <= v.deadline`, checks `nonces[v.wallet] == v.nonce`, mints `tokenId = ++totalMinted` to `v.wallet`, stores `tokenURIs[tokenId] = v.tokenURI`, increments nonce, emits `BadgeMinted(wallet, tokenId, partnerId)`.
- **Owner controls:** `setSigner(address)`, `setBaseURI(string)` (fallback), `burn(tokenId)` for moderation. Owner = your treasury wallet.
- **Per-wallet limit:** one badge per wallet (mapping `hasBadge[wallet]`); reverts on second mint attempt. Re-listings reuse the same badge.
- **Gas:** ~90-110k per mint. User pays ~$0.005-0.02 on Base.

## Deployment (Foundry, you run locally)

New `contracts/` directory:

- `contracts/foundry.toml`
- `contracts/src/USDCDirectoryBadge.sol`
- `contracts/script/Deploy.s.sol` — deploys with constructor `(treasury, signerAddress, "https://usdc.directory/api/badge/")`
- `contracts/test/Badge.t.sol` — covers mint, soulbound revert, voucher replay, deadline, owner-only.
- `contracts/README.md` — exact commands:
  ```
  cd contracts
  forge install OpenZeppelin/openzeppelin-contracts
  forge test
  forge script script/Deploy.s.sol --rpc-url https://mainnet.base.org \
    --private-key $DEPLOYER_PK --broadcast --verify \
    --etherscan-api-key $BASESCAN_API_KEY
  ```
- After deploy, you paste the address into `src/lib/badge.ts` (constant `BADGE_CONTRACT_ADDRESS`).

Your deploy key never enters Lovable. Estimated deploy cost on Base: ~$0.50-1.50.

## Backend signer

- New Lovable Cloud secret: `BADGE_SIGNER_PRIVATE_KEY` (a fresh wallet, zero ETH needed — only signs off-chain). I'll prompt you to add it via the secrets tool.
- New edge function `issue-badge-voucher`:
  - Input: `{ wallet_address, partner_id, signature }` where `signature` proves wallet ownership (EIP-191 over a nonce, same pattern as your admin auth).
  - Verifies: partner exists, `partners.wallet_address == wallet_address`, `payment_status = 'confirmed'`, no prior voucher issued (new column).
  - Returns: `{ voucher: {...}, signature }` signed via `viem`'s `signTypedData` with `BADGE_SIGNER_PRIVATE_KEY`.
- Schema migration: add `badge_voucher_issued_at timestamptz`, `badge_token_id integer`, `badge_tx_hash text` to `partners`. New columns nullable.

## Metadata endpoint

- New edge function `badge-metadata` (public, no JWT):
  - Route: `GET /functions/v1/badge-metadata?token_id=N` (also reachable via your custom domain rewrite as `https://usdc.directory/api/badge/{N}.json` if you wire a Vite/Cloudflare rewrite later — for now, contract `baseURI` points directly at the function URL).
  - Returns ERC-721 JSON: `name: "USDC Directory Listed — {partner.name}"`, `description`, `image: partner.logo_url || gradient SVG fallback`, `attributes: [{trait_type:"Categories", value:...}, {trait_type:"Region", value:...}, {trait_type:"Listed", value: created_at}]`.
  - Looked up by `badge_token_id` join on `partners`.

## Frontend

- `src/lib/badge.ts` — contract address, ABI (just `mintWithVoucher` + `hasBadge` + `tokenOfOwner`), helpers.
- `src/components/BadgeClaimPanel.tsx` — shown on success screen of `ArcPaymentPanel` and on `MyListings` for any unclaimed paid Base listing:
  - Calls `issue-badge-voucher`, then `useWriteContract` → `mintWithVoucher`.
  - Auto chain-switch to Base 8453 (reuse existing `useSwitchChain` pattern).
  - Success state: BaseScan link + OpenSea link + "Use this for Guild.xyz" copy block with the contract address.
- `MyListings` page: badge status chip ("Claim badge" / "Badge #123 minted") with link.

## Guild.xyz integration notes

- Once deployed, Guild rule: **"Hold ≥1 of contract `0x…` on Base"** — works out of the box because it's a standard ERC-721 `balanceOf` check.
- Soulbound nature means the gate can't be sybil-farmed by transferring one NFT around.

## Files

**New:**
- `contracts/foundry.toml`
- `contracts/src/USDCDirectoryBadge.sol`
- `contracts/script/Deploy.s.sol`
- `contracts/test/Badge.t.sol`
- `contracts/README.md`
- `src/lib/badge.ts`
- `src/components/BadgeClaimPanel.tsx`
- `supabase/functions/issue-badge-voucher/index.ts`
- `supabase/functions/badge-metadata/index.ts`

**Modified:**
- `src/components/ArcPaymentPanel.tsx` — render `<BadgeClaimPanel/>` in Base success state.
- `src/pages/MyListings.tsx` — badge status + claim entry point.
- `supabase/config.toml` — `verify_jwt = false` for `badge-metadata` (public read).

**Migration:**
- `partners` add columns: `badge_voucher_issued_at`, `badge_token_id`, `badge_tx_hash`.

## Out of scope (intentional)

- No auto-mint on payment (user-driven mint keeps gas off treasury and avoids hot keys on-chain).
- No batch re-mint of historical listings — I'll add a one-shot admin script you can run to issue vouchers for existing paid Base listings (separate follow-up).
- Arc Testnet listings don't get a badge (different chain).

## Open items I'll handle during implementation

- Generate the badge signer wallet locally and walk you through pasting its address into the deploy script and its private key into Lovable secrets.
- Provide exact `forge` and `cast verify-contract` commands for BaseScan verification.
- After you deploy, paste me the address — I'll wire it into `src/lib/badge.ts`.
