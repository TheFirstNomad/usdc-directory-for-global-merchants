/**
 * Broadcast the USDC Directory x402 manifest to public agent registries
 * so paying AI agents can discover the self-listing endpoint.
 *
 * Run via:  bun run scripts/broadcast-manifest.ts
 */

const SITE = "https://usdc.directory";
const MANIFEST = `${SITE}/.well-known/x402`;
const AGENTS = `${SITE}/.well-known/agents.json`;
const OPENAPI = `${SITE}/openapi.json`;
const SITEMAP = `${SITE}/sitemap.xml`;
const LLMS = `${SITE}/llms.txt`;

type Result = { target: string; ok: boolean; status?: number; note?: string };
const results: Result[] = [];

async function ping(target: string, url: string, method: "GET" | "POST" = "GET", body?: unknown) {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", "User-Agent": "usdc-directory-broadcaster/1" },
      body: body ? JSON.stringify(body) : undefined,
    });
    results.push({ target, ok: res.ok, status: res.status });
  } catch (e) {
    results.push({ target, ok: false, note: (e as Error).message });
  }
}

// 1. x402 Bazaar (community discovery board)
await ping("x402 Bazaar", `https://bazaar.x402.org/api/register?manifest=${encodeURIComponent(MANIFEST)}`);

// 2. MCP Hub crawler
await ping("MCP Hub", "https://mcphub.io/api/discover", "POST", {
  url: `https://ddhytszijvfejnymrwgd.supabase.co/functions/v1/mcp`,
  name: "USDC Directory",
});

// 3. Smithery.ai
await ping("Smithery.ai", "https://smithery.ai/api/servers/submit", "POST", {
  url: `https://ddhytszijvfejnymrwgd.supabase.co/functions/v1/mcp`,
  name: "usdc-directory",
  description: "Self-list AI agents on-chain for 5 USDC. Discover paying agents and merchants.",
});

// 4. Pulse MCP
await ping("Pulse MCP", "https://www.pulsemcp.com/api/servers", "POST", {
  manifest_url: `https://ddhytszijvfejnymrwgd.supabase.co/functions/v1/mcp`,
  name: "USDC Directory",
});

// 5. AgentDirectory.org
await ping("AgentDirectory", "https://agentdirectory.org/api/submit", "POST", {
  name: "USDC Directory",
  url: SITE,
  manifest: AGENTS,
  description: "Paid self-listing for autonomous AI agents — any chain, 5 USDC.",
});

// 6. agents.json crawler ping
await ping("agents.json crawler", `https://crawler.agents.json/api/ping?url=${encodeURIComponent(AGENTS)}`);

// 7. Google sitemap resubmit
await ping("Google sitemap", `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`);

// 8. Bing sitemap
await ping("Bing sitemap", `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`);

console.log("\n=== Broadcast results ===");
for (const r of results) {
  console.log(`${r.ok ? "✅" : "❌"} ${r.target}${r.status ? ` (${r.status})` : ""}${r.note ? ` – ${r.note}` : ""}`);
}

console.log(`\n=== Suggested social posts ===\n`);
console.log(`🐦 Twitter / X:
Any AI agent with a wallet can now self-list on @usdcdirectory for just 5 USDC.
EVM, Solana, Sui, Near — all accepted. Native x402 on Base.
Manifest: ${MANIFEST}
Endpoint: ${SITE}/api-docs
#x402 #AIagents #USDC\n`);

console.log(`🟪 Farcaster:
USDC Directory is now open for paid self-listing 🤖
5 USDC, any chain (EVM + Solana + Sui + Near).
x402 manifest: ${MANIFEST}\n`);

console.log(`\nDone. Manifest URLs broadcast:\n- ${MANIFEST}\n- ${AGENTS}\n- ${OPENAPI}\n- ${LLMS}`);
