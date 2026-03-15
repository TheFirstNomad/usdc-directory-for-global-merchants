import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/partners";

const categoryEmojis: Record<string, string> = {
  Payments: "💳",
  Remittances: "💸",
  Wallets: "👛",
  "On/Off-Ramps": "🔄",
  DeFi: "🏦",
  RWA: "🏠",
  Infrastructure: "⚙️",
  "AI Payments": "🤖",
  Enterprise: "🏢",
};

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
  partnerCount: number;
  onCategorySelect: (cat: string) => void;
  selectedCategories: string[];
}

const HeroSection = ({
  searchQuery,
  onSearchChange,
  onSearch,
  partnerCount,
  onCategorySelect,
  selectedCategories,
}: HeroSectionProps) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-primary/[0.04] to-background pt-16 pb-12">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 max-w-3xl mx-auto text-center px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
            <span className="text-primary text-xs font-semibold tracking-wide">
              {partnerCount} Verified Partners
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4 leading-tight tracking-tight">
            Discover Global Merchants
            <br />
            <span className="text-primary">Accepting USDC</span>
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            The trusted directory of companies and tools built on USDC — the leading
            regulated digital dollar.
          </p>
        </motion.div>

        {/* Floating Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-card rounded-2xl shadow-lg border border-border flex items-center px-4 py-2 max-w-xl mx-auto gap-2"
        >
          <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder={`Search ${partnerCount} partners by name, category, or region…`}
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm py-2 focus:outline-none"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
          <Button
            size="sm"
            onClick={onSearch}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-5 focus:ring-2 focus:ring-ring"
          >
            Search
          </Button>
        </motion.div>

        {/* Category Pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-6 flex gap-2 overflow-x-auto scrollbar-hide justify-start sm:justify-center px-2 pb-2"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategorySelect(cat)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all border focus:outline-none focus:ring-2 focus:ring-ring ${
                selectedCategories.includes(cat)
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <span>{categoryEmojis[cat] || "📦"}</span>
              {cat}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
