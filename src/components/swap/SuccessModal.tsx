import { CheckCircle2, ExternalLink, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export type SuccessMode = "swap" | "add-liquidity" | "remove-liquidity";

const SuccessModal = ({
  open,
  txHash,
  explorerUrl,
  explorerName,
  paySymbol,
  payAmount,
  receiveSymbol,
  receiveAmount,
  mode = "swap",
  onClose,
}: {
  open: boolean;
  txHash: string;
  explorerUrl: string;
  explorerName: string;
  paySymbol: string;
  payAmount: string;
  receiveSymbol: string;
  receiveAmount: string;
  mode?: SuccessMode;
  onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  if (!open) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl p-6 animate-scale-in">
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-9 w-9 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-1">
            {mode === "add-liquidity" ? "Liquidity Added!" : mode === "remove-liquidity" ? "Liquidity Removed!" : "Swap Successful!"}
          </h3>
          <p className="text-sm text-muted-foreground mb-5">
            {payAmount} {paySymbol} → {receiveAmount} {receiveSymbol}
          </p>

          <div className="w-full bg-muted/20 rounded-xl p-3 mb-5">
            <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
            <div className="flex items-center gap-2">
              <code className="text-xs text-foreground font-mono truncate flex-1">
                {txHash}
              </code>
              <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            </div>
          </div>

          <a
            href={`${explorerUrl}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <Button variant="outline" className="w-full gap-2">
              <ExternalLink className="h-4 w-4" />
              View on {explorerName}
            </Button>
          </a>
          <Button onClick={onClose} className="w-full mt-2 bg-primary hover:bg-primary/90">
            {mode === "swap" ? "New Swap" : "Done"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
