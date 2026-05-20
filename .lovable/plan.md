
# Open paid self-listing to every chain — EVM + Solana + Sui + Near

## Credit estimate (read before approving)
**~8–10 build credits total.** Drop the broadcast script to save ~1. Ship EVM-only first to save ~2.

---

## 1. Kill free listings
- Remove the "Free" tab from `src/pages/Submit.tsx` and `src/pages/SubmitAIAgent.tsx`.
- `supabase/functions/submit-free-listing/index.ts` → return `410 Gone`.
- Migration: mark the pending "Quantum Consultation" row `payment_status='rejected'`.

## 2. Fee = 5 USDC, payable on ANY chain

### Native x402 (gasless, EIP-3009)
- **Base Mainnet only** — this is the only chain where our facilitator can settle a signed authorization. Stays as the premium fast-path.
- Sepolia + Arc Testnet kept for testing.

### Alternative-payment path = every other chain (this is what makes the money)
Agent pays USDC on their own chain → sends us the tx hash + chain id → backend verifies on-chain transfer ≥ 5 USDC to treasury → listing inserted. Zero gas for us, zero bridging for them.

**EVM mainnets accepted** (native or bridged USDC, allow-listed contracts):
Base · Ethereum · Arbitrum · Optimism · Polygon · Avalanche · BNB Chain (Binance-Peg USDC) · Linea · Monad · Mantle · Berachain. Any EVM agent with any wallet can pay — no gatekeeping.

**Non-EVM mainnets accepted** (new treasuries):
| Chain  | Treasury |
|--------|----------|
| Solana | `4RsopWwQuDLjNC4AdCd3Uzq7w58i9FoE69EgNTB3d4Be` |
| Sui    | `0xa15979dcd7429463cdf01aae184cb32e33fcf15d3e46067238ccc384115f9979` |
| Near   | `b63a64053204d89290b73e3dbdce660a2f29d211cd1c400f4a499ac165f98171` |

Verifiers (pure JSON-RPC, no SDK bloat):
- **Solana** — `getTransaction` on public RPC, assert SPL Transfer of USDC mint `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` to treasury ATA, ≥ 5_000_000.
- **Sui** — `sui_getTransactionBlock`, assert balance change ≥ 5_000_000 USDC to treasury.
- **Near** — RPC `tx <hash>`, assert `ft_transfer` on `17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1` to treasury ≥ "5000000".

## 3. Submit page UI (`ArcPaymentPanel.tsx`)
- `fee = "5"` everywhere.
- Chain picker shows ~14 mainnets (EVM + Solana + Sui + Near).
- EVM path: wagmi `switchChainAsync` + USDC `transfer(treasury, 5e6)`.
- Solana/Sui/Near path: show treasury address + QR + "Paste tx hash" field → backend verifies.
- Arc Testnet hidden from listing picker.

## 4. Swap & Bridge — unchanged
Base + Arc only. Notice on `/submit` when wallet is Arc Testnet: *"Arc Testnet is for swap & bridge demos. Listings require a mainnet — pay 5 USDC on any chain, including Solana, Sui, Near."*

## 5. Manifest broadcast (the magnet)
Update `public/.well-known/x402`, `agents.json`, `openapi.json`, `llms.txt`, `robots.txt`:
- `accepts` array: Base entry stays native x402 (`scheme: "exact"`); all other chains listed under `alternative_payment.chains` with their treasury + USDC contract.
- Listing price → `5000000`.
- Description: *"Self-list on any chain — EVM, Solana, Sui, or Near — for 5 USDC."*

`scripts/broadcast-manifest.ts` pings:
- x402 Bazaar
- MCP Hub, Smithery.ai, Pulse MCP
- AgentDirectory.org
- agents.json crawler
- Google Indexing API (existing GSC connector) + sitemap resubmit
- Returns draft Twitter/Farcaster post

CTA card on `/ai-agents`: *"Agents — self-list for 5 USDC on any chain"* → links to `/api-docs`.

## 6. Verification
- `curl /.well-known/x402` → price 5000000, all chains listed.
- Submit picker shows all chains; Arc Testnet hidden.
- Quantum row rejected.
- One real test row inserted with Base tx hash.

---

Reply **"go"** to build (~8–10 credits). Or say "EVM only first" to stay closer to 6.
