## Goal

After you approve, you want to cast on Farcaster so Base AI agents, x402 indexers, and MCP crawlers discover USDC Directory and self-list for 5 USDC.

## Reality check on the previous broadcast script

The old `scripts/broadcast-manifest.ts` pinged invented endpoints (x402 Bazaar `/api/register`, MCP Hub `/api/discover`, Smithery `/api/servers/submit`, `crawler.agents.json`, Google/Bing sitemap pings). **None of those public POST APIs exist** — they all 404. There is nothing to "fix" by retrying; the registries don't accept anonymous programmatic submissions as of May 2026.

What actually drives discovery:
1. **Passive crawl** — already live at `/.well-known/x402`, `/.well-known/agents.json`, `/openapi.json`, `/llms.txt`, `sitemap.xml`. Agent crawlers (GPTBot, ClaudeBot, Perplexity, agents.json bot, x402 indexers) follow these automatically.
2. **Farcaster cast** — the one channel that has a real public API and where Base/Coinbase agent builders live. This is your highest-leverage action.
3. **Manual form submissions** — Smithery, Pulse MCP, MCP Hub, x402 Bazaar (GitHub issue). One-time, takes ~5 min each.

## Plan

### Step 1 — Replace `scripts/broadcast-manifest.ts` with an honest health-check + submission helper
- HEAD-checks our 6 public manifest URLs and prints a green/red table (so you can confirm crawlers can reach them).
- Prints the exact submission URLs + pre-filled payload text for Smithery / Pulse MCP / MCP Hub / x402 Bazaar / AgentDirectory so you (or I) can paste them into the forms in the browser.
- No more fake API calls.

### Step 2 — New `scripts/cast-farcaster.ts` (the part you actually want)
Programmatic Farcaster cast via the **Neynar API** (standard public Farcaster API). The script will:
- Read `NEYNAR_API_KEY` and `NEYNAR_SIGNER_UUID` from Lovable Cloud secrets.
- POST to `https://api.neynar.com/v2/farcaster/cast` with launch copy targeted at agent builders:

  > 🤖 USDC Directory is now open for autonomous agent self-listing.
  > Any AI agent with a wallet can list itself for 5 USDC on Base, Ethereum, Arbitrum, OP, Polygon, Avalanche, BNB, Linea, Monad, Solana, Sui, or Near.
  > Native x402 (gasless EIP-3009) on Base.
  > Manifest → https://usdc.directory/.well-known/x402
  > Docs → https://usdc.directory/api-docs

- Embeds: `https://usdc.directory/.well-known/x402` and `https://usdc.directory/api-docs` (so Warpcast shows rich previews).
- Posts into relevant channels: `/base`, `/ai-agents`, `/x402` (configurable).
- Prints the resulting cast hash + Warpcast URL so you can click and see it live.
- `--dry-run` flag prints the payload without posting.

### Step 3 — What I need from you before Step 2 can run
Two secrets, both free, from neynar.com:
1. **`NEYNAR_API_KEY`** — sign up at https://neynar.com (free tier is enough), grab the API key from the dashboard.
2. **`NEYNAR_SIGNER_UUID`** — in Neynar dashboard create a "signer" tied to the Farcaster account you want to cast from (your account or a brand account), approve it once from Warpcast on your phone, copy the signer UUID.

Once you tell me you're ready, I'll trigger Lovable Cloud's secure secret-entry form for both values, then run the script and paste the resulting cast link back to you.

### Why Neynar and not X/Twitter
X's API requires a paid tier + OAuth1.0a app setup — not worth it for one post. I'll print ready-to-paste X copy in the broadcast script so you can post it manually in 10 seconds.

## Files touched
- `scripts/broadcast-manifest.ts` — rewritten (no fake APIs)
- `scripts/cast-farcaster.ts` — new
- No `src/` or `supabase/` changes

## Out of scope
- Auto-posting to X/Twitter (manual paste instead)
- Building a UI for casting — these are one-shot scripts run from chat

Approve and I'll build both scripts, then ask you for the two Neynar secrets so we can fire the cast.
