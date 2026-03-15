import { CATEGORIES, REGIONS, NETWORKS } from "@/lib/partners";

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
                className="w-4 h-4 rounded border-border text-primary accent-primary focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground group-hover:text-card-foreground transition-colors">
                {cat}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-card-foreground mb-3 text-sm">Networks</h3>
        <div className="space-y-1.5">
          {NETWORKS.map((net) => (
            <label key={net} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedNetworks.includes(net)}
                onChange={() => onToggleNetwork(net)}
                className="w-4 h-4 rounded border-border text-primary accent-primary focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground group-hover:text-card-foreground transition-colors">
                {net}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-card-foreground mb-3 text-sm">Region</h3>
        <div className="space-y-1.5">
          {REGIONS.map((region) => (
            <label key={region} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedRegions.includes(region)}
                onChange={() => onToggleRegion(region)}
                className="w-4 h-4 rounded border-border text-primary accent-primary focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground group-hover:text-card-foreground transition-colors">
                {region}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-tag rounded-xl p-5 text-center">
        <p className="text-sm font-medium text-tag-foreground mb-2">Accept USDC?</p>
        <a
          href="/submit"
          className="text-xs text-primary font-semibold hover:underline"
        >
          Add your business →
        </a>
      </div>
    </div>
  );
};

export default CategoryFilter;
