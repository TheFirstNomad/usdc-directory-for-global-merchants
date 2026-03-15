import { Partner } from "@/lib/partners";
import { Button } from "@/components/ui/button";
import { ExternalLink, Star } from "lucide-react";
import { motion } from "framer-motion";

const PartnerCard = ({ partner, index }: { partner: Partner; index: number }) => {
  // Fallback to official logo if DB logo is broken/missing
  const logoUrl = partner.logo && partner.logo !== "" 
    ? partner.logo 
    : `https://cryptologos.cc/logos/${partner.name.toLowerCase().replace(/\s+/g, "-")}-logo.png`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="partner-card group relative bg-card border border-border rounded-3xl overflow-hidden hover:border-[#2775CA] h-full flex flex-col"
    >
      {/* BIG PROMINENT LOGO - exactly like usdt.directory */}
      <div className="h-24 flex items-center justify-center bg-gradient-to-br from-[#2775CA]/5 to-[#4B0082]/5 p-6">
        <img
          src={logoUrl}
          alt={`${partner.name} logo`}
          className="h-20 w-20 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = "https://cryptologos.cc/logos/usd-coin-usdc-logo.png";
          }}
        />
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-xl tracking-tight text-foreground">{partner.name}</h3>
          {partner.featured && <Star className="h-5 w-5 text-[#2775CA] fill-current" />}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">
          {partner.description}
        </p>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {partner.categories.map((cat, i) => (
            <span
              key={i}
              className="tag px-3 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full"
            >
              {cat}
            </span>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full group-hover:bg-[#2775CA] group-hover:text-white transition-all"
          asChild
        >
          <a href={partner.website || "#"} target="_blank" rel="noopener noreferrer">
            Visit Site <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    </motion.div>
  );
};

export default PartnerCard;
