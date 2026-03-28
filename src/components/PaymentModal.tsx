import { useState } from "react";
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { TREASURY_ADDRESS, LISTING_FEE_DISPLAY, UPDATE_FEE_DISPLAY } from "@/lib/web3";
import { Button } from "@/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CheckCircle2, ExternalLink, Copy, Wallet, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  type: "listing" | "update";
  onSuccess: (txHash: string) => void;
  onClose: () => void;
}

const PaymentModal = ({ type, onSuccess, onClose }: PaymentModalProps) => {
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const [copied, setCopied] = useState(false);

  const amount = type === "listing" ? LISTING_FEE_DISPLAY : UPDATE_FEE_DISPLAY;
  const amountWei = parseUnits(amount, 6);

  const { sendTransaction, data: txHash, isPending } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handlePay = () => {
    if (!isConnected) return;
    sendTransaction({
      to: TREASURY_ADDRESS,
      value: amountWei,
    });
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(TREASURY_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Address copied!" });
  };

  if (isSuccess && txHash) {
    onSuccess(txHash);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl"
        >
          ×
        </button>

        {isSuccess && txHash ? (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Payment Confirmed! 🎉</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Your {type === "listing" ? "listing" : "update"} has been submitted successfully.
            </p>
            <a
              href={`https://testnet.arcscan.app/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary text-sm font-medium hover:underline"
            >
              View on Arcscan <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <p className="text-xs text-muted-foreground mt-3 font-mono break-all">
              TX: {txHash}
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <img src="/Circle_USDC_Logo.svg" alt="USDC" className="h-12 w-12 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-1">
                Pay {amount} USDC
              </h2>
              <p className="text-muted-foreground text-sm">
                {type === "listing" ? "New business listing fee" : "Details update fee"}
              </p>
            </div>

            <div className="space-y-4">
              {isConnected ? (
                <Button
                  onClick={handlePay}
                  disabled={isPending || isConfirming}
                  className="w-full bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground font-semibold py-6 rounded-xl text-base"
                >
                  {isPending ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Confirm in Wallet…</>
                  ) : isConfirming ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Confirming…</>
                  ) : (
                    <><Wallet className="h-5 w-5 mr-2" /> Pay {amount} USDC</>
                  )}
                </Button>
              ) : (
                <div className="flex justify-center">
                  <ConnectButton />
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground">or send manually</span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-2">Send exactly {amount} USDC to:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-foreground font-mono break-all flex-1">
                    {TREASURY_ADDRESS}
                  </code>
                  <button
                    onClick={copyAddress}
                    className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Network: Arc Testnet (Chain ID: 5042002)
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
