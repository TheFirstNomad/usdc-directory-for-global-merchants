/**
 * USDC Directory — broadcast helper
 *
 * Honest version: the previous script pinged invented registry endpoints
 * (x402 Bazaar /api/register, MCP Hub /api/discover, Smithery /api/submit,
 * agents.json crawler, Google/Bing sitemap ping) — none of those public POST
 * APIs exist. This script does what actually works:
 *
 *   1. HEAD-checks every public manifest URL so we know crawlers can reach them.
 *   2. Prints the exact submission URLs + pre-filled payloads to paste into the
 *      few registries that DO accept listings (all manual web forms).
 *   3. Prints ready-to-paste X/Twitter copy.
 *
 * For programmatic Farcaster casting see scripts/cast-farcaster.ts.
 *
 * Run: bun run scripts/broadcast-manifest.ts
 */

const SITE = "https://usdc.directory";
const MCP_URL = "https://ddhytszijvfejnymrwgd.supabase.co/functions/v1/mcp";

const PUBLIC_URLS = [
  `${SITE}/.well-known/x402`,
  `${SITE}/.well-known/agents.json`,
  `${SITE}/.well-known/ai-plugin.json`,
  `${SITE}/openapi.json`,
  `${SITE}/llms.txt`,
  `${SITE}/sitemap.xml`,
  `${SITE}/robots.txt`,
  MCP_URL,
];

async function check(url: string) {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": "usdc-directory-healthcheck/1" },
      signal: AbortSignal.timeout(8000),
    });
    return { url, ok: res.ok, status: res.status };
  } catch (e) {
    return { url, ok: false, status: 0, note: (e as Error).message };
  }
}

console.log("=== 1. Health check — manifest URLs crawlers will hit ===\n");
const results = await Promise.all(PUBLIC_URLS.map(check));
let allOk = true;
for (const r of results) {
  console.log(`${r.ok ? "✅" : "❌"} ${String(r.status).padEnd(3)}  ${r.url}${("note" in r && r.note) ? ` — ${r.note}` : ""}`);
  if (!r.ok) allOk = false;
}

console.log("\n=== 2. Manual registry submissions (open & paste) ===\n");

const SHORT_DESC =
  "Pay-per-call directory of USDC merchants & autonomous AI agents. " +
  "Self-list for 5 USDC on Base, Ethereum, Arbitrum, Optimism, Polygon, " +
  "Avalanche, BNB, Linea, Monad, Solana, Sui, or Near. Native x402 on Base.";

const submissions = [
  {
    name: "Smithery.ai (MCP directory)",
    url: "https://smithery.ai/new",
    paste: {
      "Server URL": MCP_URL,
      "Name": "USDC Directory",
      "Description": SHORT_DESC,
      "Homepage": SITE,
    },
  },
  {
    name: "Pulse MCP",
    url: "https://www.pulsemcp.com/submit",
    paste: {
      "Server URL": MCP_URL,
      "Name": "USDC Directory",
      "Description": SHORT_DESC,
    },
  },
  {
    name: "MCP Hub",
    url: "https://mcphub.com/submit",
    paste: {
      "Server URL": MCP_URL,
      "Name": "USDC Directory",
      "Description": SHORT_DESC,
    },
  },
  {
    name: "x402 Bazaar (open GitHub issue)",
    url: "https://github.com/coinbase/x402/issues/new",
    paste: {
      "Title": "[Listing] USDC Directory — agent self-listing for 5 USDC",
      "Body": `Manifest: ${SITE}/.well-known/x402\nAgents: ${SITE}/.well-known/agents.json\nOpenAPI: ${SITE}/openapi.json\nMCP: ${MCP_URL}\n\n${SHORT_DESC}`,
    },
  },
  {
    name: "AgentDirectory.org",
    url: "https://agentdirectory.org/submit",
    paste: {
      "Name": "USDC Directory",
      "URL": SITE,
      "Manifest": `${SITE}/.well-known/agents.json`,
      "Description": SHORT_DESC,
    },
  },
];

for (const s of submissions) {
  console.log(`▶ ${s.name}`);
  console.log(`  Open: ${s.url}`);
  for (const [k, v] of Object.entries(s.paste)) {
    console.log(`  ${k}: ${v}`);
  }
  console.log("");
}

console.log("=== 3. Social copy ===\n");
console.log("🐦 X / Twitter (paste manually — X API requires paid tier):\n");
console.log(`🤖 USDC Directory is now open for autonomous AI agent self-listing.

Any agent with a wallet can list itself for 5 USDC on Base, Ethereum, Arbitrum, OP, Polygon, Avalanche, BNB, Linea, Monad, Solana, Sui or Near.

Native x402 (gasless) on Base.

Manifest → ${SITE}/.well-known/x402
Docs → ${SITE}/api-docs

#x402 #AIagents #USDC #Base
`);

console.log("🟪 Farcaster — run: bun run scripts/cast-farcaster.ts\n");

console.log(`=== Done ===\n${allOk ? "✅ All public URLs reachable. Crawlers can index." : "❌ Some URLs failed — fix before broadcasting."}\n`);
process.exit(allOk ? 0 : 1);
