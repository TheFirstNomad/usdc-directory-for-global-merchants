import { CATEGORIES, CATEGORY_EMOJIS } from "@/lib/partners";

interface CategoryChipsProps {
  selectedCategories: string[];
  onToggleCategory: (cat: string) => void;
}

const CategoryChips = ({ selectedCategories, onToggleCategory }: CategoryChipsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
      {CATEGORIES.map((cat) => {
        const active = selectedCategories.includes(cat);
        return (
          <button
            key={cat}
            onClick={() => onToggleCategory(cat)}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              active
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            <span>{CATEGORY_EMOJIS[cat] || "📦"}</span>
            <span>{cat}</span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryChips;
