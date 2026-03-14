import { CATEGORIES, REGIONS } from "@/lib/partners";

interface CategoryFilterProps {
  selectedCategories: string[];
  onToggleCategory: (cat: string) => void;
  selectedRegions: string[];
  onToggleRegion: (region: string) => void;
}

const CategoryFilter = ({
  selectedCategories,
  onToggleCategory,
  selectedRegions,
  onToggleRegion,
}: CategoryFilterProps) => {
  return (
    <div className="space-y-6">
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
                {cat}
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
                className="w-4 h-4 rounded border-border text-primary accent-primary"
              />
              <span className="text-sm text-muted-foreground group-hover:text-card-foreground transition-colors">
                {region}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-tag rounded-xl p-5 text-center">
        <p className="text-sm font-medium text-tag-foreground mb-2">Are you a USDC partner?</p>
        <a
          href="/submit"
          className="text-xs text-primary font-semibold hover:underline"
        >
          Submit your company →
        </a>
      </div>
    </div>
  );
};

export default CategoryFilter;
