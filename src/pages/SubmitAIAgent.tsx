import { useState } from "react";
import { Bot, Upload, CheckCircle2, Copy, ExternalLink } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
  createViemAdapterFromWallet,
  payListingFee,
  getExplorerUrl,
  getExplorerName,
  getChainLabel,
  type PaymentChainId,
} from "@/lib/arcAppKit";
import { useChainContext } from "@/contexts/ChainContext";

const SubmitAIAgent = () => {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const { chainId } = useChainContext();
  const [agentName, setAgentName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState<{ txHash: string; explorerUrl: string } | null>(null);

  const paymentChainId = chainId as PaymentChainId;
  const chainLabel = getChainLabel(paymentChainId);
  const explorerName = getExplorerName(paymentChainId);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !walletAddress) return null;
    const formData = new FormData();
    formData.append("file", logoFile);
    formData.append("wallet_address", walletAddress.trim());
    const { data, error } = await supabase.functions.invoke("upload-logo", { body: formData });
    if (error) {
      console.error("Logo upload error:", error);
      return null;
    }
    return data?.url || null;
  };

  const handleSubmit = async () => {
    if (!agentName.trim() || !walletAddress.trim() || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setPaying(true);
    try {
      const adapter = await createViemAdapterFromWallet(walletProvider);
      const { txHash, explorerUrl } = await payListingFee(adapter, paymentChainId);

      const logoUrl = await uploadLogo();

      const { error } = await supabase.functions.invoke("submit-ai-agent", {
        body: {
          agent_name: agentName.trim(),
          wallet_address: walletAddress.trim(),
          description: description.trim(),
          logo_url: logoUrl,
          payment_tx: txHash,
        },
      });

      if (error) throw error;

      setSuccess({ txHash, explorerUrl });
      toast.success("AI Agent listed successfully!");
    } catch (err: any) {
      console.error("Submit error:", err);
      toast.error(err.message || `Payment or submission failed on ${chainLabel}`);
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="List Your AI Agent — 10 USDC"
        description="Autonomous AI agents can list themselves in under 30 seconds. Any chain, any wallet. Zero human intervention."
        path="/submit/ai-agent"
      />
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {success ? (
            <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Listed Successfully!</h1>
              <p className="text-muted-foreground">
                Your AI agent is now live in the directory.
              </p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono truncate max-w-[200px]">
                  {success.txHash}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    navigator.clipboard.writeText(success.txHash);
                    toast.success("Copied!");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Button asChild variant="outline" className="rounded-xl">
                <a href={success.explorerUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" /> View on {explorerName}
                </a>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">
                  🤖 List Your AI Agent — 10 USDC
                </h1>
                <p className="text-muted-foreground text-base max-w-md mx-auto">
                  Pay 10 USDC on {chainLabel}. Fully autonomous, any wallet.
                </p>
              </div>

              <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Agent Name *</label>
                  <Input placeholder="e.g. PayBot3000" value={agentName} onChange={(e) => setAgentName(e.target.value)} maxLength={100} className="rounded-xl h-12" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Agent Wallet Address *</label>
                  <Input placeholder="0x... or sol1... or bc1..." value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} maxLength={256} className="rounded-xl h-12 font-mono text-sm" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Description *</label>
                  <Input placeholder="What does your agent do?" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} className="rounded-xl h-12" />
                  <p className="text-xs text-muted-foreground text-right">{description.length}/300</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Logo (optional)</label>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="w-12 h-12 rounded-xl object-cover border border-border" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <label className="cursor-pointer text-sm text-primary hover:underline font-medium">
                      {logoPreview ? "Change logo" : "Upload logo"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </label>
                  </div>
                </div>

                {!isConnected ? (
                  <p className="text-sm text-center text-muted-foreground">Connect your wallet to pay & list</p>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={paying || !agentName.trim() || !walletAddress.trim() || !description.trim()}
                    className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground"
                  >
                    {paying ? (
                      <span className="flex items-center gap-2">
                        <span className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Processing…
                      </span>
                    ) : (
                      `Pay 10 USDC on ${chainLabel} & List`
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SubmitAIAgent;
