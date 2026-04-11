/**
 * Circle Arc App Kit integration
 * Supports both Base Mainnet and Arc Testnet via a single kit key.
 */

import { AppKit, Blockchain } from "@circle-fin/app-kit";
import { ArcTestnet, Base, EthereumSepolia } from "@circle-fin/app-kit/chains";
import { createViemAdapterFromProvider, ViemAdapter } from "@circle-fin/adapter-viem-v2";

// ── Client-side publishable key ──────────────────────────────────────
export const ARC_KIT_KEY =
  import.meta.env.VITE_ARC_KIT_KEY ||
  "KIT_KEY:0d00dda04082f989e0ca58a639c97cd5:54ceb72723ecb14061b2e263ae03fad1";

// ── Treasury wallet for listing payments ─────────────────────────────
export const TREASURY_ADDRESS: `0x${string}` =
  (import.meta.env.VITE_TREASURY_ADDRESS as `0x${string}`) ||
  "0x13fA78AB20762c8F49B58D44dbC177d2adB94D7C";

// ── Supported chains ─────────────────────────────────────────────────
export const SUPPORTED_CHAINS = [ArcTestnet, Base, EthereumSepolia] as const;

// Map our SupportedChainId → Circle Blockchain enum
export type PaymentChainId = 8453 | 5042002;

export function toBlockchainEnum(chainId: PaymentChainId): typeof Blockchain.Base | typeof Blockchain.Arc_Testnet {
  return chainId === 8453 ? Blockchain.Base : Blockchain.Arc_Testnet;
}

// Map PaymentChainId → exact string literal the Circle API expects
export function toChainString(chainId: PaymentChainId): "Base" | "Arc_Testnet" {
  return chainId === 8453 ? "Base" : "Arc_Testnet";
}

export function getExplorerUrl(chainId: PaymentChainId, txHash: string): string {
  return chainId === 8453
    ? `https://basescan.org/tx/${txHash}`
    : `https://testnet.arcscan.app/tx/${txHash}`;
}

export function getExplorerName(chainId: PaymentChainId): string {
  return chainId === 8453 ? "BaseScan" : "ArcScan";
}

export function getChainLabel(chainId: PaymentChainId): string {
  return chainId === 8453 ? "Base Mainnet" : "Arc Testnet";
}

// ── Friendly error messages ─────────────────────────────────────────
function friendlyError(err: any, chainId: PaymentChainId): string {
  const raw = err?.shortMessage || err?.message || "";
  const chain = getChainLabel(chainId);
  if (raw.includes("user rejected") || raw.includes("User denied")) return "Transaction was cancelled.";
  if (raw.includes("insufficient funds") || raw.includes("exceeds balance")) return `Insufficient USDC balance on ${chain}. Please bridge funds first.`;
  if (raw.includes("disconnected") || raw.includes("wallet")) return "Wallet disconnected. Please reconnect and try again.";
  return raw || `Transaction failed on ${chain}. Please try again.`;
}

// ── Create adapter from the user's browser wallet ────────────────────
type BrowserWalletProvider = {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
};

function assertArcKitKey(): string {
  const kitKey = ARC_KIT_KEY?.trim();
  if (!kitKey) {
    throw new Error("Circle App Kit key is missing. Add VITE_ARC_KIT_KEY to the project settings before swapping.");
  }

  if (!kitKey.startsWith("KIT_KEY:")) {
    throw new Error("Circle App Kit key format is invalid. It must start with KIT_KEY:.");
  }

  return kitKey;
}

export async function createViemAdapterFromWallet(account: `0x${string}`): Promise<ViemAdapter> {
  const provider = (window as any).ethereum;
  if (!provider) throw new Error("No wallet detected. Please install MetaMask or another Web3 wallet.");

  const accounts = await (provider as BrowserWalletProvider).request({ method: "eth_requestAccounts" });
  const normalizedAccount = String(Array.isArray(accounts) ? accounts[0] : "").toLowerCase();
  if (!normalizedAccount || normalizedAccount !== account.toLowerCase()) {
    throw new Error("Connected wallet address does not match the active account. Reconnect your wallet and try again.");
  }

  return await createViemAdapterFromProvider({
    provider: provider as any,
    capabilities: {
      addressContext: "user-controlled",
      supportedChains: SUPPORTED_CHAINS,
    } as any,
  }) as ViemAdapter;
}

// ── Singleton AppKit instance ────────────────────────────────────────
let _kit: AppKit | null = null;

export function getAppKit(): AppKit {
  if (!_kit) {
    _kit = new AppKit(ARC_KIT_KEY ? ({ kitKey: ARC_KIT_KEY } as any) : undefined);
  }
  return _kit;
}

// ── Helper: Pay listing fee on any supported chain ───────────────────
export async function payListingFee(
  adapter: ViemAdapter,
  chainId: PaymentChainId = 5042002,
  amount: string = "10"
): Promise<{ txHash: string; explorerUrl: string }> {
  try {
    const kit = getAppKit();
    const chain = toBlockchainEnum(chainId);
    const result = await kit.send({
      from: { adapter, chain },
      to: TREASURY_ADDRESS,
      amount,
      token: "USDC",
    });

    const txHash = (result as any).txHash || (result as any).transactionHash || String(result);
    return { txHash, explorerUrl: getExplorerUrl(chainId, txHash) };
  } catch (err: any) {
    throw new Error(friendlyError(err, chainId));
  }
}

// ── Helper: Bridge USDC between chains ───────────────────────────────
export async function bridgeUsdc(
  adapter: ViemAdapter,
  sourceChain: typeof Blockchain.Base | typeof Blockchain.Ethereum_Sepolia | typeof Blockchain.Arc_Testnet,
  destChain: typeof Blockchain.Base | typeof Blockchain.Ethereum_Sepolia | typeof Blockchain.Arc_Testnet,
  amount: string
): Promise<{ txHash: string }> {
  try {
    const kit = getAppKit();
    const result = await kit.bridge({
      from: { adapter, chain: sourceChain },
      to: { adapter, chain: destChain },
      amount,
      token: "USDC",
    });

    const txHash = (result as any).txHash || (result as any).transactionHash || String(result);
    return { txHash };
  } catch (err: any) {
    throw new Error(friendlyError(err, 5042002));
  }
}

// ── Helper: Swap on any supported chain ──────────────────────────────
export async function swapViaKit(
  adapter: ViemAdapter,
  chainId: PaymentChainId,
  tokenIn: string,
  tokenOut: string,
  amount: string
): Promise<{ txHash: string }> {
  try {
    const kitKey = assertArcKitKey();
    const kit = getAppKit();
    const chain = toChainString(chainId);
    const result = await kit.swap({
      from: { adapter, chain },
      tokenIn,
      tokenOut,
      amountIn: amount,
      config: { kitKey },
    });

    const txHash = (result as any).txHash || (result as any).transactionHash || String(result);
    return { txHash };
  } catch (err: any) {
    throw new Error(friendlyError(err, chainId));
  }
}

// ── Legacy wrappers (backward compat) ────────────────────────────────
export async function bridgeToArc(
  adapter: ViemAdapter,
  sourceChain: typeof Blockchain.Base | typeof Blockchain.Ethereum_Sepolia,
  amount: string
): Promise<{ txHash: string }> {
  return bridgeUsdc(adapter, sourceChain, Blockchain.Arc_Testnet, amount);
}

export async function swapUsdcToEurc(
  adapter: ViemAdapter,
  amount: string
): Promise<{ txHash: string }> {
  return swapViaKit(adapter, 5042002, "USDC", "EURC", amount);
}
