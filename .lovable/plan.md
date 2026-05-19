
# Agent Magnet v1 — Build Plan

Goal: turn the directory into a self-feeding revenue engine where AI agents discover, self-list, and pay USDC to the Base treasury (`0x13FA78ab20762c8F49B58D44DBc177a2Adb94D7c`) autonomously. Works on **Base mainnet** and **upcoming Arc mainnet**, both via Circle App Kit.

---

## Phase A — Critical security & infra fixes (~3 credits)

1. **Drop `SECURITY DEFINER` from `partners_public` view** — recreate as a normal view; tighten its column set to only safe public fields.
2. **Lock down `logos` storage bucket** — keep public read for individual objects but disable listing; add size/type guards on upload edge function.
3. **Add idempotency + rate limiting** to `agents-api` (POST /agents, /boost): hash-based dedupe on `payment_id`, IP+wallet sliding-window limit on the 402 challenge endpoint, replay-cache table for x402 signatures.
4. **DB indexes**: `agent_api_payments(paid_at desc)`, `agent_api_payments(payment_id)`, `partners(boosted_until)`, `partners(wallet_address)`.

## Phase B — Real x402 on-chain settlement (~3 credits)

Currently agents can call APIs by submitting an EIP-712 authorization that is never settled → **no USDC reaches treasury** unless they use the manual on-chain path.

1. Add a `settle-x402` edge function that takes the signed `transferWithAuthorization` payload and broadcasts it via:
   - **Base mainnet**: viem `writeContract` to USDC `0x8335…2913` using a server signer funded with a tiny ETH gas float.
   - **Arc mainnet (when live)**: Circle App Kit `kit.send()` server-side path (USDC-native gas, no ETH needed).
   - **Arc testnet**: same App Kit path, already wired.
2. Store nonce + tx hash in `agent_api_payments`, return `X-PAYMENT-RESPONSE` header per x402 spec.
3. Chain config table so adding **Arc mainnet** at launch = 1 row insert (chainId, USDC address, RPC, label) — no code change.

## Phase C — MCP server + discovery manifests (~3 credits)

This is what makes agents *find* you autonomously.

1. **MCP server** at `supabase/functions/mcp/index.ts` using `mcp-lite` over Streamable HTTP. Tools: `list_agents`, `get_agent`, `submit_agent` (returns 402 if unpaid), `boost_agent`, `search_merchants`. Claude/Cursor/GPT can connect directly.
2. **`public/openapi.json`** — full OpenAPI 3.1 spec for `/agents-api/*` with x402 pricing extensions.
3. **`public/.well-known/agents.json`** (a16z agents.json standard) — declares capabilities, pricing, treasury, MCP URL.
4. **`public/.well-known/ai-plugin.json`** — legacy ChatGPT plugin manifest for broader reach.
5. Extend existing `public/.well-known/x402` to advertise both Base mainnet + Arc mainnet entries.
6. **`/api-docs` page**: add "Connect via MCP" section + copy-paste config snippets for Claude Desktop, Cursor, Continue.

## Phase D — Agent-magnet polish + admin (~2 credits)

1. **Dynamic `sitemap.xml`** generated from `partners_public` (edge function, cached 1h).
2. JSON-LD `Organization` + `WebSite` + `SoftwareApplication` schema on home + `/ai-agents`.
3. Per-agent OG image route (`/og/agent/:id`) — auto-generated card so agent listings look premium when shared.
4. Admin dashboard (`/admin/agents`): add chain filter, settled-vs-pending tab, per-endpoint revenue chart, "register on x402 Bazaar" checklist with status.

## Phase E — Multi-chain readiness (Base + Arc mainnet) (~1 credit)

1. Add Arc mainnet chain config (placeholder RPC + USDC address, flagged `enabled:false` until Circle ships it) to `Web3Provider.tsx`, `arcAppKit.ts`, `web3.ts`, `.well-known/x402`.
2. Single `ENABLED_CHAINS` constant — flip Arc mainnet on with one boolean when Circle announces.
3. Treasury address stays the same on all EVM chains (already standard).

## Technical details

- **Treasury**: `0x13FA78ab20762c8F49B58D44DBc177a2Adb94D7c` on every chain.
- **Server signer for Base settlement**: new secret `BASE_SETTLEMENT_PRIVATE_KEY` (you'll fund it with ~$5 ETH for gas). Stored as Lovable Cloud secret, never exposed.
- **Circle App Kit** continues to handle Arc testnet today and Arc mainnet at launch — no new SDK needed.
- **MCP transport**: Streamable HTTP with `Accept: application/json, text/event-stream` headers (per spec).
- **Replay protection**: new `x402_nonces` table, unique index on `(chain, nonce)`.
- All new edge functions registered in `supabase/config.toml` with `verify_jwt = false` (agents authenticate via x402, not JWT).

## Credit estimate

| Phase | Work | Credits |
|---|---|---|
| A | Security + idempotency + indexes | ~3 |
| B | Real on-chain x402 settlement (Base + Arc) | ~3 |
| C | MCP server + agents.json + OpenAPI | ~3 |
| D | SEO/OG/admin polish | ~2 |
| E | Arc mainnet readiness toggle | ~1 |
| **Total** | | **~12 credits** |

Can be shipped phase-by-phase. Minimum viable "agent magnet" = **A + B + C (~9 credits)**; D + E are polish + future-proofing.

## After this ships

- Submit to **x402 Bazaar** (Coinbase) and **a16z agents.json registry** — both are manual one-time form fills, no credits.
- Agents from Claude, Cursor, GPT, and any x402-aware crawler can then discover, list themselves, and pay your treasury with zero human in the loop.

Reply **"start with A"** (or any phase letter) to begin, or **"build all"** to execute Phases A→E sequentially.
