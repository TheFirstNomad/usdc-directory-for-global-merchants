import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { submitPartnerApplication, CATEGORIES, REGIONS, NETWORKS } from "@/lib/partners";
import { CheckCircle2, ArrowRight, ArrowLeft, Download } from "lucide-react";

const STEPS = [
  { title: "Basic Info", description: "Tell us about your business" },
  { title: "Payment Details", description: "Which chains do you accept USDC on?" },
  { title: "Global Presence", description: "Where do your customers find you?" },
  { title: "Verification", description: "Help us verify your business" },
];

const PRESENCE_TYPES = ["Online Only", "Physical Locations", "Both"];

const Submit = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
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
    twitter_handle: "",
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
      if (!form.company_name || !form.contact_email || !form.website || !form.description) {
        toast({ title: "Please fill in all required fields", variant: "destructive" });
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

  const nextStep = () => {
    if (!validateStep()) return;
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitPartnerApplication({
        company_name: form.company_name,
        contact_email: form.contact_email,
        website: form.website,
        description: form.description,
        categories: form.categories,
        region: form.region,
      });
      setSubmitted(true);
    } catch {
      toast({ title: "Submission failed", description: "Please try again later.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md text-center"
          >
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Thank you for joining the USDC Ecosystem!
            </h1>
            <p className="text-muted-foreground mb-6">
              We'll review your submission and get back to you within 2-3 business days.
              Once approved, your business will appear in the global directory.
            </p>
            <div className="bg-card border border-border rounded-xl p-5 mb-6">
              <p className="text-sm font-medium text-foreground mb-3">
                Download your "We Accept USDC" badge
              </p>
              <Button variant="outline" className="focus:ring-2 focus:ring-ring">
                <Download className="h-4 w-4 mr-2" />
                Download Badge (SVG)
              </Button>
            </div>
            <a href="/" className="text-primary text-sm font-medium hover:underline">
              ← Back to Directory
            </a>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <section className="bg-gradient-to-b from-primary/5 to-background py-14 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
            Add Your Business
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Join the global USDC merchant directory and reach thousands of users
            looking to spend digital dollars.
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-xl mx-auto w-full px-6 py-10">
        {/* Step indicators */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                i <= step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 sm:w-16 mx-1 transition-colors ${
                  i < step ? "bg-primary" : "bg-border"
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground">{STEPS[step].title}</h2>
          <p className="text-sm text-muted-foreground">{STEPS[step].description}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Company Name *</label>
                  <Input
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    placeholder="Your company name"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Contact Email *</label>
                  <Input
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    placeholder="you@company.com"
                    maxLength={255}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Website *</label>
                  <Input
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    placeholder="https://yourcompany.com"
                    maxLength={255}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Description *</label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Briefly describe what your business does…"
                    rows={3}
                    maxLength={1000}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Categories *</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                          form.categories.includes(cat)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select all blockchain networks where you accept USDC payments.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {NETWORKS.map((net) => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => toggleNetwork(net)}
                      className={`p-4 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-ring ${
                        form.networks.includes(net)
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-card border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
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
                      <button
                        key={pt}
                        type="button"
                        onClick={() => setForm({ ...form, presence_type: pt })}
                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                          form.presence_type === pt
                            ? "bg-primary/10 border-primary text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {pt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Region</label>
                  <select
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                {form.presence_type !== "Online Only" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Country</label>
                      <Input
                        value={form.country}
                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                        placeholder="United States"
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">City</label>
                      <Input
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="New York"
                        maxLength={100}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    X / Twitter Handle (optional)
                  </label>
                  <Input
                    value={form.twitter_handle}
                    onChange={(e) => setForm({ ...form, twitter_handle: e.target.value })}
                    placeholder="@yourcompany"
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Linking your social account helps speed up verification.
                  </p>
                </div>
                <div className="bg-tag rounded-xl p-4">
                  <p className="text-sm text-tag-foreground">
                    <strong>Verification process:</strong> Our team reviews each submission
                    to ensure legitimacy. Verified merchants receive a{" "}
                    <span className="text-success font-semibold">green checkmark</span>{" "}
                    badge in the directory.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  By submitting, you agree that your company information may be publicly listed.
                  For official Circle Alliance membership, visit{" "}
                  <a href="https://partners.circle.com/" target="_blank" rel="noopener noreferrer" className="underline">
                    partners.circle.com
                  </a>.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 0}
            className="focus:ring-2 focus:ring-ring"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={nextStep}
              className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-ring"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-ring"
            >
              {loading ? "Submitting…" : "Submit Application"}
            </Button>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Submit;
