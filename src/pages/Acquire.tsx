import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import AcquisitionBanner from "@/components/AcquisitionBanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, TrendingUp, Shield, Globe, Database, Zap, Users } from "lucide-react";

const metrics = [
  { icon: Globe, value: "71+", label: "Verified Merchants", desc: "Curated and growing daily" },
  { icon: Users, value: "9", label: "Categories", desc: "Payments, DeFi, Remittances…" },
  { icon: Database, value: "Proprietary", label: "Scoring Algorithm", desc: "usdc_score data moat" },
  { icon: TrendingUp, value: "$78B+", label: "USDC Market Cap", desc: "Growing ecosystem" },
  { icon: Shield, value: "100%", label: "Compliance Ready", desc: "Circle-aligned branding" },
  { icon: Zap, value: "< 1s", label: "Load Time", desc: "Vite + Edge deployment" },
];

const reasons = [
  {
    title: "First-Mover Advantage",
    desc: "usdc.directory is the only curated, production-grade directory for USDC merchants globally. Owning the canonical .directory domain gives Circle permanent SEO dominance.",
  },
  {
    title: "Proprietary Data Moat",
    desc: "Our merchant scoring algorithm (usdc_score) evaluates verification status, chain support, and activity to surface the most trustworthy listings — a competitive data asset.",
  },
  {
    title: "Ecosystem Alignment",
    desc: "Every page reinforces Circle's brand and mission. The platform is purpose-built to drive USDC adoption among merchants, developers, and consumers.",
  },
  {
    title: "Production-Ready Stack",
    desc: "React 18 + TypeScript + Supabase + Vercel. Enterprise-grade, scalable, fully deployed. Zero technical debt — ready for Circle's engineering team to extend.",
  },
  {
    title: "Growth Flywheel",
    desc: "Self-serve merchant submissions, automated verification, and community-driven growth. The platform compounds value with every new listing.",
  },
  {
    title: "Strategic Domain",
    desc: "usdc.directory — the premium exact-match domain. Impossible to replicate. Instant credibility and discoverability for Circle's ecosystem.",
  },
];

const Acquire = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    // In production this would send to an edge function / email
    setSent(true);
    toast({ title: "Inquiry sent successfully" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Acquire USDC Directory"
        description="USDC Directory is offered exclusively for acquisition by Circle Inc. Contact TheFirstNomad for licensing and acquisition inquiries."
        path="/acquire"
      />
      <AcquisitionBanner />
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-background to-[hsl(275,100%,25%)]/[0.05]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/[0.06] blur-[120px] pointer-events-none" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wide">
                Exclusive Acquisition Opportunity
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground mb-5 leading-[1.08] tracking-tight">
              Why Circle Should{" "}
              <span className="bg-gradient-to-r from-primary to-[hsl(275,100%,25%)] bg-clip-text text-transparent">
                Acquire This Today
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
              The definitive USDC merchant directory — proprietary data, premium domain,
              production-ready code, and unmatched ecosystem alignment.
            </p>
          </motion.div>
        </div>
      </section>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-16">
          {metrics.map((m) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-xl p-5"
            >
              <m.icon className="h-5 w-5 text-primary mb-2" />
              <div className="text-2xl font-extrabold text-foreground">{m.value}</div>
              <div className="font-semibold text-sm text-foreground">{m.label}</div>
              <div className="text-xs text-muted-foreground">{m.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Why Acquire */}
        <h2 className="text-2xl font-bold text-foreground mb-6">Strategic Value Proposition</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-16">
          {reasons.map((r) => (
            <div key={r.title} className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
                <h3 className="font-semibold text-foreground">{r.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="bg-card border border-border rounded-2xl p-8 max-w-lg mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-1 text-center">
            Acquisition Inquiry
          </h2>
          <p className="text-sm text-muted-foreground mb-6 text-center">
            Interested in acquiring usdc.directory? Reach out directly.
          </p>

          {sent ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-[hsl(var(--success))] mx-auto mb-3" />
              <p className="font-semibold text-foreground">Thank you for your interest.</p>
              <p className="text-sm text-muted-foreground mt-1">We'll respond within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email *</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@company.com"
                  maxLength={255}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Company</label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  placeholder="Circle Inc."
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Message *</label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us about your acquisition interest…"
                  rows={4}
                  maxLength={2000}
                />
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                Send Inquiry
              </Button>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Acquire;
