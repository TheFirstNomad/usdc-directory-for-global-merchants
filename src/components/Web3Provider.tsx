import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";
import { base } from "@reown/appkit/networks";
import type { ReactNode } from "react";

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || "3592c16759a9b6907bc4eb5afd455b15";

// Arc Testnet custom chain (USDC-native gas token)
const arcTestnet = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
  blockExplorers: { default: { name: "ArcScan", url: "https://testnet.arcscan.app" } },
  testnet: true,
} as any;

const networks = [base, arcTestnet] as const;

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: networks as any,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: networks as any,
  projectId,
  metadata: {
    name: "USDC Directory",
    description: "Discover businesses that accept USDC payments",
    url: typeof window !== "undefined" ? window.location.origin : "https://usdc-directory.lovable.app",
    icons: [],
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "hsl(210, 79%, 55%)",
    "--w3m-border-radius-master": "2px",
  },
  features: {
    email: false,
    socials: false,
  },
});

const queryClient = new QueryClient();

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
};
