/**
 * Circle Arc App Kit integration
 *
 * Handles:
 * - kit.send()   – listing payments (testnet + mainnet)
 * - kit.bridge() – cross-chain USDC transfers (testnet)
 * - kit.swap()   – token swaps (testnet + mainnet)
 *
 * All execution goes through Circle App Kit. The Uniswap V3 Quoter is still
 * used separately for Base mainnet price display (read-only).
 */

import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";

// ── Kit Key (from env only — never hardcoded) ────────────────────────
export const ARC_KIT_KEY: string = import.meta.env.VITE_ARC_KIT_KEY ?? "";

if (!ARC_KIT_KEY || !ARC_KIT_KEY.startsWith("KIT_KEY:")) {
  console.error(
    "❌ VITE_ARC_KIT_KEY is missing or invalid. " +
    "Set it in your .env file. Circle App Kit operations will fail."
  );
}

// ── Treasury wallet for listing payments ─────────────────────────────
export const TREASURY_ADDRESS: `0x${string}` =
  "0x13FA78ab20762c8F49B58D44DBc177a2Adb94D7c";

// ── Chain helpers ────────────────────────────────────────────────────
export type PaymentChainId = 8453 | 5042002;

/** Map numeric chain ID to the exact string literal the Circle SDK expects. */
function chainString(chainId: PaymentChainId): string {
  return chainId === 8453 ? "Base" : "Arc_Testnet";
}

/** Human-readable chain label. */
export function getChainLabel(chainId: PaymentChainId): string {
  return chainId === 8453 ? "Base Mainnet" : "Arc Testnet";
}

/** Block explorer URL for a given transaction. */
export function getExplorerUrl(chainId: PaymentChainId, txHash: string): string {
  return chainId === 8453
    ? `https://basescan.org/tx/${txHash}`
    : `https://testnet.arcscan.app/tx/${txHash}`;
}

/** Block explorer name. */
export function getExplorerName(chainId: PaymentChainId): string {
  return chainId === 8453 ? "BaseScan" : "ArcScan";
}

// ── Tx hash extraction helper ───────────────────────────────────────
/**
 * Robustly extracts a transaction hash string from a Circle SDK result object.
 * The SDK may return the hash under `txHash`, `transactionHash`, or as a raw string.
 */
function extractTxHash(result: unknown): string {
  if (result && typeof result === "object") {
    const r = result as Record<string, unknown>;
    if (typeof r.txHash === "string" && r.txHash) return r.txHash;
    if (typeof r.transactionHash === "string" && r.transactionHash) return r.transactionHash;
  }
  return String(result);
}

// ── Create Viem Adapter from browser wallet ─────────────────────────
/**
 * Creates a Circle-compatible Viem adapter from an EIP-1193 provider.
 *
 * @param passedProvider - The EIP-1193 provider object from Reown's
 *   `useAppKitProvider('eip155')`. **Must be a provider object, not an address string.**
 * @throws If no provider is available.
 */
export async function createViemAdapterFromWallet(passedProvider?: unknown) {
  const provider = (passedProvider as Record<string, unknown>) || (window as unknown as Record<string, unknown>).ethereum;

  console.debug("[arcAppKit] createViemAdapter", {
    hasPassed: !!passedProvider,
    hasFallback: !!(window as unknown as Record<string, unknown>).ethereum,
    hasRequest: !!(provider && typeof (provider as Record<string, unknown>).request === "function"),
  });

  if (!provider || typeof (provider as Record<string, unknown>).request !== "function") {
    throw new Error(
      "Wallet provider unavailable. Open the wallet, switch it to Arc Testnet, then try again."
    );
  }

  // Ensure the wallet is unlocked
  await (provider as { request: (args: { method: string }) => Promise<unknown> }).request({
    method: "eth_requestAccounts",
  });

  return await createViemAdapterFromProvider({
    provider,
    capabilities: { addressContext: "user-controlled" },
  } as Parameters<typeof createViemAdapterFromProvider>[0]);
}

// ── Singleton AppKit instance ────────────────────────────────────────
let _kit: AppKit | null = null;

