

# Autonomous AI Agent Self-Listing Experience

## Overview
Build a single-page, zero-friction listing flow at `/submit/ai-agent` for autonomous AI agents, plus homepage promotion, a new "AI Agents" category, and admin/listing visibility updates.

## Changes

### 1. Add "AI Agents" category (`src/lib/partners.ts`)
- Add `"AI Agents"` to `CATEGORIES` array with emoji `"🤖"`
- Add to `CATEGORY_EMOJIS`: `"AI Agents": "🤖"`

### 2. Create `/submit/ai-agent` page (`src/pages/SubmitAIAgent.tsx`)
Single-page form — no steps, no wizard. Fields:
- **Agent Name / Handle** (required, text input)
- **Agent Wallet or Contract Address (any chain)** (required, text input)
- **One-sentence description** (required, text input)
- **Logo upload** (optional, reuses existing `upload-logo` edge function)

Flow:
- Connect wallet → fill form → click "Pay 10 USDC & List" → opens PaymentModal with `type="listing"`
- Submission data sent to `create-nowpayments-invoice` with `categories: ["AI Agents"]`, `region: "Global"`, `networks: []`, and a flag field (e.g. `contact_email: "ai-agent@autonomous"`) to identify AI agent listings
- On success → show confirmation with order ID
- Bottom note: "Agents can also submit programmatically via POST to /api/submit-ai-agent (same fields + wallet signature)."
- Reuses existing `PaymentModal` component and NOWPayments flow

### 3. Create programmatic API edge function (`supabase/functions/submit-ai-agent/index.ts`)
- Accepts POST with JSON body: `{ agent_name, wallet_address, description, logo_url? }`
- No auth required (public endpoint)
- Validates inputs, creates submission record, creates NOWPayments invoice
- Returns `{ invoice_url, invoice_id, order_id }` — agent pays via the invoice URL
- Webhook handles the rest (instant listing on payment confirmation)

### 4. Update webhook for AI Agent badge (`supabase/functions/nowpayments-webhook/index.ts`)
- When creating a new partner from submission, check if `contact_email` contains `"ai-agent@autonomous"` or categories include `"AI Agents"`
- If so, set `logo_emoji: "🤖"`, `featured: false`, and add `"AI Agents"` to categories
- The "Autonomous AI Agent" verified badge will be rendered on the card/detail page based on the `"AI Agents"` category

### 5. Add route (`src/App.tsx`)
- `<Route path="/submit/ai-agent" element={<SubmitAIAgent />} />`

### 6. Homepage AI Agent banner (`src/pages/Index.tsx`)
- Add a prominent banner section between HeroSection and the main content:
  - "🤖 The Home for Autonomous AI Agents"
  - "List yourself in seconds — any chain, any wallet"
  - CTA button linking to `/submit/ai-agent`

### 7. PartnerCard AI Agent badge (`src/components/PartnerCard.tsx`)
- If `partner.categories.includes("AI Agents")`, show a "🤖 Autonomous AI Agent" verified badge (similar to the existing "⭐ Featured" badge)

### 8. Admin dashboard flag (`src/pages/AdminPayments.tsx`)
- In the table, show a "🤖 AI Agent" badge next to company name when submission categories include "AI Agents"

### 9. My Listings update (`src/pages/MyListings.tsx`)
- Show "🤖 AI Agent" indicator on listings that have the AI Agents category

### 10. Header update (`src/components/Header.tsx`)
- Add "AI Agents" link to nav pointing to `/?category=AI+Agents` or keep implicit via the category filter

## Technical Details
- The AI agent marker uses `contact_email: "ai-agent@autonomous"` as a convention to identify agent submissions in the webhook, avoiding schema changes
- No database migration needed — uses existing `submissions` and `partners` tables as-is
- Payment is exactly 10 USDC via existing NOWPayments flow
- Instant approval happens via the existing webhook: payment confirmed → partner created → visible on directory
- The programmatic API endpoint mirrors `create-nowpayments-invoice` but with simplified AI-agent-specific fields

