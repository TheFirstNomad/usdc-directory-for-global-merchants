import { useState } from "react";
import { ArrowRight, ExternalLink, Droplets, Loader2, Wallet, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useChainContext } from "@/contexts/ChainContext";
import { useToast } from "@/hooks/use-toast";
import {
  createViemAdapterFromWallet,
  bridgeUsdc,
  getExplorerUrl,
  getChainLabel,
  type PaymentChainId,
} from "@/lib/arcAppKit";
import { Blockchain } from "@circle-fin/app-kit";

const BRIDGE_ROUTES = [
  {
    id: "sepolia-to-arc",
    from: "Ethereum Sepolia",
    to: "Arc Testnet",
    fromEnum: Blockchain.Ethereum_Sepolia,
    toEnum: Blockchain.Arc_Testnet,
    fromIcon: "🔷",
    toIcon: "/chains/arc.jpg",
    testnet: true,
  },
  {
    id: "arc-to-sepolia",
    from: "Arc Testnet",
    to: "Ethereum Sepolia",
    fromEnum: Blockchain.Arc_Testnet,
    toEnum: Blockchain.Ethereum_Sepolia,
    fromIcon: "/chains/arc.jpg",
    toIcon: "🔷",
    testnet: true,
  },
] as const;

const Bridge = () => {
  const { open: openWallet } = useAppKit();
  const { isConnected, address } = useAppKitAccount();
  const { chainId } = useChainContext();
  const { toast } = useToast();

  const [selectedRoute, setSelectedRoute] = useState(0);
  const [amount, setAmount] = useState("");
  const [bridging, setBridging] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const route = BRIDGE_ROUTES[selectedRoute];

  const handleBridge = async () => {
    if (!address || !amount) return;
    setBridging(true);
    setError(null);
    setTxHash(null);
    try {
      const adapter = createViemAdapterFromWallet(address as `0x${string}`);
      const result = await bridgeUsdc(adapter, route.fromEnum, route.toEnum, amount);
      setTxHash(result.txHash);
      toast({ title: "Bridge initiated!", description: `Tx: ${result.txHash.slice(0, 12)}…` });
    } catch (err: any) {
      const msg = err?.message || "Bridge failed. Please try again.";
      setError(msg);
      toast({ title: "Bridge failed", description: msg, variant: "destructive" });
    } finally {
      setBridging(false);
    }
  };

  return (
    <>
      <SEO title="Bridge USDC | USDC Directory" description="Bridge USDC between chains using Circle's cross-chain transfer protocol." />
      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2 text-center">
            Bridge{" "}
            <span className="bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] bg-clip-text text-transparent">
              USDC
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
            Transfer USDC across chains via Circle's cross-chain protocol or use the faucet for testnet tokens.
          </p>

          {/* Route selector */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center">
            {BRIDGE_ROUTES.map((r, i) => (
              <button
                key={r.id}
                onClick={() => { setSelectedRoute(i); setTxHash(null); setError(null); }}
                className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                  selectedRoute === i
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/50 bg-card/60 text-muted-foreground hover:border-primary/40"
                }`}
              >
                {r.from} → {r.to}
              </button>
            ))}
          </div>

          {/* Bridge card */}
          <div className="w-full max-w-[460px] rounded-2xl border border-border/60 bg-card/95 backdrop-blur-sm p-6 shadow-xl shadow-black/10">
            {/* From → To display */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 border border-border/40">
                {typeof route.fromIcon === "string" && route.fromIcon.startsWith("/") ? (
                  <img src={route.fromIcon} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <span className="text-lg">{route.fromIcon}</span>
                )}
                <span className="text-sm font-semibold text-foreground">{route.from}</span>
              </div>
              <ArrowRight className="h-5 w-5 text-primary" />
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 border border-border/40">
                {typeof route.toIcon === "string" && route.toIcon.startsWith("/") ? (
                  <img src={route.toIcon} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <span className="text-lg">{route.toIcon}</span>
                )}
                <span className="text-sm font-semibold text-foreground">{route.to}</span>
              </div>
            </div>

            {/* Amount input */}
            <div className="rounded-xl bg-muted/20 border border-border/40 p-4 mb-4">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Amount (USDC)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9.]/g, "");
                  if (v.split(".").length <= 2) setAmount(v);
                  setError(null);
                }}
                className="w-full bg-transparent text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground/30"
              />
            </div>

            {/* Actions */}
            {txHash ? (
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                  <span className="text-green-500 text-xl">✓</span>
                </div>
                <p className="text-sm font-medium text-foreground">Bridge initiated!</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{txHash}</p>
                <Button variant="outline" size="sm" onClick={() => { setTxHash(null); setAmount(""); }}>
                  Bridge More
                </Button>
              </div>
            ) : !isConnected ? (
              <Button
                onClick={() => openWallet()}
                className="w-full h-13 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground"
              >
                <Wallet className="h-5 w-5 mr-2" /> Connect Wallet
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={handleBridge}
                  disabled={bridging || !amount || parseFloat(amount) <= 0}
                  className="w-full h-13 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground hover:opacity-90 disabled:opacity-40"
                >
                  {bridging ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Bridging…</>
                  ) : (
                    <>Bridge USDC</>
                  )}
                </Button>

                {error && <p className="text-sm text-red-400 text-center">{error}</p>}
              </div>
            )}

            {/* Faucet link */}
            <div className="mt-4 pt-4 border-t border-border/30">
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border border-border/50 bg-muted/20 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <Droplets className="h-4 w-4" />
                Get Test USDC from Circle Faucet
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            {route.testnet && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-400/80">
                  Testnet bridge — tokens have no real value. Get test USDC from the faucet above first.
                </p>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Bridge;
