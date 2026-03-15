import { ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Partner } from "@/lib/partners";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const networkColors: Record<string, string> = {
  Ethereum: "bg-[hsl(240,60%,95%)] text-[hsl(240,60%,40%)]",
  Base: "bg-[hsl(217,80%,95%)] text-[hsl(217,80%,40%)]",
  Solana: "bg-[hsl(280,60%,95%)] text-[hsl(280,60%,40%)]",
};

const PartnerCard = ({ partner, index }: { partner: Partner; index?: number }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: (index || 0) * 0.04 }}
          className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 focus-within:ring-2 focus-within:ring-ring"
        >
          {/* Banner */}
          <div className="h-20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative">
            {partner.featured && (
              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground uppercase tracking-wider">
                Featured
              </span>
            )}
          </div>

          {/* Logo overlap */}
          <div className="px-5 -mt-7">
            <div className="w-14 h-14 rounded-xl bg-card border-2 border-card shadow-md flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
              {partner.logo_emoji}
            </div>
          </div>

          {/* Body */}
          <div className="px-5 pt-3 pb-5">
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="font-semibold text-card-foreground text-base leading-tight truncate">
                {partner.name}
              </h3>
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] flex-shrink-0" />
            </div>
            <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed mb-3">
              {partner.description}
            </p>

            {/* Network / Category pills */}
            <div className="flex flex-wrap gap-1.5">
              {partner.categories.slice(0, 2).map((cat) => (
                <span
                  key={cat}
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-tag text-tag-foreground"
                >
                  {cat}
                </span>
              ))}
              {partner.categories.length > 2 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
                  +{partner.categories.length - 2}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-tag flex items-center justify-center text-3xl">
              {partner.logo_emoji}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <DialogTitle className="text-lg">{partner.name}</DialogTitle>
                <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
              </div>
              <p className="text-sm text-muted-foreground">{partner.region}</p>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <p className="text-sm text-foreground leading-relaxed">{partner.description}</p>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Categories
            </p>
            <div className="flex flex-wrap gap-1.5">
              {partner.categories.map((cat) => (
                <span key={cat} className="px-2.5 py-1 rounded-full text-xs font-medium bg-tag text-tag-foreground">
                  {cat}
                </span>
              ))}
            </div>
          </div>
          {partner.use_cases.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Use Cases
              </p>
              <div className="flex flex-wrap gap-1.5">
                {partner.use_cases.map((uc) => (
                  <span key={uc} className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    {uc}
                  </span>
                ))}
              </div>
            </div>
          )}
          {partner.website && (
            <a href={partner.website} target="_blank" rel="noopener noreferrer">
              <Button className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-ring">
                Visit Website <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerCard;
