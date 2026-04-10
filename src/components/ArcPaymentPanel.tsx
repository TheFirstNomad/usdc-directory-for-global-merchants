/**
 * ArcPaymentPanel – Supports payments on both Base Mainnet and Arc Testnet.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRightLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  Wallet,
  ArrowDownUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppKitAccount } from "@reown/appkit/react";
import { useAppKit } from "@reown/appkit/react";
import {
  createViemAdapterFromWallet,
  payListingFee,
  bridgeUsdc,
  swapViaKit,
  getExplorerUrl,
  getExplorerName,
  getChainLabel,
  type PaymentChainId,
} from "@/lib/arcAppKit";
import { Blockchain } from "@circle-fin/app-kit";
import { useChainContext } from "@/contexts/ChainContext";

interface ArcPaymentPanelProps {
  type: "listing" | "update";
  submissionData: Record<string, unknown>;
  onSuccess: (txHash: string) => void;
}

const ArcPaymentPanel = ({ type, submissionData, onSuccess }: ArcPaymentPanelProps) => {
  const { toast } = useToast();
  const { isConnected, address } = useAppKitAccount();
  const { open } = useAppKit();
  const { chainId } = useChainContext();

  const [paying, setPaying] = useState(false);
  const [bridging, setBridging] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fee = type === "listing" ? "10" : "5";
  const paymentChainId = chainId as PaymentChainId;
  const chainLabel = getChainLabel(paymentChainId);
  const explorerName = getExplorerName(paymentChainId);

  // ── Pay listing fee ────────────────────────────────────────────────
  const handlePay = async () => {
    setPaying(true);
    setError(null);
    try {
      const adapter = createViemAdapterFromWallet(address as `0x${string}`);
      const result = await payListingFee(adapter, paymentChainId, fee);
      setTxHash(result.txHash);
      toast({ title: "Payment successful!", description: `Tx: ${result.txHash.slice(0, 12)}…` });
      onSuccess(result.txHash);
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || `Payment failed on ${chainLabel}`;
      setError(msg);
      toast({ title: "Payment failed", description: msg, variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  // ── Bridge USDC ────────────────────────────────────────────────────
  const handleBridge = async () => {
    setBridging(true);
    setError(null);
    try {
      const adapter = createViemAdapterFromWallet(address as `0x${string}`);
      if (paymentChainId === 5042002) {
        // Bridge from Ethereum Sepolia → Arc Testnet
        await bridgeUsdc(adapter, Blockchain.Ethereum_Sepolia, Blockchain.Arc_Testnet, "15");
        toast({ title: "Bridge initiated!", description: "USDC is being bridged to Arc Testnet. This may take 1-5 minutes." });
      } else {
        // Bridge from Ethereum Sepolia → Base
        await bridgeUsdc(adapter, Blockchain.Ethereum_Sepolia, Blockchain.Base, "15");
        toast({ title: "Bridge initiated!", description: "USDC is being bridged to Base. This may take 1-5 minutes." });
      }
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || `Bridge failed on ${chainLabel}`;
      setError(msg);
      toast({ title: "Bridge failed", description: msg, variant: "destructive" });
    } finally {
      setBridging(false);
    }
  };

  // ── Swap USDC → EURC (Arc only) ───────────────────────────────────
  const handleSwap = async () => {
    setSwapping(true);
    setError(null);
    try {
      const adapter = createViemAdapterFromWallet(address as `0x${string}`);
      await swapViaKit(adapter, paymentChainId, "USDC", "EURC", "10");
      toast({ title: "Swap complete!", description: `Swapped USDC → EURC on ${chainLabel}` });
    } catch (err: any) {
      const msg = err?.shortMessage || err?.message || `Swap failed on ${chainLabel}`;
      setError(msg);
      toast({ title: "Swap failed", description: msg, variant: "destructive" });
    } finally {
      setSwapping(false);
    }
  };

  const copyTx = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      toast({ title: "Copied!" });
    }
  };

  // ── Success state ──────────────────────────────────────────────────
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

  // ── Not connected ──────────────────────────────────────────────────
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

  // ── Main payment UI ────────────────────────────────────────────────
  const bridgeLabel = paymentChainId === 5042002
    ? "Bridge USDC from Sepolia → Arc Testnet"
    : "Bridge USDC from Sepolia → Base";

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="text-xl font-bold text-foreground">{fee} USDC</h3>
        <p className="text-sm text-muted-foreground">
          {type === "listing" ? "One-time listing fee" : "One-time update fee"} on {chainLabel}
        </p>
      </div>

      {/* Primary: Pay button */}
      <Button
        onClick={handlePay}
        disabled={paying || bridging || swapping}
        className="w-full bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground font-semibold py-6 rounded-xl text-base"
      >
        {paying ? (
          <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Processing Payment…</>
        ) : (
          <>💰 Pay {fee} USDC on {chainLabel}</>
        )}
      </Button>

      {/* Secondary: Bridge button */}
      <Button
        variant="outline"
        onClick={handleBridge}
        disabled={paying || bridging || swapping}
        className="w-full py-5 rounded-xl"
      >
        {bridging ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Bridging…</>
        ) : (
          <><ArrowRightLeft className="h-4 w-4 mr-2" /> {bridgeLabel}</>
        )}
      </Button>

      {/* Tertiary: Swap button (Arc only) */}
      {paymentChainId === 5042002 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSwap}
          disabled={paying || bridging || swapping}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          {swapping ? (
            <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Swapping…</>
          ) : (
            <><ArrowDownUp className="h-3.5 w-3.5 mr-1.5" /> Swap USDC → EURC on Arc</>
          )}
        </Button>
      )}

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <div className="bg-muted/50 rounded-xl p-4">
        <p className="text-xs text-muted-foreground">
          🔵 Payments are processed on <strong>{chainLabel}</strong> using Circle's App Kit. 
          Need USDC? Use the Bridge button above to move USDC from other chains.
        </p>
      </div>
    </div>
  );
};

export default ArcPaymentPanel;
