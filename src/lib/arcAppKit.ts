/**
 * Circle Arc App Kit integration
 *
 * Handles:
 * - kit.send()   – listing payments (testnet + mainnet)
 * - kit.bridge() – cross-chain USDC transfers (testnet)
 * - kit.swap()   – token swaps (testnet + mainnet)
 */

import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";

// ── Kit Key ──────────────────────────────────────────────────────────
export const ARC_KIT_KEY: string =
  import.meta.env.VITE_ARC_KIT_KEY ||
  "KIT_KEY:0d00dda04082f989e0ca58a639c97cd5:54ceb72723ecb14061b2e263ae03fad1";

if (!ARC_KIT_KEY || !ARC_KIT_KEY.startsWith("KIT_KEY:")) {
  console.error("❌ ARC_KIT_KEY is missing or invalid.");
}

// ── Treasury wallet for listing payments ─────────────────────────────
export const TREASURY_ADDRESS: `0x${string}` = "0x13fA78AB20762c8F49B58D44dbC177d2adB94D7C";

// ── Chain helpers ────────────────────────────────────────────────────
export type PaymentChainId = 8453 | 5042002;

/** Map numeric chain ID to the exact string literal the Circle SDK expects */
function chainString(chainId: PaymentChainId): string {
  return chainId === 8453 ? "Base" : "Arc_Testnet";
}

export function getChainLabel(chainId: PaymentChainId): string {
  return chainId === 8453 ? "Base Mainnet" : "Arc Testnet";
}

export function getExplorerUrl(chainId: PaymentChainId, txHash: string): string {
  return chainId === 8453
    ? `https://basescan.org/tx/${txHash}`
    : `https://testnet.arcscan.app/tx/${txHash}`;
}

export function getExplorerName(chainId: PaymentChainId): string {
  return chainId === 8453 ? "BaseScan" : "ArcScan";
}

// ── Create Viem Adapter from browser wallet ─────────────────────────
export async function createViemAdapterFromWallet(_account?: `0x${string}`) {
  const provider = (window as any).ethereum;
  if (!provider) {
    throw new Error("No wallet detected. Please connect MetaMask or another EVM wallet.");
  }

  return await createViemAdapterFromProvider({ provider });
}

// ── Singleton AppKit instance ────────────────────────────────────────
let _kit: AppKit | null = null;

function getAppKit(): AppKit {
  if (!_kit) {
    _kit = new AppKit({ kitKey: ARC_KIT_KEY } as any);
  }
  return _kit;
}

// ── Pay Listing Fee (kit.send) ──────────────────────────────────────
export async function payListingFee(
  adapter: any,
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
  } as any);

  const txHash =
    (result as any).txHash ||
    (result as any).transactionHash ||
    String(result);
  return { txHash, explorerUrl: getExplorerUrl(chainId, txHash) };
}

// ── Swap via App Kit ────────────────────────────────────────────────
export async function swapViaKit(
  adapter: any,
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
  } as any);

  const txHash =
    (result as any).txHash ||
    (result as any).transactionHash ||
    String(result);
  return { txHash };
}

// ── Bridge USDC ─────────────────────────────────────────────────────
export async function bridgeUsdc(
  adapter: any,
  fromChain: any,
  toChain: any,
  amount: string,
) {
  const kit = getAppKit();

  // Accept both string literals and Blockchain enum values
  const normalizeChain = (c: any): string => {
    if (typeof c === "string") return c;
    return String(c);
  };

  const result = await kit.bridge({
    from: { adapter, chain: normalizeChain(fromChain) },
    to: { adapter, chain: normalizeChain(toChain) },
    amount,
    token: "USDC",
  } as any);

  const txHash =
    (result as any).txHash ||
    (result as any).transactionHash ||
    String(result);
  return { txHash };
}

export default getAppKit;
