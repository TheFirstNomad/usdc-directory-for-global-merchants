import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import type { TokenInfo } from "@/lib/swap/tokens";
import { searchTokens, TOKENS_BY_CHAIN } from "@/lib/swap/tokens";

const TokenSearchModal = ({
  open,
  onClose,
  onSelect,
  excludeSymbol,
  chainId,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (token: TokenInfo) => void;
  excludeSymbol: string;
  chainId: number;
}) => {
  const [query, setQuery] = useState("");
  const tokens = TOKENS_BY_CHAIN[chainId] ?? [];
  const filtered = useMemo(
    () => searchTokens(tokens, query).filter((t) => t.symbol !== excludeSymbol),
    [tokens, query, excludeSymbol]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h2 className="text-lg font-semibold text-foreground">Select Token</h2>
          <button
            onClick={() => { onClose(); setQuery(""); }}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/50 bg-muted/30">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or paste address"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto px-2 pb-4">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No tokens found</p>
          ) : (
            filtered.map((token) => (
              <button
                key={token.symbol}
                onClick={() => { onSelect(token); onClose(); setQuery(""); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <img src={token.logoUrl} alt={token.symbol} className="w-8 h-8 rounded-full" />
                <div className="text-left">
                  <div className="font-medium text-foreground">{token.symbol}</div>
                  <div className="text-xs text-muted-foreground">{token.name}</div>
                </div>
                {token.address !== "native" && (
                  <span className="ml-auto text-[10px] text-muted-foreground/50 font-mono">
                    {token.address.slice(0, 6)}…{token.address.slice(-4)}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TokenSearchModal;
