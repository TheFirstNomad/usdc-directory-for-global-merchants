/**
 * USDC Directory — Farcaster cast via Neynar API.
 *
 * Posts a launch cast announcing 5 USDC self-listing for autonomous AI agents,
 * with embeds so Warpcast renders the x402 manifest + API docs as rich cards.
 *
 * Requires two secrets in Lovable Cloud:
 *   NEYNAR_API_KEY      — from https://neynar.com dashboard
 *   NEYNAR_SIGNER_UUID  — a signer tied to the Farcaster account that will cast
 *
 * Run:
 *   bun run scripts/cast-farcaster.ts             # post for real
 *   bun run scripts/cast-farcaster.ts --dry-run   # print payload only
 */

const SITE = "https://usdc.directory";
const MANIFEST = `${SITE}/.well-known/x402`;
const DOCS = `${SITE}/api-docs`;

const TEXT = `🤖 USDC Directory is now open for autonomous AI agent self-listing.

Any AI agent with a wallet can list itself for 5 USDC on Base, Ethereum, Arbitrum, OP, Polygon, Avalanche, BNB, Linea, Monad, Solana, Sui, or Near.

Native x402 (gasless, EIP-3009) on Base.

Manifest → ${MANIFEST}
Docs → ${DOCS}`;

// Farcaster channels relevant to agent builders. Set to null to cast to the main feed.
const CHANNEL_ID: string | null = "ai-agents";

const dryRun = process.argv.includes("--dry-run");

const payload = {
  signer_uuid: process.env.NEYNAR_SIGNER_UUID,
  text: TEXT,
  embeds: [{ url: MANIFEST }, { url: DOCS }],
  ...(CHANNEL_ID ? { channel_id: CHANNEL_ID } : {}),
};

console.log("=== Farcaster cast payload ===\n");
console.log(JSON.stringify({ ...payload, signer_uuid: payload.signer_uuid ? "***" : undefined }, null, 2));
console.log("");

if (dryRun) {
  console.log("--dry-run set, not posting.");
  process.exit(0);
}

const apiKey = process.env.NEYNAR_API_KEY;
const signer = process.env.NEYNAR_SIGNER_UUID;

if (!apiKey || !signer) {
  console.error("❌ Missing secrets. Need NEYNAR_API_KEY and NEYNAR_SIGNER_UUID in Lovable Cloud.");
  console.error("   1. Sign up at https://neynar.com (free tier works)");
  console.error("   2. Copy your API key from the dashboard");
  console.error("   3. Create a signer, approve it once from Warpcast, copy the signer UUID");
  console.error("   4. Add both as secrets in Lovable Cloud, then re-run this script.");
  process.exit(1);
}

const res = await fetch("https://api.neynar.com/v2/farcaster/cast", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
  },
  body: JSON.stringify(payload),
});

const data = await res.json().catch(() => ({}));

if (!res.ok) {
  console.error(`❌ Neynar API error [${res.status}]:`, JSON.stringify(data, null, 2));
  process.exit(1);
}

const hash = data?.cast?.hash ?? data?.hash;
const author = data?.cast?.author?.username ?? "your account";
console.log("✅ Cast posted!");
console.log(`   Hash:    ${hash}`);
console.log(`   Warpcast: https://warpcast.com/${author}/${hash?.slice(0, 10)}`);
