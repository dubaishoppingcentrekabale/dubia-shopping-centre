import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import CategorySection from "@/components/CategorySection";
import ProductCard from "@/components/ProductCard";
import { useCategories, useProducts } from "@/hooks/useProducts";
import { formatPrice } from "@/lib/commerce";

const SearchResults = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const selectedCategory = searchParams.get("category") || "";
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [showFilters, setShowFilters] = useState(false);

  const isDealsPage = location.pathname === "/deals";

  const sourceProducts = useMemo(() => {
    return isDealsPage ? products.filter((product) => product.is_flash_sale) : products;
  }, [isDealsPage, products]);

  const maxPrice = useMemo(() => {
    return sourceProducts.reduce((highestPrice, product) => Math.max(highestPrice, product.price), 0);
  }, [sourceProducts]);

  useEffect(() => {
    if (!maxPrice) {
      return;
    }

    setPriceRange((currentRange) => {
      const nextUpperBound = currentRange[1] === 0 || currentRange[1] > maxPrice ? maxPrice : currentRange[1];
      return [0, nextUpperBound];
    });
  }, [maxPrice]);

  const categoryCounts = useMemo(() => {
    return sourceProducts.reduce<Record<string, number>>((counts, product) => {
      const slug = product.categories?.slug;

      if (slug) {
        counts[slug] = (counts[slug] ?? 0) + 1;
      }

      return counts;
    }, {});
  }, [sourceProducts]);

  const selectedCategoryName = categories.find((category) => category.slug === selectedCategory)?.name;

  const filteredProducts = useMemo(() => {
    let result = sourceProducts.filter((product) => {
      const normalizedQuery = query.toLowerCase();
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.categories?.name?.toLowerCase().includes(normalizedQuery);
      const matchesCategory = !selectedCategory || product.categories?.slug === selectedCategory;
      const matchesPrice = product.price >= priceRange[0] && product.price <= (priceRange[1] || maxPrice || product.price);

      return matchesSearch && matchesCategory && matchesPrice;
    });

    return result;
  }, [sourceProducts, query, selectedCategory, priceRange, maxPrice]);

  const handleSelectCategory = (slug: string) => {
    const nextParams = new URLSearchParams(searchParams);

    if (slug) {
      nextParams.set("category", slug);
    } else {
      nextParams.delete("category");
    }

    setSearchParams(nextParams, { replace: true });
    setShowFilters(false);
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setPriceRange([0, maxPrice]);
    setShowFilters(false);
  };

  const activeFilters = [
    query ? `Search: ${query}` : "",
    selectedCategoryName ? `Category: ${selectedCategoryName}` : "",
    priceRange[1] > 0 && priceRange[1] < maxPrice ? `Under ${formatPrice(priceRange[1])}` : "",
  ].filter(Boolean);

  return (
    <div className="container min-h-screen py-8">
      <div className="grid gap-6 md:grid-cols-4">
        <div className={`${showFilters ? "block" : "hidden"} space-y-6 md:block`}>
          <CategorySection
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            productCounts={categoryCounts}
            totalProducts={sourceProducts.length}
          />

          <div className="rounded-[1.8rem] border border-border/70 bg-card/95 p-5 shadow-[0_20px_70px_-52px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">Maximum price</h3>
              <span className="text-sm font-semibold text-primary">{formatPrice(priceRange[1] || maxPrice || 0)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={maxPrice || 1000}
              step={Math.max(100, Math.round((maxPrice || 1000) / 50))}
              value={priceRange[1] || maxPrice || 0}
              onChange={(event) => setPriceRange([0, Number(event.target.value)])}
              className="mt-4 w-full accent-primary"
            />
            <p className="mt-3 text-sm text-muted-foreground">Slide to tighten the catalog around your budget.</p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="w-full rounded-[1.2rem] border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40"
          >
            Reset filters
          </button>
        </div>

        <div className="md:col-span-3">
          <div className="rounded-[1.8rem] border border-border/70 bg-card/95 p-5 shadow-[0_20px_70px_-52px_rgba(15,23,42,0.45)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{filteredProducts.length} products ready to compare</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use the filters to tighten the shortlist or jump back to the full catalog.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/40 md:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </button>
                {activeFilters.length > 0 ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/40"
                  >
                    <X className="h-4 w-4" />
                    Clear all
                  </button>
                ) : null}
              </div>
            </div>

            {activeFilters.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {activeFilters.map((filter) => (
                  <span
                    key={filter}
                    className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                  >
                    {filter}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-6">
            {isLoading ? (
              <p className="py-10 text-center text-muted-foreground">Loading products...</p>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-border bg-card/90 px-6 py-16 text-center">
                <p className="text-xl font-semibold text-foreground">No products found</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your category, search term, or price filter to widen the catalog.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 rounded-[1rem] bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  Reset and browse everything
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
