import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgeCheck, ExternalLink, ArrowLeft, Copy, Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Partner } from "@/lib/partners";

const chainColors: Record<string, string> = {
  Ethereum: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  Base: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Solana: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  Polygon: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  Arbitrum: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  Noble: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  Avalanche: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const regionFlags: Record<string, string> = {
  Global: "🌍", "North America": "🇺🇸", "Latin America": "🌎",
  Europe: "🇪🇺", Africa: "🌍", "Asia Pacific": "🌏",
  "Middle East": "🕌", "Emerging Markets": "🚀",
};

const categoryColors: Record<string, string> = {
  "AI & Agentic Platforms": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  "Bridge Apps": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  "Bridge SDKs": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "DeFi Apps": "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
  "Digital Wallets": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  "Due Diligence & Advisory": "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  "Ecommerce": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "Exchanges": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  "Fintechs": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  "Gaming": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "Infrastructure Providers": "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  "Market Makers": "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  "Marketplaces": "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300",
  "Neobanks": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  "OTC Desks": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "Payments": "bg-primary/10 text-primary",
  "PR & Communications": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  "Remittances": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Security": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
};

const MerchantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentPending, setPaymentPending] = useState(false);
  const [copied, setCopied] = useState(false);

  // Seeded agents - both Visit Site and Pay with USDC are hidden
  const seededNames = new Set([
    "ContentMintBot", "GuardianAgent", "RentCollectorAI", "BridgeMind",
    "InvoiceBot", "PayBot3000", "ResearchOracle", "SocialPayBot",
    "TradeFlowAI", "SolSwapAgent", "YieldScout",
    // Add any new seeded agents here
  ]);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("partners_public" as any)
      .select("id, name, description, website, logo_url, logo_emoji, categories, region, use_cases, featured, created_at, usdc_score, networks")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setPartner(data as unknown as Partner);
        setLoading(false);
      });
  }, [id]);

  const handleCopyAddress = () => {
    return;
  };

  const logoUrl = partner?.logo_url && partner.logo_url !== ""
    ? partner.logo_url
    : `https://logo.clearbit.com/${partner?.website?.replace(/https?:\/\//, "").replace(/\/.*/, "") || "circle.com"}`;

  const score = (partner as any)?.usdc_score ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Merchant Not Found</h1>
            <p className="text-muted-foreground mb-4">This listing doesn't exist or has been removed.</p>
            <Link to="/">
              <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Directory</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isSeeded = seededNames.has(partner.name);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={`${partner.name} — USDC Directory`}
        description={partner.description}
        path={`/merchant/${id}`}
      />
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Directory
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-3 gap-8"
        >
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Hero card */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center relative">
                {score >= 70 && (
                  <div className="absolute top-4 right-4 bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                    Score: {score}/100
                  </div>
                )}
                <img
                  src={logoUrl}
                  alt={partner.name}
                  className="h-20 w-20 object-contain rounded-2xl bg-card p-2 shadow-md"
                  onError={(e) => {
                    e.currentTarget.src = "https://cryptologos.cc/logos/usd-coin-usdc-logo.png";
                  }}
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-foreground">{partner.name}</h1>
                  {partner.featured && (
                    <BadgeCheck className="h-6 w-6 text-primary flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <span>{regionFlags[partner.region] || "🌍"}</span>
                  <span>{partner.region}</span>
                  {partner.featured && (
                    <>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="text-primary font-medium">Verified Partner</span>
                    </>
                  )}
                </div>
                <p className="text-muted-foreground leading-relaxed">{partner.description}</p>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3 text-sm">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {partner.categories.map((cat, i) => (
                  <span
                    key={i}
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${categoryColors[cat] || "bg-muted text-muted-foreground"}`}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Chains */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3 text-sm">Supported Networks</h3>
              <div className="flex flex-wrap gap-2">
                {(partner.use_cases || []).map((chain, i) => (
                  <span
                    key={i}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${chainColors[chain] || "bg-muted text-muted-foreground"}`}
                  >
                    {chain}
                  </span>
                ))}
                {(!partner.use_cases || partner.use_cases.length === 0) && (
                  <span className="text-sm text-muted-foreground">No network data available</span>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Actions */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              {/* Visit Site — shown whenever website URL exists */}
              {partner?.website && partner.website.trim() !== "" && (
                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  asChild
                >
                  <a href={partner.website} target="_blank" rel="noopener noreferrer">
                    Visit Site <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>

            {/* Score card */}
            {score > 0 && (
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-3 text-sm">USDC Score</h3>
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="28" fill="none" strokeWidth="4" className="stroke-muted" />
                      <circle
                        cx="32" cy="32" r="28" fill="none" strokeWidth="4"
                        className="stroke-primary"
                        strokeDasharray={`${(score / 100) * 176} 176`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                      {score}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-foreground mb-0.5">
                      {score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Building"}
                    </p>
                    <p>Integration strength across the USDC ecosystem.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3 text-sm">Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Region</dt>
                  <dd className="text-foreground font-medium">{partner.region || "Global"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Listed</dt>
                  <dd className="text-foreground font-medium">
                    {new Date(partner.created_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default MerchantDetail;
