/**
 * Chain registry — single source of truth for supported networks.
 * Arc mainnet ships disabled and is flipped on with one boolean
 * once Circle announces final RPC + USDC contract.
 */
export type ChainKey = "base" | "arc-testnet" | "arc-mainnet" | "sepolia";

export interface ChainEntry {
  id: number;
  key: ChainKey;
  label: string;
  network: string; // x402 network id
  rpc: string;
  usdc: `0x${string}`;
  explorer: string;
  enabled: boolean;
  appKitChain?: string; // Circle App Kit chain string
}

// Arc mainnet placeholders — replace once Circle publishes final values
const ARC_MAINNET_PLACEHOLDER: ChainEntry = {
  id: 5042001,
  key: "arc-mainnet",
  label: "Arc Mainnet",
  network: "arc",
  rpc: "https://rpc.arc.network",
  usdc: "0x0000000000000000000000000000000000000000",
  explorer: "https://arcscan.app",
  enabled: false, // flip to true when Circle launches
  appKitChain: "Arc",
};

export const CHAINS: Record<ChainKey, ChainEntry> = {
  base: {
    id: 8453, key: "base", label: "Base Mainnet", network: "base",
    rpc: "https://mainnet.base.org",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    explorer: "https://basescan.org",
    enabled: true,
    appKitChain: "Base",
  },
  "arc-testnet": {
    id: 5042002, key: "arc-testnet", label: "Arc Testnet", network: "arc-testnet",
    rpc: "https://rpc.testnet.arc.network",
    usdc: "0x75faF114eafb1BDbe2F0316DF893fd58CE46AA4d",
    explorer: "https://testnet.arcscan.app",
    enabled: true,
    appKitChain: "Arc_Testnet",
  },
  "arc-mainnet": ARC_MAINNET_PLACEHOLDER,
  sepolia: {
    id: 11155111, key: "sepolia", label: "Ethereum Sepolia", network: "sepolia",
    rpc: "https://ethereum-sepolia-rpc.publicnode.com",
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    explorer: "https://sepolia.etherscan.io",
    enabled: true,
  },
};

export const ENABLED_CHAINS = Object.values(CHAINS).filter((c) => c.enabled);
export const isArcMainnetLive = () => CHAINS["arc-mainnet"].enabled;
