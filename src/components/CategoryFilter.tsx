import { CATEGORIES, CATEGORY_EMOJIS, REGIONS, REGION_FLAGS } from "@/lib/partners";

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
