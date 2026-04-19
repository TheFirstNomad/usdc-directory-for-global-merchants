import { CATEGORIES, CATEGORY_EMOJIS } from "@/lib/partners";

interface CategoryChipsProps {
  selectedCategories: string[];
  onToggleCategory: (cat: string) => void;
  counts?: Record<string, number>;
}

const CategoryChips = ({ selectedCategories, onToggleCategory, counts = {} }: CategoryChipsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
      {CATEGORIES.map((cat) => {
        const active = selectedCategories.includes(cat);
        const count = counts[cat] ?? 0;
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
            {count > 0 && (
              <span
                className={`ml-0.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-bold ${
                  active
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryChips;
