import { useState } from "react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useAppKit } from "@reown/appkit/react";
import { LISTING_FEE_DISPLAY, UPDATE_FEE_DISPLAY } from "@/lib/web3";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, Loader2, LogIn, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  type: "listing" | "update";
  submissionData: Record<string, unknown>;
  onSuccess: (orderId: string) => void;
  onClose: () => void;
}

const PaymentModal = ({ type, submissionData, onSuccess, onClose }: PaymentModalProps) => {
  const { toast } = useToast();
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const [loading, setLoading] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const amount = type === "listing" ? LISTING_FEE_DISPLAY : UPDATE_FEE_DISPLAY;

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || `https://${projectId}.supabase.co`;

  const createInvoice = async () => {
    if (!isConnected || !address) {
      toast({ title: "Please connect your wallet first", variant: "destructive" });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${supabaseUrl}/functions/v1/create-nowpayments-invoice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            wallet_address: address,
            submission_data: submissionData,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create invoice");
      }

      const data = await res.json();
      setInvoiceUrl(data.invoice_url);
      setOrderId(data.order_id);

      // Open invoice in new tab
      window.open(data.invoice_url, "_blank");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create payment";
      setError(message);
      toast({ title: "Payment Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl"
        >
          ×
        </button>

        {invoiceUrl ? (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CreditCard className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Payment Created</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Complete your {amount} USDC payment in the NOWPayments checkout window. You can pay with crypto or card.
            </p>

            <div className="space-y-3">
              <a
                href={invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground font-semibold py-3 px-6 rounded-xl text-base hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="h-4 w-4" /> Open Payment Page
              </a>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (orderId) onSuccess(orderId);
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> I've Completed Payment
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Your listing will go live automatically once payment is confirmed (usually 1-5 minutes).
            </p>
            {orderId && (
              <p className="text-xs text-muted-foreground mt-2 font-mono break-all">
                Order: {orderId}
              </p>
            )}
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
                  onClick={createInvoice}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground font-semibold py-6 rounded-xl text-base"
                >
                  {loading ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Creating Invoice…</>
                  ) : (
                    <><CreditCard className="h-5 w-5 mr-2" /> Pay {amount} USDC</>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => open()}
                  className="w-full bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground font-semibold py-6 rounded-xl text-base"
                >
                  <LogIn className="h-5 w-5 mr-2" /> Connect Wallet to Pay
                </Button>
              )}

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground">
                  💳 Pay with USDC on Base, or use card via NOWPayments checkout. Your listing goes live automatically after payment confirmation.
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
