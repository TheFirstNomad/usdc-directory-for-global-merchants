import type { Partner } from "@/lib/partners";
import { ExternalLink } from "lucide-react";

const FeaturedCarousel = ({ partners }: { partners: Partner[] }) => {
  if (partners.length === 0) return null;

  return (
    <section className="py-8">
      <h2 className="text-lg font-bold text-foreground mb-4">Featured Partners</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
        {partners.map((p) => (
          <a
            key={p.id}
            href={p.website || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="snap-start flex-shrink-0 w-64 bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-tag flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                {p.logo_emoji}
              </div>
              <h3 className="font-semibold text-card-foreground text-sm">{p.name}</h3>
            </div>
            <p className="text-muted-foreground text-xs line-clamp-3 mb-3 leading-relaxed">
              {p.description}
            </p>
            <div className="flex items-center text-xs text-primary font-medium">
              Visit <ExternalLink className="ml-1 h-3 w-3" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
};

export default FeaturedCarousel;
