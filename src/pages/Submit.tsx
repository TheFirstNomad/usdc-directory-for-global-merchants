import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import SEO from "@/components/SEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PaymentModal from "@/components/PaymentModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES, CATEGORY_EMOJIS, REGIONS, REGION_FLAGS, NETWORKS } from "@/lib/partners";
import { CheckCircle2, ArrowRight, ArrowLeft, Upload, Eye } from "lucide-react";
import { useAppKitAccount } from "@reown/appkit/react";
import { useAppKit } from "@reown/appkit/react";
import { Wallet } from "lucide-react";
import Logo from "@/components/Logo";

const STEPS = [
  { title: "Business Info", description: "Tell us about your business" },
  { title: "Networks", description: "Which chains do you accept USDC on?" },
  { title: "Location", description: "Where are your customers?" },
  { title: "Preview", description: "Review your listing before payment" },
  { title: "Payment", description: "Pay 10 USDC to list" },
];

const PRESENCE_TYPES = ["Online Only", "Physical Locations", "Both"];

const Submit = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { address, isConnected } = useAppKitAccount();
  const { open } = useAppKit();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(searchParams.get("success") === "true");
  const [showPayment, setShowPayment] = useState(false);
  const [orderId, setOrderId] = useState(searchParams.get("order") || "");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    contact_email: "",
    website: "",
    description: "",
    categories: [] as string[],
    region: "Global",
    networks: [] as string[],
    presence_type: "Online Only",
    city: "",
    country: "",
    logo_file: null as File | null,
  });

  const toggleCategory = (cat: string) =>
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }));

  const toggleNetwork = (net: string) =>
    setForm((f) => ({
      ...f,
      networks: f.networks.includes(net)
        ? f.networks.filter((n) => n !== net)
        : [...f.networks, net],
    }));

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!form.company_name || !form.description) {
        toast({ title: "Please fill in Business Name and Description", variant: "destructive" });
        return false;
      }
      if (form.categories.length === 0) {
        toast({ title: "Please select at least one category", variant: "destructive" });
        return false;
      }
    }
    if (step === 1 && form.networks.length === 0) {
      toast({ title: "Please select at least one network", variant: "destructive" });
      return false;
    }
    return true;
  };

  const uploadLogo = async () => {
    if (!form.logo_file || !address) return null;
    setUploadingLogo(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || `https://${projectId}.supabase.co`;
      const fd = new FormData();
      fd.append("file", form.logo_file);
      fd.append("wallet_address", address);
      const res = await fetch(`${supabaseUrl}/functions/v1/upload-logo`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setLogoUrl(data.url);
      return data.url;
    } catch {
      toast({ title: "Logo upload failed", variant: "destructive" });
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  const nextStep = async () => {
    if (!validateStep()) return;
    // Upload logo when moving past step 0
    if (step === 0 && form.logo_file && !logoUrl) {
      if (!isConnected) {
        toast({ title: "Please connect wallet to upload logo", variant: "destructive" });
        return;
      }
      await uploadLogo();
    }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handlePaymentSuccess = (id: string) => {
    setOrderId(id);
    setShowPayment(false);
    setSubmitted(true);
  };

  const submissionData = {
    company_name: form.company_name,
    contact_email: form.contact_email,
    website: form.website,
    description: form.description,
    categories: form.categories,
    region: form.region,
    networks: form.networks,
    logo_url: logoUrl,
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SEO title="Listed Successfully" description="Your business has been listed on USDC Directory." path="/submit" />
        <Header />
        <main className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">🎉 Payment Submitted!</h1>
            <p className="text-muted-foreground mb-4">
              Your listing will go live automatically once payment is confirmed (usually 1-5 minutes).
            </p>
            {orderId && (
              <p className="text-xs text-muted-foreground font-mono break-all mb-6">Order: {orderId}</p>
            )}
            <a href="/" className="text-primary text-sm font-medium hover:underline">← Back to Directory</a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title="List Your Business — 10 USDC" description="Add your business to the USDC Directory for just 10 USDC." path="/submit" />
      <Header />

      <section className="bg-gradient-to-b from-primary/5 to-background py-14 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">List Your Business</h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Get discovered by thousands of USDC users worldwide. <span className="font-semibold text-foreground">Just 10 USDC</span> for a permanent listing.
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-xl mx-auto w-full px-6 py-10">
        {/* Step indicators */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-6 sm:w-12 mx-1 transition-colors ${i < step ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground">{STEPS[step].title}</h2>
          <p className="text-sm text-muted-foreground">{STEPS[step].description}</p>
        </div>

        <div>
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Business Name *</label>
                <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="Your company name" maxLength={100} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Contact Email *</label>
                <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="you@company.com" maxLength={255} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Website</label>
                <Input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://yourcompany.com" maxLength={255} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description *</label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Briefly describe what your business does…" rows={3} maxLength={1000} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Logo (PNG, JPG, JPEG, SVG, WebP recommended)</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card cursor-pointer hover:bg-muted transition-colors text-sm text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    {form.logo_file ? form.logo_file.name : "Upload logo"}
                    <input type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      const allowedTypes = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
                      if (file && allowedTypes.includes(file.type)) {
                        setForm({ ...form, logo_file: file });
                        setLogoUrl(null);
                      } else {
                        toast({ title: "Please upload a PNG, JPG, SVG, or WebP image", variant: "destructive" });
                      }
                    }} />
                  </label>
                  {uploadingLogo && <span className="text-xs text-muted-foreground">Uploading…</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Recommended: 512×512px or larger, transparent background preferred</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Categories *</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button key={cat} type="button" onClick={() => toggleCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.categories.includes(cat) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
                    }`}>
                      {CATEGORY_EMOJIS[cat] || "📦"} {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Select all blockchain networks where you accept USDC.</p>
              <div className="grid grid-cols-2 gap-3">
                {NETWORKS.map((net) => (
                  <button key={net} type="button" onClick={() => toggleNetwork(net)} className={`p-4 rounded-xl border text-sm font-medium transition-all ${
                    form.networks.includes(net) ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40"
                  }`}>
                    {net}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Business Presence</label>
                <div className="flex flex-wrap gap-2">
                  {PRESENCE_TYPES.map((pt) => (
                    <button key={pt} type="button" onClick={() => setForm({ ...form, presence_type: pt })} className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      form.presence_type === pt ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                    }`}>
                      {pt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Region *</label>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map((r) => (
                    <button key={r} type="button" onClick={() => setForm({ ...form, region: r })} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      form.region === r ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
                    }`}>
                      {REGION_FLAGS[r] || "📍"} {r}
                    </button>
                  ))}
                </div>
              </div>
              {form.presence_type !== "Online Only" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Country</label>
                    <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Uganda" maxLength={100} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">City</label>
                    <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Kampala" maxLength={100} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview Step */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-3xl">
                    {logoUrl ? <img src={logoUrl} alt="" className="w-14 h-14 rounded-lg object-cover" /> : "🏢"}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{form.company_name}</h3>
                    <a href={form.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{form.website}</a>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-4">{form.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.categories.map((cat) => (
                    <span key={cat} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                      {CATEGORY_EMOJIS[cat] || "📦"} {cat}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.networks.map((net) => (
                    <span key={net} className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">⛓ {net}</span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">📍 {REGION_FLAGS[form.region] || "📍"} {form.region}</p>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                <Eye className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">This is how your listing will appear. Continue to pay and publish.</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
                <Logo size={40} className="mx-auto mb-3" />
                <h3 className="text-xl font-bold text-foreground mb-1">10 USDC</h3>
                <p className="text-sm text-muted-foreground mb-4">One-time listing fee</p>
                {isConnected ? (
                  <Button
                    onClick={() => setShowPayment(true)}
                    className="bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground font-semibold px-8 py-3 rounded-xl text-base"
                  >
                    Pay & List Your Business
                  </Button>
                ) : (
                  <Button
                    onClick={() => open()}
                    className="bg-gradient-to-r from-primary to-[hsl(275,80%,55%)] text-primary-foreground font-semibold px-8 py-3 rounded-xl text-base"
                  >
                    <Wallet className="h-5 w-5 mr-2" /> Connect Wallet to Pay
                  </Button>
                )}
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <h4 className="font-semibold text-foreground text-sm mb-2">What you get:</h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li>✅ Permanent listing in the global directory</li>
                  <li>✅ Searchable by category, region, and network</li>
                  <li>✅ Featured on the USDC Directory homepage</li>
                  <li>✅ Instant approval after payment</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-8">
          <Button variant="outline" onClick={prevStep} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {step < STEPS.length - 1 && (
            <Button onClick={nextStep} disabled={uploadingLogo} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {uploadingLogo ? "Uploading…" : "Continue"} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </main>

      <Footer />

      {showPayment && (
        <PaymentModal
          type="listing"
          submissionData={submissionData}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
};

export default Submit;
