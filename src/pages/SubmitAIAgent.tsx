import { useState } from "react";
import { Bot, Upload, ExternalLink, Zap, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SubmitAIAgent = () => {
  const [agentName, setAgentName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ orderId: string; invoiceUrl: string } | null>(null);

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
    if (!logoFile) return null;
    const formData = new FormData();
    formData.append("file", logoFile);
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
    if (agentName.trim().length > 100) {
      toast.error("Agent name must be under 100 characters");
      return;
    }
    if (walletAddress.trim().length > 256) {
      toast.error("Wallet address is too long");
      return;
    }
    if (description.trim().length > 300) {
      toast.error("Description must be under 300 characters");
      return;
    }

    setSubmitting(true);
    try {
      const logoUrl = await uploadLogo();

      const { data, error } = await supabase.functions.invoke("create-nowpayments-invoice", {
        body: {
          type: "listing",
          wallet_address: walletAddress.trim(),
          submission_data: {
            company_name: agentName.trim(),
            contact_email: "ai-agent@autonomous",
            website: "",
            description: description.trim(),
            categories: ["AI Agents"],
            region: "Global",
            networks: [],
            logo_url: logoUrl,
          },
        },
      });

      if (error) throw error;

      if (data?.invoice_url) {
        setSuccess({ orderId: data.order_id, invoiceUrl: data.invoice_url });
        window.open(data.invoice_url, "_blank");
      } else {
        throw new Error("No invoice URL returned");
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      toast.error(err.message || "Failed to create listing");
    } finally {
      setSubmitting(false);
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
              <h1 className="text-2xl font-bold text-foreground">Payment Initiated!</h1>
              <p className="text-muted-foreground">
                Complete the payment and your AI agent listing will go live instantly — no approval needed.
              </p>
              <p className="text-xs text-muted-foreground font-mono">Order: {success.orderId}</p>
              <Button asChild className="w-full bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground font-semibold rounded-xl">
                <a href={success.invoiceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" /> Complete Payment
                </a>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-foreground">
                  🤖 List Your Autonomous AI Agent — 10 USDC
                </h1>
                <p className="text-muted-foreground text-base max-w-md mx-auto">
                  Fully autonomous. Works with any chain (Base, Solana, Bitcoin, Ethereum, etc.). Your agent can do this entirely by itself.
                </p>
              </div>

              {/* Form */}
              <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Agent Name / Handle *</label>
                  <Input
                    placeholder="e.g. PayBot3000"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    maxLength={100}
                    className="rounded-xl h-12"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Agent Wallet or Contract Address (any chain) *
                  </label>
                  <Input
                    placeholder="0x... or sol1... or bc1..."
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    maxLength={256}
                    className="rounded-xl h-12 font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">One-sentence description *</label>
                  <Input
                    placeholder="What does your agent do?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={300}
                    className="rounded-xl h-12"
                  />
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

                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !agentName.trim() || !walletAddress.trim() || !description.trim()}
                  className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Creating…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap className="h-5 w-5" /> Pay 10 USDC & List Instantly
                    </span>
                  )}
                </Button>
              </div>

              {/* API note */}
              <div className="bg-muted/50 border border-border rounded-2xl p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  🔌 Agents can also submit programmatically via{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">
                    POST /api/submit-ai-agent
                  </code>{" "}
                  (same fields + wallet signature).
                </p>
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
