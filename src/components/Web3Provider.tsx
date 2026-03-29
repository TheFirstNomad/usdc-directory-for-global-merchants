import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";
import { forwardRef, type ReactNode } from "react";

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || "3592c16759a9b6907bc4eb5afd455b15";

const baseMainnetNetwork = {
  id: "eip155:8453",
  caipNetworkId: "eip155:8453" as const,
  chainId: 8453,
  name: "Base",
  currency: "ETH",
  explorerUrl: "https://basescan.org",
  rpcUrl: "https://mainnet.base.org",
  chainNamespace: "eip155" as const,
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
};

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [baseMainnetNetwork],
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [baseMainnetNetwork],
  projectId,
  metadata: {
    name: "USDC Directory",
    description: "Discover businesses that accept USDC payments",
    url: typeof window !== "undefined" ? window.location.origin : "https://usdc-directory.lovable.app",
    icons: ["/Circle_USDC_Logo.svg"],
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "hsl(210, 79%, 55%)",
    "--w3m-border-radius-master": "2px",
  },
});

const queryClient = new QueryClient();

export const Web3Provider = forwardRef<HTMLDivElement, { children: ReactNode }>(
  ({ children }, _ref) => {
    return (
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    );
  }
);

Web3Provider.displayName = "Web3Provider";
