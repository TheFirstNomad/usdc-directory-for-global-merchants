import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { SupportedChainId } from "@/lib/swap/chains";
import { CHAINS } from "@/lib/swap/chains";

interface ChainContextValue {
  chainId: SupportedChainId;
  setChainId: (id: SupportedChainId) => void;
  chainConfig: (typeof CHAINS)[SupportedChainId];
  isArcTestnet: boolean;
}

const ChainContext = createContext<ChainContextValue | null>(null);

export const ChainProvider = ({ children }: { children: ReactNode }) => {
  const [chainId, setChainIdState] = useState<SupportedChainId>(8453);

  const setChainId = useCallback((id: SupportedChainId) => {
    setChainIdState(id);
  }, []);

  const chainConfig = CHAINS[chainId];
  const isArcTestnet = chainId === 5042002;

  return (
    <ChainContext.Provider value={{ chainId, setChainId, chainConfig, isArcTestnet }}>
      {children}
    </ChainContext.Provider>
  );
};

export const useChainContext = () => {
  const ctx = useContext(ChainContext);
  if (!ctx) throw new Error("useChainContext must be used within ChainProvider");
  return ctx;
};
