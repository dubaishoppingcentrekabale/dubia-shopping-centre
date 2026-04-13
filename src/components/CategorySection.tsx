import {
  ChevronRight,
  Laptop,
  Layers3,
  Monitor,
  Headphones,
  Smartphone,
  Gamepad2,
  Camera,
  Cable,
  Cpu,
} from "lucide-react";
import type { DbCategory } from "@/hooks/useProducts";

const categoryIcons: Record<string, React.ElementType> = {
  smartphones: Smartphone,
  laptops: Laptop,
  tvs: Monitor,
  audio: Headphones,
  gaming: Gamepad2,
  cameras: Camera,
  accessories: Cable,
  electronics: Cpu,
};

interface CategorySectionProps {
  categories: DbCategory[];
  selectedCategory?: string;
  onSelectCategory: (slug: string) => void;
  productCounts?: Record<string, number>;
  totalProducts?: number;
}

const CategorySection = ({
  categories,
  selectedCategory = "",
  onSelectCategory,
  productCounts = {},
  totalProducts = 0,
}: CategorySectionProps) => {
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile: horizontal icon strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden">
        <button
          type="button"
          onClick={() => onSelectCategory("")}
          aria-pressed={!selectedCategory}
          className={`flex shrink-0 flex-col items-center gap-1 rounded-2xl border px-3 py-2.5 text-[10px] font-semibold transition ${
            !selectedCategory
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border/70 bg-card/95 text-muted-foreground hover:border-primary/30"
          }`}
        >
          <Layers3 className="h-5 w-5" />
          <span>All</span>
        </button>
        {categories.map((category) => {
          const isActive = selectedCategory === category.slug;
          const Icon = categoryIcons[category.slug] || Cpu;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.slug)}
              aria-pressed={isActive}
              className={`flex shrink-0 flex-col items-center gap-1 rounded-2xl border px-3 py-2.5 text-[10px] font-semibold transition ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/70 bg-card/95 text-muted-foreground hover:border-primary/30"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{(category.name || "").split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop: full sidebar */}
      <aside className="hidden rounded-[2rem] border border-border/70 bg-card/95 p-5 shadow-sm lg:sticky lg:top-28 lg:block">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onSelectCategory("")}
            aria-pressed={!selectedCategory}
            className={`flex w-full items-center justify-between rounded-[1.25rem] border px-4 py-3 text-sm font-semibold transition ${
              !selectedCategory
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border/70 bg-background/80 text-foreground hover:border-primary/30 hover:bg-background"
            }`}
          >
            <span>All products</span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs ${
                !selectedCategory ? "bg-white/15 text-white" : "bg-primary/10 text-primary"
              }`}
            >
              {totalProducts}
            </span>
          </button>

          {categories.map((category) => {
            const isActive = selectedCategory === category.slug;
            const count = productCounts[category.slug] ?? 0;
            const Icon = categoryIcons[category.slug] || Cpu;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onSelectCategory(category.slug)}
                aria-pressed={isActive}
                className={`group flex w-full items-center justify-between rounded-[1.25rem] border px-4 py-3 text-left transition ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/70 bg-background/80 hover:border-primary/30 hover:bg-background"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                      isActive ? "bg-white/12 text-white" : "bg-primary/10 text-primary"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-semibold ${isActive ? "text-white" : "text-foreground"}`}>
                      {category.name}
                    </p>
                    <p className={`truncate text-xs ${isActive ? "text-white/72" : "text-muted-foreground"}`}>
                      {count} products
                    </p>
                  </div>
                </div>

                <ChevronRight
                  className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-muted-foreground group-hover:text-primary"}`}
                />
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
};

export default CategorySection;
