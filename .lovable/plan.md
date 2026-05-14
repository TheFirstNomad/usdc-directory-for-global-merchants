## Goal

Turn usdc.directory into an agent-payable surface so any AI agent (Circle's, Claude, Codex, Cursor, custom) can self-list and pay autonomously, and so agents pay tiny amounts to query the directory.

## Credit budget for this session

**Max ~5 credits, then stop.** Resume tomorrow by replying "resume".
Session 1 will cover Phase 1 only (DB + agents-api edge function + x402 discovery files). Phases 2–4 are queued for later sessions.

## Revenue streams

1. **Self-listing** — 1 USDC per agent (lower than the 10 USDC human fee, to drive volume).
2. **Metered API access** — agents pay per call to `/agents`, `/agents/search`, `/agents/{id}` (~$0.001 each).
3. **Featured boost** — 5 USDC to pin to top for 30 days; 20 USDC for "Verified Agent" badge.

## Payment rails (all three, agent picks)

- **x402 (HTTP 402 + USDC)** — primary agent-native rail. Endpoint returns 402 + `accepts` array. Agent signs EIP-3009 `transferWithAuthorization` and retries with `X-PAYMENT` header.
- **On-chain USDC micropay** (existing Arc App Kit flow) — agent pays USDC, then POSTs tx hash. Reuses current `payListingFee` infra.
- **Discoverability** — `/.well-known/x402` manifest + extend `/llms.txt` with paid endpoint catalog so Claude/Cursor/Codex can auto-discover.

## New surfaces

### Public agent API (Edge Functions)
- `GET /agents-api/agents` — list (paid, 402-gated, $0.001)
- `GET /agents-api/agents/{id}` — detail (paid, $0.001)
- `POST /agents-api/agents` — self-list (paid, 1 USDC via x402 OR tx hash)
- `POST /agents-api/agents/{id}/boost` — featured (paid, 5 USDC)
- `public/.well-known/x402` — payment manifest
- Updated `public/llms.txt` with paid endpoint catalog

### Frontend
- New `/api-docs` page — agent-facing docs: x402 example, curl with `X-PAYMENT`, on-chain alternative, pricing table, code samples.
- `/ai-agents` hero adds "Agents: list yourself programmatically →" link.

### Database
- `partners`: add `boosted_until timestamptz`, `verified bool`.
- `agent_api_payments` — log every paid call.
- `agent_boosts` — boost expiries.

## Phased delivery (so we can checkpoint)

### Phase 1 — Session 1 (this approval, ~5 credits) ✅ stop after this
1. DB migration: add `boosted_until`, `verified`; create `agent_api_payments`, `agent_boosts` (RLS service-role only).
2. `supabase/functions/agents-api/index.ts` — single function, internal router, 402 gating with x402 verification (EIP-3009 signature check + on-chain settle).
3. `public/.well-known/x402` — static discovery manifest.
4. `public/llms.txt` — append paid API catalog.
5. `src/lib/web3.ts` — add `LISTING_FEE_AGENT = 1 USDC` constant.

→ **STOP** here, await "resume".

### Phase 2 — Session 2
- `submit-ai-agent` edge function: accept x402 path + lower amount.
- `src/lib/arcAppKit.ts`: add `payAgentListingFee` (1 USDC variant).
- `SubmitAIAgent.tsx`: show 1 USDC for agents.

### Phase 3 — Session 3
- `/api-docs` page with curl + TS/Python examples, pricing table.
- Route registration in `App.tsx`.
- `/ai-agents` hero link to `/api-docs`.

### Phase 4 — Session 4
- Boost upsell UI on owner-controlled listings.
- "Boosted" + "Verified" badges in `PartnerCard`.
- Sort by boost in `/ai-agents`.

## Out of scope (future)
- Coinbase x402 facilitator (we self-settle on Arc/Base initially).
- Subscriptions / streaming payments.
- Solana / non-EVM x402.
- Referral revenue tracking.
