import { Partner } from "@/lib/partners";
import { Button } from "@/components/ui/button";
import { ExternalLink, BadgeCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const categoryColors: Record<string, string> = {
  Payments: "bg-primary/10 text-primary",
  Remittances: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  Wallets: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  "On/Off-Ramps": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  DeFi: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
  RWA: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  Infrastructure: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  "AI Payments": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
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
  const { toast } = useToast();
  const [paying, setPaying] = useState(false);

  const logoUrl =
    partner.logo_url && partner.logo_url !== ""
      ? partner.logo_url
      : `https://logo.clearbit.com/${partner.website?.replace(/https?:\/\//, "").replace(/\/.*/, "") || partner.name.toLowerCase().replace(/\s+/g, "") + ".com"}`;

  const handlePay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      toast({
        title: "✅ USDC Payment Sent!",
        description: `Demo: 10.00 USDC → ${partner.name} on Base testnet.`,
      });
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5), duration: 0.4 }}
      className="partner-card group relative bg-card rounded-2xl overflow-hidden h-full flex flex-col border border-border hover:border-primary/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
    >
      <Link to={`/merchant/${partner.id}`} className="flex flex-col h-full">
        {/* Logo section */}
        <div className="h-24 flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/20 p-6 relative">
          {partner.featured && (
            <div className="absolute top-3 left-3 text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
              ⭐ Featured
            </div>
          )}
          <img
            src={logoUrl}
            alt={`${partner.name} logo`}
            className="h-16 w-16 object-contain rounded-xl bg-card p-1.5 shadow-sm group-hover:scale-115 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src =
                "https://cryptologos.cc/logos/usd-coin-usdc-logo.png";
            }}
          />
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-bold text-lg tracking-tight text-foreground leading-tight truncate">
              {partner.name}
            </h3>
            {partner.featured && (
              <BadgeCheck className="h-[18px] w-[18px] text-primary flex-shrink-0" />
            )}
          </div>

          <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
            <span>{regionFlags[partner.region] || "🌍"}</span>
            <span>{partner.region}</span>
            {(partner as any).usdc_score > 0 && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-primary font-medium">Score: {(partner as any).usdc_score}</span>
              </>
            )}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1 leading-relaxed">
            {partner.description}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {partner.categories.slice(0, 3).map((cat, i) => (
              <span
                key={i}
                className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full ${categoryColors[cat] || "bg-muted text-muted-foreground"}`}
              >
                {cat}
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all font-medium text-xs"
              asChild
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <a href={partner.website || "#"} target="_blank" rel="noopener noreferrer">
                Visit <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground text-xs"
              onClick={handlePay}
              disabled={paying}
            >
              {paying ? (
                <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Zap className="h-3 w-3 mr-1" /> Pay</>
              )}
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default PartnerCard;
