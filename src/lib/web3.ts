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

export const LISTING_FEE_DISPLAY = "10";
export const UPDATE_FEE_DISPLAY = "5";

export const BASE_EXPLORER_URL = "https://basescan.org";
