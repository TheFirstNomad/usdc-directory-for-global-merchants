import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { arcTestnet } from "@/lib/web3";
import type { ReactNode } from "react";

const config = getDefaultConfig({
  appName: "USDC Directory",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo",
  chains: [arcTestnet],
  ssr: false,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "hsl(210, 79%, 55%)",
            accentColorForeground: "white",
            borderRadius: "large",
            fontStack: "system",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
