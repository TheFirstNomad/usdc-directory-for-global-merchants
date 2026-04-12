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

  if (!provider || typeof (provider as Record<string, unknown>).request !== "function") {
    throw new Error(
      "No valid EIP-1193 provider detected. Make sure you are passing the walletProvider " +
      "object from useAppKitProvider('eip155'), not a wallet address string."
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

  const result = await kit.send({
    from: { adapter, chain },
    to: TREASURY_ADDRESS,
    amount,
    token: "USDC",
  } as Parameters<typeof kit.send>[0]);

  const txHash = extractTxHash(result);
  return { txHash, explorerUrl: getExplorerUrl(chainId, txHash) };
}

// ── Swap via App Kit ────────────────────────────────────────────────
/**
 * Executes a token swap via Circle App Kit.
 * Works on both Base Mainnet and Arc Testnet.
 *
 * @param adapter  - Viem adapter created by `createViemAdapterFromWallet`.
 * @param chainId  - Target chain.
 * @param tokenIn  - Input token symbol (e.g. "USDC").
 * @param tokenOut - Output token symbol (e.g. "EURC").
 * @param amount   - Input amount as a decimal string.
 * @returns Transaction hash.
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

  const result = await kit.swap({
    from: { adapter, chain },
    tokenIn,
    tokenOut,
    amountIn: amount,
    config: { kitKey: ARC_KIT_KEY },
  } as Parameters<typeof kit.swap>[0]);

  const txHash = extractTxHash(result);
  return { txHash };
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

  const result = await kit.bridge({
    from: { adapter, chain: fromChain },
    to: { adapter, chain: toChain },
    amount,
    token: "USDC",
  } as Parameters<typeof kit.bridge>[0]);

  const txHash = extractTxHash(result);
  return { txHash };
}

export default getAppKit;
