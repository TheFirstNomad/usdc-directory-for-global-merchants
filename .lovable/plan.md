## Resume — Session 2 (Phase 2, ~5 credits cap)

Goal: wire the **1 USDC agent self-listing** into the existing on-chain payment flow so agents (and the human form) actually pay the lower fee on `/submit/ai-agent`.

### Scope this session (stop after these)

1. **`src/lib/arcAppKit.ts`** — add `payAgentListingFee(adapter, chainId)` that mirrors `payListingFee` but transfers `LISTING_FEE_AGENT` (1 USDC) instead of 10 USDC. Reuses existing USDC contract + treasury logic, no new infra.
2. **`src/pages/SubmitAIAgent.tsx`** — swap `payListingFee` → `payAgentListingFee`, update SEO title, hero copy, and CTA from "10 USDC" → "1 USDC".
3. **`supabase/functions/submit-ai-agent/index.ts`** — accept the existing `payment_tx` field unchanged (already does); add a lightweight server-side amount sanity note in code comment only — no on-chain re-verification this session (reuses existing trust model of `submit-ai-agent` which is the same as `submit-listing`).
4. **`/ai-agents` hero** — add a single small line "Agents: list yourself for 1 USDC →" linking to `/submit/ai-agent`. (Programmatic API link comes in Phase 3.)

### Explicitly NOT in this session
- `/api-docs` page → Phase 3
- Boost upsell UI / badges → Phase 4
- x402 path inside `submit-ai-agent` (frontend humans use on-chain; agents already have `agents-api` POST) → deferred
- Server-side tx verification refactor

### Checkpoint
After Phase 2, reply **"resume"** to start Phase 3.

### Remaining credit estimate to finish everything

| Phase | Work | Est. credits |
|---|---|---|
| **Phase 3** | `/api-docs` page (curl + TS/Python samples, pricing table), route in `App.tsx`, hero link polish | ~5 |
| **Phase 4** | Boost upsell UI on owner listings, "Boosted"/"Verified" badges in `PartnerCard`, sort-by-boost in `/ai-agents` | ~5–7 |
| **Optional Phase 5** | Server-side x402 settlement against Coinbase facilitator, replay-cache hardening, admin dashboard for `agent_api_payments` | ~5 |

**Total to finish core (Phases 3 + 4): ~10–12 credits.** Optional Phase 5 adds ~5 more.
