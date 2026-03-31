import type { Partner } from "@/lib/partners";
import { ExternalLink } from "lucide-react";

const FeaturedCarousel = ({ partners }: { partners: Partner[] }) => {
  if (partners.length === 0) return null;

  // Tiny deduplication fix: remove duplicate merchants by name (case-insensitive)
  // Keeps the first occurrence — fixes the visual duplicates without touching data
  const uniquePartners = Array.from(
    new Map(
      partners.map((p) => [p.name.toLowerCase().trim(), p])
    ).values()
  );

  const displayedPartners = uniquePartners.slice(0, 4);

  return (
    <section className="py-8">
      <h2 className="text-lg font-bold text-foreground mb-4">Featured Listings</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
        {displayedPartners.map((p) => {
          const logoUrl =
            p.logo_url && p.logo_url !== ""
              ? p.logo_url
              : `https://logo.clearbit.com/${p.website?.replace(/https?:\/\//, "").replace(/\/.*/, "") || p.name.toLowerCase().replace(/\s+/g, "") + ".com"}`;

          return (
            <a
              key={p.id}
              href={p.website || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="snap-start flex-shrink-0 w-64 bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={logoUrl}
                  alt={`${p.name} logo`}
                  className="w-10 h-10 object-contain rounded-lg bg-card p-1 shadow-sm group-hover:scale-105 transition-transform"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "https://cryptologos.cc/logos/usd-coin-usdc-logo.png";
                  }}
                />
                <h3 className="font-semibold text-card-foreground text-sm">{p.name}</h3>
              </div>
              <p className="text-muted-foreground text-xs line-clamp-3 mb-3 leading-relaxed">
                {p.description}
              </p>
              <div className="flex items-center text-xs text-primary font-medium">
                Visit <ExternalLink className="ml-1 h-3 w-3" />
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedCarousel;
