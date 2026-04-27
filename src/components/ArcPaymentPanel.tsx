/**
 * ArcPaymentPanel – Listing fee payments.
 *
 * Routing:
 *  • Base Mainnet (8453) → direct USDC `transfer()` via wagmi `sendTransaction`,
 *    with the ERC-8021 builder code suffix appended to calldata so the tx is
 *    attributed to `bc_madq6cms` on base.dev / BaseScan.
 *  • Arc Testnet (5042002) → Circle App Kit `kit.send()` (unchanged; Circle SDK
 *    builds its own calldata so attribution is not possible there).
 *
 * After confirmation, persists listing/update data via the submit-listing
 * edge function.
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
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppKitAccount, useAppKitProvider, useAppKit } from "@reown/appkit/react";
import { useSendTransaction, usePublicClient, useChainId, useSwitchChain } from "wagmi";
import {
  createViemAdapterFromWallet,
  payListingFee,
  getExplorerUrl,
  getExplorerName,
  getChainLabel,
  type PaymentChainId,
} from "@/lib/arcAppKit";
import {
  buildBaseUsdcTransferCalldata,
  getBaseScanInputDataUrl,
  BASE_CHAIN_ID,
  BASE_USDC_ADDRESS,
  type BasePaymentDebug,
} from "@/lib/basePayment";
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

  const { sendTransactionAsync } = useSendTransaction();
  const basePublicClient = usePublicClient({ chainId: BASE_CHAIN_ID });
  const walletChainId = useChainId();
  const { switchChainAsync, isPending: switching } = useSwitchChain();

  const [paying, setPaying] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [baseDebug, setBaseDebug] = useState<BasePaymentDebug | null>(null);

  const fee = type === "listing" ? "10" : "5";
  const paymentChainId = chainId as PaymentChainId;
  const chainLabel = getChainLabel(paymentChainId);
  const explorerName = getExplorerName(paymentChainId);
  const isBase = paymentChainId === BASE_CHAIN_ID;
  const isArc = paymentChainId === 5042002;

  // ── Base Mainnet: direct USDC transfer with ERC-8021 attribution ──
  const payOnBase = async (): Promise<string> => {
    if (!address) throw new Error("Wallet not connected");
    const debug = buildBaseUsdcTransferCalldata(fee);
    setBaseDebug(debug);

    const hash = await sendTransactionAsync({
      to: debug.to,
      data: debug.attributed,
      account: address as `0x${string}`,
      chainId: BASE_CHAIN_ID,
      value: 0n,
    } as Parameters<typeof sendTransactionAsync>[0]);

    if (basePublicClient) {
      await basePublicClient.waitForTransactionReceipt({ hash });
    }
    return hash;
  };

  // ── Arc Testnet: Circle App Kit (unchanged) ──
  const payOnArc = async (): Promise<string> => {
    const adapter = await createViemAdapterFromWallet(walletProvider);
    const result = await payListingFee(adapter, paymentChainId, fee);
    return result.txHash;
  };

  const handlePay = async () => {
    setPaying(true);
    setError(null);
    setBaseDebug(null);
    try {
      const hash = isBase ? await payOnBase() : await payOnArc();

      try {
        await persistListing(type, hash, address!, submissionData);
      } catch (saveErr: unknown) {
        const message = saveErr instanceof Error ? saveErr.message : String(saveErr);
        console.error("Failed to persist listing:", saveErr);
        toast({
          title: "Payment succeeded but listing save failed",
          description: `Your payment went through. Please contact support with your tx hash. (${message})`,
          variant: "destructive",
        });
      }

      setTxHash(hash);
      toast({ title: "Payment successful!", description: `Tx: ${hash.slice(0, 12)}…` });
      onSuccess(hash);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Payment failed on ${chainLabel}`;
      setError(msg);
      toast({ title: "Payment failed", description: msg, variant: "destructive" });
    } finally {
      setPaying(false);
    }
  };

  const copy = (value: string, label = "Copied!") => {
    navigator.clipboard.writeText(value);
    toast({ title: label });
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
          <button onClick={() => copy(txHash)} className="text-primary hover:text-primary/80 shrink-0">
            <Copy className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <a
            href={getExplorerUrl(paymentChainId, txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View on {explorerName}
          </a>
          {isBase && (
            <a
              href={getBaseScanInputDataUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Verify ERC-8021 attribution on BaseScan
            </a>
          )}
        </div>
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

  // ── Chain gating: only Base + Arc supported for payments ──
  const isSupportedChain = isBase || isArc;
  const walletOnCorrectChain = walletChainId === paymentChainId;
  const needsSwitch = isSupportedChain && !walletOnCorrectChain;

  const handleSwitch = async () => {
    try {
      await switchChainAsync({ chainId: paymentChainId });
      toast({ title: `Switched to ${chainLabel}` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to switch network";
      toast({ title: "Network switch failed", description: msg, variant: "destructive" });
    }
  };

  // ── Main payment UI ──
  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="text-xl font-bold text-foreground">{fee} USDC</h3>
        <p className="text-sm text-muted-foreground">
          {type === "listing" ? "One-time listing fee" : "One-time update fee"} on {chainLabel}
        </p>
      </div>

      {!isSupportedChain && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-xs text-destructive">
            Switch to <strong>Base Mainnet</strong> or <strong>Arc Testnet</strong> in the chain
            selector to pay the {fee} USDC fee.
          </p>
        </div>
      )}

      {isBase && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-foreground/80">
            This payment is sent <strong>directly</strong> on Base with our{" "}
            <strong>ERC-8021 builder code</strong> (<code className="font-mono">bc_madq6cms</code>)
            appended to the transfer calldata — visible as attribution in BaseScan Input Data.
          </p>
        </div>
      )}

      {needsSwitch && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-foreground/90">
              Your wallet is on a different network. Switch to <strong>{chainLabel}</strong> to pay
              {isBase ? " with ERC-8021 attribution." : "."}
            </p>
          </div>
          <Button
            onClick={handleSwitch}
            disabled={switching}
            variant="outline"
            className="w-full rounded-lg border-amber-500/40 hover:bg-amber-500/10"
            size="sm"
          >
            {switching ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Switching…</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" /> Switch wallet to {chainLabel}</>
            )}
          </Button>
        </div>
      )}

      <Button
        onClick={handlePay}
        disabled={paying || !isSupportedChain || needsSwitch || switching}
        className="w-full bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground font-semibold py-6 rounded-xl text-base"
      >
        {paying ? (
          <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Processing Payment…</>
        ) : needsSwitch ? (
          <>Switch to {chainLabel} to continue</>
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

      {/* ── ERC-8021 debug (Base only) ── */}
      {isBase && baseDebug && (
        <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              ERC-8021 Calldata (last attempt)
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              suffix {baseDebug.suffix.slice(0, 10)}…
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Raw</span>
              <button
                onClick={() => copy(baseDebug.raw, "Raw calldata copied")}
                className="text-[10px] text-primary hover:underline inline-flex items-center gap-1"
              >
                <Copy className="h-3 w-3" /> Copy
              </button>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground break-all">
              {baseDebug.raw}
            </p>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[10px] uppercase tracking-wide text-primary">Attributed</span>
              <button
                onClick={() => copy(baseDebug.attributed, "Attributed calldata copied")}
                className="text-[10px] text-primary hover:underline inline-flex items-center gap-1"
              >
                <Copy className="h-3 w-3" /> Copy
              </button>
            </div>
            <p className="text-[10px] font-mono text-foreground break-all">
              {baseDebug.attributed}
            </p>
          </div>
        </div>
      )}

      <div className="bg-muted/50 rounded-xl p-4">
        <p className="text-xs text-muted-foreground">
          {isBase ? (
            <>
              🔵 Direct on-chain USDC transfer to treasury on <strong>Base Mainnet</strong>.
              Token: <code className="font-mono">{BASE_USDC_ADDRESS.slice(0, 10)}…</code>
            </>
          ) : (
            <>
              🔵 Payments are processed on <strong>{chainLabel}</strong> using Circle's App Kit.
              Need USDC? Use the button above to get USDC from the Circle faucet.
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default ArcPaymentPanel;
