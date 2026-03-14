import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { submitPartnerApplication, CATEGORIES, REGIONS } from "@/lib/partners";

const Submit = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    company_name: "",
    contact_email: "",
    website: "",
    description: "",
    categories: [] as string[],
    region: "Global",
  });

  const toggleCategory = (cat: string) =>
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name || !form.contact_email || !form.website || !form.description) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (form.categories.length === 0) {
      toast({ title: "Please select at least one category", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await submitPartnerApplication(form);
      toast({ title: "Application submitted!", description: "We'll review your submission and get back to you." });
      setForm({ company_name: "", contact_email: "", website: "", description: "", categories: [], region: "Global" });
    } catch {
      toast({ title: "Submission failed", description: "Please try again later.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <section className="bg-hero py-14 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-hero-foreground mb-3">
            Submit Your Company
          </h1>
          <p className="text-hero-muted text-base max-w-xl mx-auto">
            Are you building with USDC? Apply to be listed in the USDC Partners Directory and
            reach thousands of users and businesses.
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-xl mx-auto w-full px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="Briefly describe what your company does with USDC..."
              rows={4}
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
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
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

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Region</label>
            <select
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
            {loading ? "Submitting..." : "Submit Application"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By submitting, you agree that your company information may be publicly listed. For
            official Circle Alliance membership, visit{" "}
            <a href="https://partners.circle.com/" target="_blank" rel="noopener noreferrer" className="underline">
              partners.circle.com
            </a>.
          </p>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default Submit;