function getAppKit(): AppKit {
  if (!_kit) {
    _kit = new AppKit({ kitKey: ARC_KIT_KEY } as ConstructorParameters<typeof AppKit>[0]);
  }
  return _kit;
}

// ── Pay Listing Fee (kit.send) ──────────────────────────────────────
/**
 * Sends a USDC listing fee to the treasury wallet.
 *
 * @param adapter - Viem adapter created by `createViemAdapterFromWallet`.
 * @param chainId - Target chain (Base Mainnet or Arc Testnet).
 * @param amount  - USDC amount as a decimal string (e.g. "10").
 * @returns Transaction hash and explorer URL.
 */
export async function payListingFee(
  adapter: Awaited<ReturnType<typeof createViemAdapterFromWallet>>,
  chainId: PaymentChainId = 5042002,
  amount: string = "10",
) {
  const kit = getAppKit();
  const chain = chainString(chainId);

  const result = await withCircleProxy(() => kit.send({
    from: { adapter, chain },
    to: TREASURY_ADDRESS,
    amount,
    token: "USDC",
  } as Parameters<typeof kit.send>[0]));

  const txHash = extractTxHash(result);
  return { txHash, explorerUrl: getExplorerUrl(chainId, txHash) };
}

// ── Pay Agent Listing Fee (1 USDC) ──────────────────────────────────
/**
 * Sends the discounted 1 USDC AI-agent listing fee to the treasury.
 * Mirrors `payListingFee` but with a fixed 1 USDC amount.
 */
export async function payAgentListingFee(
  adapter: Awaited<ReturnType<typeof createViemAdapterFromWallet>>,
  chainId: PaymentChainId = 5042002,
) {
  return payListingFee(adapter, chainId, "1");
}

// ── Pay Boost Fee (5 USDC) ──────────────────────────────────────────
/**
 * Sends a 5 USDC boost fee to the treasury to feature a listing for 30 days.
 */
export async function payBoostFee(
  adapter: Awaited<ReturnType<typeof createViemAdapterFromWallet>>,
  chainId: PaymentChainId = 5042002,
) {
  return payListingFee(adapter, chainId, "5");
}

// ── Fetch-intercepting proxy for Circle API ────────────────────────
/**
 * The Circle SDK calls `https://api.circle.com/v1/stablecoinKits/*` from
 * the browser, which is blocked by CORS on custom domains.
 *
 * This wrapper temporarily patches `globalThis.fetch` so that any request
 * to `api.circle.com` is transparently routed through our Edge Function
 * (`circle-proxy`). The SDK's signing & on-chain execution stays untouched.
 */
const CIRCLE_API_ORIGIN = "https://api.circle.com";
const PROXY_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/circle-proxy`;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

function withCircleProxy<T>(fn: () => Promise<T>): Promise<T> {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;

    if (url.startsWith(CIRCLE_API_ORIGIN)) {
      const path = new URL(url).pathname + new URL(url).search;
      const method = init?.method ?? (typeof input !== "string" && !(input instanceof URL) ? (input as Request).method : "GET");
      let body: unknown;
      if (init?.body) {
        try { body = JSON.parse(init.body as string); } catch { body = init.body; }
      }

      const MAX_ATTEMPTS = 3;
      let lastErr: unknown;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          console.log(`[circle-proxy] ${method} ${path} (attempt ${attempt}/${MAX_ATTEMPTS})`);
          const res = await originalFetch(PROXY_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SUPABASE_ANON}`,
              apikey: SUPABASE_ANON,
            },
            body: JSON.stringify({ method, path, body }),
          });

          if ((res.status >= 500 || res.status === 429) && attempt < MAX_ATTEMPTS) {
            const delay = 400 * Math.pow(2, attempt - 1);
            console.warn(`[circle-proxy] ${res.status} from proxy, retrying in ${delay}ms`);
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }

          if (!res.ok) {
            const text = await res.clone().text().catch(() => "");
            console.error(`[circle-proxy] ${res.status} ${res.statusText}: ${text}`);
            if (res.status === 401 || res.status === 403) {
              throw new Error("Swap service authorization failed. Please refresh the page and try again.");
            }
            if (res.status === 429) {
              throw new Error("Too many swap requests — please wait a moment and retry.");
            }
            if (res.status >= 500) {
              throw new Error("Swap service is temporarily unavailable. Please try again shortly.");
            }
          }
          return res;
        } catch (err) {
          lastErr = err;
          const isNetwork = err instanceof TypeError;
          if (isNetwork && attempt < MAX_ATTEMPTS) {
            const delay = 400 * Math.pow(2, attempt - 1);
            console.warn(`[circle-proxy] network error, retrying in ${delay}ms`, err);
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
          throw err;
        }
      }
      throw lastErr ?? new Error("Swap service unreachable. Please check your connection and try again.");
    }

    return originalFetch(input, init);
  };

  return fn().finally(() => {
    globalThis.fetch = originalFetch;
  });
}

