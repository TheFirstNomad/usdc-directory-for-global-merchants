import { defineChain } from "viem";

export const baseMainnet = defineChain({
  id: 8453,
  name: "Base",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://mainnet.base.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "BaseScan",
      url: "https://basescan.org",
    },
  },
  testnet: false,
});

// Treasury wallet — set via env or fallback
export const TREASURY_ADDRESS: `0x${string}` =
  (import.meta.env.VITE_TREASURY_ADDRESS as `0x${string}`) ||
  "0x13FA78ab20762c8F49B58D44DBc177a2Adb94D7c";

// Listing fee in USDC (6 decimals)
export const LISTING_FEE = 10_000_000n; // 10 USDC
export const UPDATE_FEE = 5_000_000n; // 5 USDC
export const LISTING_FEE_AGENT = 1_000_000n; // 1 USDC — agent self-listing
export const BOOST_FEE = 5_000_000n; // 5 USDC — featured boost (30 days)
export const VERIFIED_FEE = 20_000_000n; // 20 USDC — verified agent badge
export const API_CALL_FEE = 1_000n; // $0.001 — per metered API call

export const LISTING_FEE_DISPLAY = "10";
export const UPDATE_FEE_DISPLAY = "5";
export const LISTING_FEE_AGENT_DISPLAY = "1";
export const BOOST_FEE_DISPLAY = "5";
export const VERIFIED_FEE_DISPLAY = "20";

// USDC contract addresses (per chain)
export const USDC_ADDRESSES: Record<number, `0x${string}`> = {
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base mainnet
  5042002: "0x75faF114eafb1BDbe2F0316DF893fd58CE46AA4d", // Arc Testnet
  11155111: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia
};

export const BASE_EXPLORER_URL = "https://basescan.org";
