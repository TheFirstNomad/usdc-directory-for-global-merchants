/**
 * ArcPaymentPanel – Supports payments on both Base Mainnet and Arc Testnet.
 * After successful payment, persists listing/update data via submit-listing edge function.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Wallet,
  Droplets,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { useAppKit } from "@reown/appkit/react";
import {
  createViemAdapterFromWallet,
  payListingFee,
  getExplorerUrl,
  getExplorerName,
  getChainLabel,
  type PaymentChainId,
} from "@/lib/arcAppKit";
import { useChainContext } from "@/contexts/ChainContext";

interface ArcPaymentPanelProps {
  type: "listing" | "update";
  submissionData: Record<string, unknown>;
  onSuccess: (txHash: string) => void;
}

async function persistListing(
  type: "listing" | "update",
  txHash: string,
  walletAddress: string,
  submissionData: Record<string, unknown>,
) {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL || `https://${projectId}.supabase.co`;

  const res = await fetch(`${supabaseUrl}/functions/v1/submit-listing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      tx_hash: txHash,
      wallet_address: walletAddress,
      data: submissionData,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || "Failed to save listing");
  }
  return res.json();
}

const ArcPaymentPanel = ({ type, submissionData, onSuccess }: ArcPaymentPanelProps) => {
  const { toast } = useToast();
  const { isConnected, address } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const { open } = useAppKit();
  const { chainId } = useChainContext();

  const [paying, setPaying] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fee = type === "listing" ? "10" : "5";
  const paymentChainId = chainId as PaymentChainId;
  const chainLabel = getChainLabel(paymentChainId);
  const explorerName = getExplorerName(paymentChainId);

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      const adapter = await createViemAdapterFromWallet(walletProvider);
      const result = await payListingFee(adapter, paymentChainId, fee);

      // Persist to database
      try {
        await persistListing(type, result.txHash, address!, submissionData);
      } catch (saveErr: any) {
        console.error("Failed to persist listing:", saveErr);
        toast({
          title: "Payment succeeded but listing save failed",
          description: "Your payment went through. Please contact support with your tx hash.",
          variant: "destructive",
        });
      }

      setTxHash(result.txHash);
      toast({ title: "Payment successful!", description: `Tx: ${result.txHash.slice(0, 12)}…` });
      onSuccess(result.txHash);
    } catch (err: any) {
      const msg = err?.message || `Payment failed on ${chainLabel}`;
      setError(msg);
      toast({ title: "Payment failed", description: msg, variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  const copyTx = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      toast({ title: "Copied!" });
    }
  };

  // ── Success state ──
  if (txHash) {
    return (
      <div className="space-y-4 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-foreground">Payment Confirmed!</h3>
        <p className="text-sm text-muted-foreground">
          Your {fee} USDC payment on {chainLabel} was successful.
        </p>
        <div className="bg-muted/50 rounded-xl p-3 flex items-center justify-between gap-2">
          <span className="text-xs font-mono text-muted-foreground truncate">{txHash}</span>
          <button onClick={copyTx} className="text-primary hover:text-primary/80 shrink-0">
            <Copy className="h-4 w-4" />
          </button>
        </div>
        <a
          href={getExplorerUrl(paymentChainId, txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" /> View on {explorerName}
        </a>
      </div>
    );
  }

  // ── Not connected ──
  if (!isConnected) {
    return (
      <div className="space-y-4 text-center">
        <h3 className="text-xl font-bold text-foreground">{fee} USDC</h3>
        <p className="text-sm text-muted-foreground">
          {type === "listing" ? "One-time listing fee" : "One-time update fee"} — paid on {chainLabel}
        </p>
        <Button
          onClick={() => open()}
          className="w-full bg-gradient-to-r from-primary to-[hsl(var(--accent))] text-primary-foreground font-semibold py-6 rounded-xl text-base"
        >
          <Wallet className="h-5 w-5 mr-2" /> Connect Wallet to Pay
        </Button>
      </div>
    );
  }

  // ── Main payment UI ──
  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="text-xl font-bold text-foreground">{fee} USDC</h3>
        <p className="text-sm text-muted-foreground">
          {type === "listing" ? "One-time listing fee" : "One-time update fee"} on {chainLabel}
        </p>
      </div>

      <Button
        onClick={handlePay}
        disabled={paying}
        className="w-full bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground font-semibold py-6 rounded-xl text-base"
      >
        {paying ? (
          <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Processing Payment…</>
        ) : (
          <>💰 Pay {fee} USDC on {chainLabel}</>
        )}
      </Button>

      <a
        href="https://faucet.circle.com"
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Button variant="outline" className="w-full py-5 rounded-xl" type="button">
          <Droplets className="h-4 w-4 mr-2" />
          {paymentChainId === 5042002
            ? "Get Test USDC & Bridge (Circle Faucet)"
            : "Get USDC via Circle Faucet"}
        </Button>
      </a>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <div className="bg-muted/50 rounded-xl p-4">
        <p className="text-xs text-muted-foreground">
          🔵 Payments are processed on <strong>{chainLabel}</strong> using Circle's App Kit.
          Need USDC? Use the button above to get USDC from the Circle faucet.
        </p>
      </div>
    </div>
  );
};

export default ArcPaymentPanel;