// ── Swap via App Kit ────────────────────────────────────────────────
/**
 * Executes a token swap via Circle App Kit.
 * On Arc Testnet, API calls are routed through the circle-proxy Edge Function
 * to bypass CORS. On Base Mainnet, calls go direct (or also proxied).
 */
export async function swapViaKit(
  adapter: Awaited<ReturnType<typeof createViemAdapterFromWallet>>,
  chainId: PaymentChainId,
  tokenIn: string,
  tokenOut: string,
  amount: string,
) {
  const kit = getAppKit();
  const chain = chainString(chainId);

  console.debug("[swapViaKit] start", { chain, tokenIn, tokenOut, amount });

  const doSwap = async () => {
    console.debug("[swapViaKit] kit.swap invoked");
    const r = await kit.swap({
      from: { adapter, chain },
      tokenIn,
      tokenOut,
      amountIn: amount,
      config: { kitKey: ARC_KIT_KEY },
    } as Parameters<typeof kit.swap>[0]);
    console.debug("[swapViaKit] kit.swap returned", r);
    return r;
  };

  // Retry the whole swap call once for transient SDK failures
  // (network blip, quote expiry). Wallet-rejection / auth errors are NOT retried.
  const MAX_SWAP_ATTEMPTS = 2;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_SWAP_ATTEMPTS; attempt++) {
    try {
      const result = await withCircleProxy(doSwap);
      const txHash = extractTxHash(result);
      return { txHash };
    } catch (err) {
      lastErr = err;
      const fullMsg = [
        (err as { shortMessage?: string })?.shortMessage,
        (err as Error)?.message,
        (err as { details?: string })?.details,
        (err as { cause?: { message?: string } })?.cause?.message,
      ].filter(Boolean).join(" | ");
      console.error(`[swapViaKit] attempt ${attempt}/${MAX_SWAP_ATTEMPTS} failed:`, fullMsg, err);
      const msg = fullMsg.toLowerCase();
      const userRejected =
        msg.includes("user rejected") ||
        msg.includes("user denied") ||
        msg.includes("rejected the request");
      const isAuth = msg.includes("authorization failed") || msg.includes("unauthorized");
      const isProviderMissing = msg.includes("wallet provider unavailable") || msg.includes("no valid eip-1193");
      if (userRejected || isAuth || isProviderMissing || attempt >= MAX_SWAP_ATTEMPTS) throw err;
      console.warn(`[swapViaKit] transient failure, retrying in 600ms`);
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  throw lastErr;
}

// ── Bridge USDC ─────────────────────────────────────────────────────
/**
 * Bridges USDC between chains via Circle's cross-chain transfer protocol.
 *
 * @param adapter   - Viem adapter created by `createViemAdapterFromWallet`.
 * @param fromChain - Source chain string (e.g. "Ethereum_Sepolia", "Arc_Testnet").
 * @param toChain   - Destination chain string.
 * @param amount    - USDC amount as a decimal string.
 * @returns Transaction hash.
 */
export async function bridgeUsdc(
  adapter: Awaited<ReturnType<typeof createViemAdapterFromWallet>>,
  fromChain: string,
  toChain: string,
  amount: string,
) {
  const kit = getAppKit();

  const result = await withCircleProxy(() => kit.bridge({
    from: { adapter, chain: fromChain },
    to: { adapter, chain: toChain },
    amount,
    token: "USDC",
  } as Parameters<typeof kit.bridge>[0]));

  const txHash = extractTxHash(result);
  return { txHash };
}

export default getAppKit;
