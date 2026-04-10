/**
 * Circle Arc App Kit integration
 * Supports both Base Mainnet and Arc Testnet via a single kit key.
 */

import { AppKit, Blockchain } from "@circle-fin/app-kit";
import { ArcTestnet, Base, EthereumSepolia } from "@circle-fin/app-kit/chains";
import { ViemAdapter } from "@circle-fin/adapter-viem-v2";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Chain,
} from "viem";

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

// ── Viem chain objects for the adapter ───────────────────────────────
const viemArcTestnet: Chain = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network/"] } },
  blockExplorers: { default: { name: "ArcScan", url: "https://testnet.arcscan.app" } },
  testnet: true,
};

const viemBase: Chain = {
  id: 8453,
  name: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://mainnet.base.org"] } },
  blockExplorers: { default: { name: "BaseScan", url: "https://basescan.org" } },
  testnet: false,
};

const viemEthSepolia: Chain = {
  id: 11155111,
  name: "Ethereum Sepolia",
  nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.sepolia.org"] } },
  blockExplorers: { default: { name: "Etherscan", url: "https://sepolia.etherscan.io" } },
  testnet: true,
};

// Map Circle Blockchain enum → viem Chain
const chainMap: Record<string, Chain> = {
  [Blockchain.Arc_Testnet]: viemArcTestnet,
  [Blockchain.Base]: viemBase,
  [Blockchain.Ethereum_Sepolia]: viemEthSepolia,
};

// Map our SupportedChainId → Circle Blockchain enum
export type PaymentChainId = 8453 | 5042002;

export function toBlockchainEnum(chainId: PaymentChainId): typeof Blockchain.Base | typeof Blockchain.Arc_Testnet {
  return chainId === 8453 ? Blockchain.Base : Blockchain.Arc_Testnet;
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
  if (raw.includes("kitKey") || raw.includes("validation")) return `Configuration error. Please try again or switch to ${chain === "Arc Testnet" ? "Base Mainnet" : "Arc Testnet"}.`;
  if (raw.includes("disconnected") || raw.includes("wallet")) return "Wallet disconnected. Please reconnect and try again.";
  return raw || `Transaction failed on ${chain}. Please try again.`;
}

// ── Create adapter from the user's browser wallet ────────────────────
export function createViemAdapterFromWallet(account: `0x${string}`): ViemAdapter {
  const provider = (window as any).ethereum;
  if (!provider) throw new Error("No wallet detected. Please install MetaMask or another Web3 wallet.");

  return new ViemAdapter(
    {
      getPublicClient: (({ chain }: { chain: any }) => {
        const viemChain = chainMap[chain as unknown as string] || viemArcTestnet;
        return createPublicClient({ chain: viemChain, transport: http() });
      }) as any,
      getWalletClient: (({ chain }: { chain: any }) => {
        const viemChain = chainMap[chain as unknown as string] || viemArcTestnet;
        return createWalletClient({ account, chain: viemChain, transport: custom(provider) });
      }) as any,
    },
    {
      addressContext: "user-controlled",
      supportedChains: [ArcTestnet, Base, EthereumSepolia],
    }
  );
}

// ── Singleton AppKit instance ────────────────────────────────────────
let _kit: AppKit | null = null;

export function getAppKit(): AppKit {
  if (!_kit) {
    _kit = new AppKit({ kitKey: ARC_KIT_KEY } as any);
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
    const kit = getAppKit();
    const chain = toBlockchainEnum(chainId);
    const result = await kit.swap({
      from: { adapter, chain },
      amountIn: amount,
      tokenIn,
      tokenOut,
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
