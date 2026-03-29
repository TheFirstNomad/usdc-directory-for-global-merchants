import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";
import { forwardRef, type ReactNode } from "react";

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || "3592c16759a9b6907bc4eb5afd455b15";

const arcTestnetNetwork = {
  id: "eip155:5042002",
  caipNetworkId: "eip155:5042002" as const,
  chainId: 5042002,
  name: "Arc Testnet",
  currency: "USDC",
  explorerUrl: "https://testnet.arcscan.app",
  rpcUrl: "https://rpc.testnet.arc.network",
  chainNamespace: "eip155" as const,
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
    },
  },
};

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [arcTestnetNetwork],
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [arcTestnetNetwork],
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

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
