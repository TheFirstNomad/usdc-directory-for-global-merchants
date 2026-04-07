import { CATEGORIES, CATEGORY_EMOJIS, REGIONS, REGION_FLAGS, NETWORKS } from "@/lib/partners";

interface CategoryFilterProps {
  selectedCategories: string[];
  onToggleCategory: (cat: string) => void;
  selectedRegions: string[];
  onToggleRegion: (region: string) => void;
  selectedNetworks: string[];
  onToggleNetwork: (network: string) => void;
}

const CategoryFilter = ({
  selectedCategories,
  onToggleCategory,
  selectedRegions,
  onToggleRegion,
  selectedNetworks,
  onToggleNetwork,
}: CategoryFilterProps) => {
  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-card-foreground mb-3 text-sm">Categories</h3>
        <div className="space-y-1.5">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => onToggleCategory(cat)}
                className="w-4 h-4 rounded border-border text-primary accent-primary"
              />
              <span className="text-sm text-muted-foreground group-hover:text-card-foreground transition-colors">
                {CATEGORY_EMOJIS[cat] || "📦"} {cat}
              </span>
            </label>
          ))}
        </div>
      </div>



      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-center">
        <p className="text-sm font-medium text-foreground mb-2">Accept USDC?</p>
        <a
          href="/submit"
          className="text-xs text-primary font-semibold hover:underline"
        >
          List your business for 10 USDC →
        </a>
      </div>
    </div>
  );
};

export default CategoryFilter;
