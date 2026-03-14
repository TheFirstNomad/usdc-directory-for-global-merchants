import { Search } from "lucide-react";
import worldMap from "@/assets/world-map-dots.png";

const stats = [
  { value: "$78B+", label: "In Circulation" },
  { value: "30+", label: "Blockchains" },
  { value: "$69T+", label: "All-Time Volume" },
  { value: "CCTP", label: "Cross-Chain" },
];

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  partnerCount: number;
}

const HeroSection = ({ searchQuery, onSearchChange, partnerCount }: HeroSectionProps) => {
  return (
    <section className="bg-hero relative overflow-hidden pb-14 pt-14">
      <img
        src={worldMap}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none"
      />
      <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
        <div className="inline-flex items-center gap-2 bg-hero-foreground/10 border border-hero-foreground/20 rounded-full px-4 py-1.5 mb-6">
          <span className="text-hero-foreground text-xs font-medium">
            Official Circle Alliance Partners
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-hero-foreground mb-4 leading-tight">
          USDC Partners Directory
        </h1>
        <p className="text-hero-muted text-base sm:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
          Discover the global ecosystem of companies and tools built on USDC — the leading
          regulated digital dollar issued by{" "}
          <a
            href="https://www.circle.com/usdc"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 text-hero-foreground hover:opacity-80"
          >
            Circle
          </a>{" "}
          (1:1 backed by cash & U.S. Treasuries).
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-hero-foreground/10 backdrop-blur-sm border border-hero-foreground/15 rounded-xl px-4 py-3"
            >
              <div className="text-hero-foreground font-extrabold text-xl sm:text-2xl">
                {stat.value}
              </div>
              <div className="text-hero-muted text-xs font-medium mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="bg-card rounded-xl shadow-lg flex items-center px-4 py-3.5 max-w-xl mx-auto">
          <Search className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
          <input
            type="text"
            placeholder={`Search ${partnerCount} partners by name, category, or region...`}
            className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <p className="text-hero-muted/60 text-xs mt-5">
          Listing does not imply endorsement ·{" "}
          <a
            href="https://partners.circle.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View full list at partners.circle.com
          </a>
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
