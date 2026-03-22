import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/partners";
import { useState, useRef, useMemo, useEffect } from "react";

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
  partnerNames?: string[];
}

const AnimatedCounter = ({ target }: { target: number }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const duration = 1200;
    const step = Math.max(1, Math.floor(target / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count}</span>;
};

const HeroSection = ({
  searchQuery,
  onSearchChange,
  onSearch,
  partnerCount,
  onCategorySelect,
  selectedCategories,
  partnerNames = [],
}: HeroSectionProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    const nameMatches = partnerNames
      .filter((n) => n.toLowerCase().includes(q))
      .slice(0, 3);
    const catMatches = CATEGORIES.filter((c) => c.toLowerCase().includes(q)).slice(0, 2);
    return [...new Set([...nameMatches, ...catMatches])].slice(0, 5);
  }, [searchQuery, partnerNames]);

  return (
    <section className="relative overflow-hidden pt-20 pb-14 sm:pt-28 sm:pb-20">
      {/* Multi-layer gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-background to-[hsl(275,100%,25%)]/[0.04]" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 0.5px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-primary/[0.08] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[350px] h-[350px] rounded-full bg-[hsl(275,100%,25%)]/[0.06] blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated stats badge */}
          <div className="inline-flex items-center gap-2.5 bg-primary/10 border border-primary/20 rounded-full px-5 py-2 mb-7">
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
            <span className="text-primary text-xs font-bold tracking-wide uppercase">
              <AnimatedCounter target={partnerCount} /> Verified Partners • Updated Today
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground mb-5 leading-[1.08] tracking-tight">
            The #1 Everyday Directory for{" "}
            <span className="bg-gradient-to-r from-primary via-[hsl(210,90%,55%)] to-[hsl(275,100%,25%)] bg-clip-text text-transparent">
              Spending USDC
            </span>{" "}
            Worldwide
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Built for freedom with Circle's regulated digital dollar. Discover trusted
            merchants, exchanges, and protocols accepting{" "}
            <span className="font-semibold text-foreground">USDC</span> globally.
          </p>
        </motion.div>

        {/* Premium glowing search bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="relative max-w-xl mx-auto"
        >
          <div className="search-input bg-card rounded-2xl border border-border/60 flex items-center px-5 py-2.5 gap-3 ring-1 ring-primary/[0.06]">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder={`Search ${partnerCount} merchants…`}
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50 text-sm py-2"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
            />
            <Button
              size="sm"
              onClick={onSearch}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 font-semibold shadow-md"
            >
              Search
            </Button>
          </div>

          {/* Autocomplete dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-20">
              {suggestions.map((s) => (
                <button
                  key={s}
                  className="w-full text-left px-5 py-3 text-sm text-foreground hover:bg-muted transition-colors"
                  onMouseDown={() => {
                    onSearchChange(s);
                    setShowSuggestions(false);
                  }}
                >
                  <Search className="inline h-3.5 w-3.5 text-muted-foreground mr-2" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Category pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-8 flex gap-2 overflow-x-auto scrollbar-hide justify-start sm:justify-center px-2 pb-2"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategorySelect(cat)}
              className={`tag flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                selectedCategories.includes(cat)
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground hover:shadow-sm"
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
