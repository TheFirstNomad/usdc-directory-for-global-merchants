import { CHAINS, type SupportedChainId } from "@/lib/swap/chains";

const ChainSelector = ({
  chainId,
  onChange,
}: {
  chainId: SupportedChainId;
  onChange: (id: SupportedChainId) => void;
}) => (
  <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/30 border border-border/50">
    {(Object.entries(CHAINS) as [string, (typeof CHAINS)[SupportedChainId]][]).map(
      ([id, chain]) => {
        const numId = Number(id) as SupportedChainId;
        const active = numId === chainId;
        return (
          <button
            key={id}
            onClick={() => onChange(numId)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {chain.shortName}
            {chain.isTestnet && (
              <span className="ml-1.5 text-[10px] opacity-70">testnet</span>
            )}
          </button>
        );
      }
    )}
  </div>
);

export default ChainSelector;
