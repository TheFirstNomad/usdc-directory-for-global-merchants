/**
 * Circle Arc App Kit integration
 * Provides bridging, sending, and swapping via Circle's CCTP infrastructure.
 *
 * Uses the ViemAdapter from @circle-fin/adapter-viem-v2 to connect
 * with the user's existing wagmi/viem wallet.
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
// This is NOT a secret — it's a publishable kit key safe for the browser.
export const ARC_KIT_KEY =
  import.meta.env.VITE_ARC_KIT_KEY ||
  "KIT_KEY:0d00dda04082f989e0ca58a639c97cd5:54ceb72723ecb14061b2e263ae03fad1";

// ── Treasury wallet for listing payments ─────────────────────────────
export const TREASURY_ADDRESS: `0x${string}` =
  (import.meta.env.VITE_TREASURY_ADDRESS as `0x${string}`) ||
  "0x13FA78ab20762c8F49B58D44DBc177d2Adb94D7c";

// ── Supported chains ─────────────────────────────────────────────────
export const SUPPORTED_CHAINS = [ArcTestnet, Base, EthereumSepolia] as const;

// ── Viem chain objects for the adapter ───────────────────────────────
const viemArcTestnet: Chain = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.network/"] },
  },
  blockExplorers: {
    default: { name: "ArcScan", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
};

const viemBase: Chain = {
  id: 8453,
  name: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://mainnet.base.org"] } },
  blockExplorers: {
    default: { name: "BaseScan", url: "https://basescan.org" },
  },
  testnet: false,
};

const viemEthSepolia: Chain = {
  id: 11155111,
  name: "Ethereum Sepolia",
  nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.sepolia.org"] },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
  },
  testnet: true,
};

// Map Circle Blockchain enum → viem Chain
const chainMap: Record<string, Chain> = {
  [Blockchain.Arc_Testnet]: viemArcTestnet,
  [Blockchain.Base]: viemBase,
  [Blockchain.Ethereum_Sepolia]: viemEthSepolia,
};

// ── Create adapter from the user's browser wallet (window.ethereum) ──
export function createViemAdapterFromWallet(): ViemAdapter {
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
        return createWalletClient({
          chain: viemChain,
          transport: custom(provider),
        });
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
    _kit = new AppKit();
  }
  return _kit;
}

// ── Helper: Send 10 USDC on Arc Testnet to treasury ─────────────────
export async function payListingFee(adapter: ViemAdapter): Promise<{
  txHash: string;
  explorerUrl: string;
}> {
  const kit = getAppKit();
  const result = await kit.send({
    from: { adapter, chain: Blockchain.Arc_Testnet },
    to: TREASURY_ADDRESS,
    amount: "10",
    token: "USDC",
  });

  const txHash = (result as any).txHash || (result as any).transactionHash || String(result);
  return {
    txHash,
    explorerUrl: `https://testnet.arcscan.app/tx/${txHash}`,
  };
}

// ── Helper: Bridge USDC to Arc Testnet ───────────────────────────────
export async function bridgeToArc(
  adapter: ViemAdapter,
  sourceChain: typeof Blockchain.Base | typeof Blockchain.Ethereum_Sepolia,
  amount: string
): Promise<{ txHash: string }> {
  const kit = getAppKit();
  const result = await kit.bridge({
    from: { adapter, chain: sourceChain },
    to: { adapter, chain: Blockchain.Arc_Testnet },
    amount,
    token: "USDC",
  });

  const txHash = (result as any).txHash || (result as any).transactionHash || String(result);
  return { txHash };
}

// ── Helper: Swap USDC → EURC on Arc Testnet ──────────────────────────
export async function swapUsdcToEurc(
  adapter: ViemAdapter,
  amount: string
): Promise<{ txHash: string }> {
  const kit = getAppKit();
  const result = await kit.swap({
    from: { adapter, chain: Blockchain.Arc_Testnet },
    amount,
    tokenIn: "USDC",
    tokenOut: "EURC",
  });

  const txHash = (result as any).txHash || (result as any).transactionHash || String(result);
  return { txHash };
}
