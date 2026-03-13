import { Search } from "lucide-react";
import worldMap from "@/assets/world-map-dots.png";

const categories = [
  "Exchanges",
  "Wallets",
  "Payment processors",
  "Merchants",
  "On/Off-ramps",
];

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

const HeroSection = ({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
}: HeroSectionProps) => {
  return (
    <section className="bg-hero relative overflow-hidden pb-16 pt-12">
      <img
        src={worldMap}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none"
      />
      <div className="relative z-10 max-w-3xl mx-auto text-center px-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-hero-foreground mb-4 leading-tight">
          Discover where you can use USDC
        </h1>
        <p className="text-hero-muted text-lg mb-8">
          Explore exchanges, wallets, merchants and payment providers that
          support USDC across the world.
        </p>

        <div className="bg-card rounded-xl shadow-lg flex items-center px-4 py-3 max-w-xl mx-auto mb-6">
          <Search className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search exchanges, merchants, wallets, or products..."
            className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                onCategoryChange(activeCategory === cat ? null : cat)
              }
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                activeCategory === cat
                  ? "bg-hero-foreground text-hero border-hero-foreground"
                  : "border-hero-foreground/30 text-hero-foreground hover:bg-hero-foreground/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="text-hero-muted/60 text-xs mt-6">
          Listing does not imply endorsement
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
