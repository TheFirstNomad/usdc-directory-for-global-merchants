import { Partner } from "@/lib/partners";
import { Button } from "@/components/ui/button";
import { ExternalLink, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";

const categoryColors: Record<string, string> = {
  Payments: "bg-primary/10 text-primary",
  Remittances: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  Wallets: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  "On/Off-Ramps": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  DeFi: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  RWA: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  Infrastructure: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  "AI Payments": "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
  Enterprise: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
};

const regionFlags: Record<string, string> = {
  Global: "🌍",
  "North America": "🇺🇸",
  "Latin America": "🌎",
  Europe: "🇪🇺",
  Africa: "🌍",
  "Asia Pacific": "🌏",
  "Middle East": "🕌",
  "Emerging Markets": "🚀",
};

const PartnerCard = ({ partner, index }: { partner: Partner; index: number }) => {
  const logoUrl =
    partner.logo_url && partner.logo_url !== ""
      ? partner.logo_url
      : `https://logo.clearbit.com/${partner.website?.replace(/https?:\/\//, "").replace(/\/.*/, "") || partner.name.toLowerCase().replace(/\s+/g, "") + ".com"}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5), duration: 0.4 }}
      className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 h-full flex flex-col"
    >
      {/* Logo section */}
      <div className="h-24 flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/20 p-6 relative">
        {partner.featured && (
          <div className="absolute top-3 right-3 text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            ⭐ Featured
          </div>
        )}
        <img
          src={logoUrl}
          alt={`${partner.name} logo`}
          className="h-16 w-16 object-contain rounded-lg bg-card p-1 shadow-sm group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src =
              "https://cryptologos.cc/logos/usd-coin-usdc-logo.png";
          }}
        />
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {/* Name + verified */}
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-bold text-lg tracking-tight text-foreground leading-tight">
            {partner.name}
          </h3>
          {partner.featured && (
            <BadgeCheck className="h-4.5 w-4.5 text-success flex-shrink-0" />
          )}
        </div>

        {/* Region */}
        <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
          <span>{regionFlags[partner.region] || "🌍"}</span>
          {partner.region}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
          {partner.description}
        </p>

        {/* Color-coded category pills */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {partner.categories.slice(0, 3).map((cat, i) => (
            <span
              key={i}
              className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full ${categoryColors[cat] || "bg-muted text-muted-foreground"}`}
            >
              {cat}
            </span>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all font-medium"
          asChild
        >
          <a href={partner.website || "#"} target="_blank" rel="noopener noreferrer">
            Visit Site <ExternalLink className="ml-2 h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </motion.div>
  );
};

export default PartnerCard;
