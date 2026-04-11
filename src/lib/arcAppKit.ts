/**
 * Circle Arc App Kit integration
 * Supports both Base Mainnet and Arc Testnet via a single kit key.
 */

import { AppKit } from "@circle-fin/app-kit";
import { ArcTestnet, Base, EthereumSepolia } from "@circle-fin/app-kit/chains";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";

// ── Your real Kit Key (hardcoded fallback - safe for client-side) ─────
const ARC_KIT_KEY = "KIT_KEY:0d00dda04082f989e0ca58a639c97cd5:54ceb72723ecb14061b2e263ae03fad1";
// ← PASTE YOUR FULL REAL KEY HERE (must start with KIT_KEY:)

if (!ARC_KIT_KEY || !ARC_KIT_KEY.startsWith("KIT_KEY:")) {
  console.error("❌ ARC_KIT_KEY is missing or invalid. Please update arcAppKit.ts");
}

// ── Treasury wallet for listing payments ─────────────────────────────
export const TREASURY_ADDRESS: `0x${string}` = "0x13fA78AB20762c8F49B58D44dbC177d2adB94D7C";

// ── Supported chains ─────────────────────────────────────────────────
export const SUPPORTED_CHAINS = [ArcTestnet, Base, EthereumSepolia] as const;

export type PaymentChainId = 8453 | 5042002; // Base | Arc Testnet

export function getChainLabel(chainId: PaymentChainId): string {
  return chainId === 8453 ? "Base Mainnet" : "Arc Testnet";
}

export function getExplorerUrl(chainId: PaymentChainId, txHash: string): string {
  return chainId === 8453 ? `https://basescan.org/tx/${txHash}` : `https://testnet.arcscan.app/tx/${txHash}`;
}

export function getExplorerName(chainId: PaymentChainId): string {
  return chainId === 8453 ? "BaseScan" : "ArcScan";
}

// ── Create Viem Adapter from connected wallet ───────────────────────
export async function createViemAdapterFromWallet(_account?: `0x${string}`) {
  const provider = (window as any).ethereum;
  if (!provider) throw new Error("No wallet detected. Please connect MetaMask or another EVM wallet.");

  return await createViemAdapterFromProvider({
    provider,
    capabilities: {
      addressContext: "user-controlled",
      supportedChains: SUPPORTED_CHAINS,
    } as any,
  });
}

// ── Singleton AppKit instance ────────────────────────────────────────
let _kit: AppKit | null = null;

function getAppKit(): AppKit {
  if (!_kit) {
    _kit = new AppKit({
      kitKey: ARC_KIT_KEY,
    } as any);
  }
  return _kit;
}

// ── Pay Listing Fee ──────────────────────────────────────────────────
export async function payListingFee(adapter: any, chainId: PaymentChainId = 5042002, amount: string = "10") {
  const kit = getAppKit();
  const chain = chainId === 8453 ? Base : ArcTestnet;

  const result = await kit.send({
    from: { adapter, chain },
    to: TREASURY_ADDRESS,
    amount,
    token: "USDC",
  });

  const txHash = (result as any).txHash || (result as any).transactionHash || String(result);
  return { txHash, explorerUrl: getExplorerUrl(chainId, txHash) };
}

// ── Generic swap via App Kit ─────────────────────────────────────────
export async function swapViaKit(
  adapter: any,
  chainId: PaymentChainId,
  tokenIn: string,
  tokenOut: string,
  amount: string,
) {
  const kit = getAppKit();
  const chain = chainId === 8453 ? Base : ArcTestnet;

  const result = await kit.swap({
    from: { adapter, chain },
    tokenIn,
    tokenOut,
    amountIn: amount,
  } as any);

  const txHash = (result as any).txHash || (result as any).transactionHash || String(result);
  return { txHash };
}

// ── Bridge USDC ──────────────────────────────────────────────────────
export async function bridgeUsdc(adapter: any, fromChain: any, toChain: any, amount: string) {
  const kit = getAppKit();

  const chainMap: Record<string, any> = {
    "Arc_Testnet": ArcTestnet,
    "Base": Base,
    "Ethereum_Sepolia": EthereumSepolia,
  };
  const from = chainMap[fromChain] || fromChain;
  const to = chainMap[toChain] || toChain;

  const result = await kit.bridge({
    from: { adapter, chain: from },
    to: { adapter, chain: to },
    amount,
    token: "USDC",
  } as any);

  const txHash = (result as any).txHash || (result as any).transactionHash || String(result);
  return { txHash };
}

export default getAppKit;
