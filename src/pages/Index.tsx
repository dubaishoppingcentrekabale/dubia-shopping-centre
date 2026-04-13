import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import CategorySection from "@/components/CategorySection";
import FlashSaleBanner from "@/components/FlashSaleBanner";
import ProductCard from "@/components/ProductCard";
import TestimonialsSection from "@/components/TestimonialsSection";
import NewsletterSection from "@/components/NewsletterSection";
import ProductJsonLd from "@/components/ProductJsonLd";
import StoreJsonLd from "@/components/StoreJsonLd";
import { useBanners, useCategories, useFlashSaleProducts, useProducts, useTrendingProducts } from "@/hooks/useProducts";
import { formatPrice } from "@/lib/commerce";


const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategory = searchParams.get("category") || "";
  const { data: categories = [] } = useCategories();
  const { data: allProducts = [], isLoading } = useProducts();
  const { data: flashSaleProducts = [] } = useFlashSaleProducts();
  const { data: trendingProducts = [] } = useTrendingProducts();
  const { data: banners = [] } = useBanners();

  const categoryCounts = useMemo(() => {
    return allProducts.reduce<Record<string, number>>((counts, product) => {
      const slug = product.categories?.slug;

      if (slug) {
        counts[slug] = (counts[slug] ?? 0) + 1;
      }

      return counts;
    }, {});
  }, [allProducts]);

  const selectedCategoryName = categories.find((category) => category.slug === selectedCategory)?.name;

  const visibleFlashDeals = useMemo(
    () =>
      flashSaleProducts.filter((product) => !selectedCategory || product.categories?.slug === selectedCategory),
    [flashSaleProducts, selectedCategory],
  );
  const visibleTrendingProducts = useMemo(
    () => trendingProducts.filter((product) => !selectedCategory || product.categories?.slug === selectedCategory),
    [trendingProducts, selectedCategory],
  );
  const visibleAllProducts = useMemo(
    () => allProducts.filter((product) => !selectedCategory || product.categories?.slug === selectedCategory),
    [allProducts, selectedCategory],
  );

  const averageRating = useMemo(() => {
    const ratedProducts = allProducts.filter((product) => typeof product.rating === "number" && product.rating > 0);

    if (ratedProducts.length === 0) {
      return 4.8;
    }

    const total = ratedProducts.reduce((sum, product) => sum + Number(product.rating || 0), 0);
    return Number((total / ratedProducts.length).toFixed(1));
  }, [allProducts]);

  const featuredCategories = useMemo(() => {
    const ranked = categories
      .map((category) => ({
        ...category,
        count: categoryCounts[category.slug] ?? 0,
      }))
      .sort((left, right) => right.count - left.count);

    return ranked.slice(0, 4);
  }, [categories, categoryCounts]);

  const featuredCollections = useMemo(() => featuredCategories.slice(0, 3), [featuredCategories]);
  const highlightedProducts = useMemo(() => visibleAllProducts.slice(0, 3), [visibleAllProducts]);

  const handleSelectCategory = (slug: string) => {
    const nextParams = new URLSearchParams(searchParams);

    if (slug) {
      nextParams.set("category", slug);
    } else {
      nextParams.delete("category");
    }

    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="min-h-screen pb-8">
      <StoreJsonLd />
      {allProducts.length > 0 ? <ProductJsonLd products={allProducts} /> : null}


      <FlashSaleBanner dealCount={visibleFlashDeals.length} focusLabel={selectedCategoryName} />

      {/* Dynamic Banners from Admin */}
      {banners.length > 0 && (
        <section className="pt-4">
          <div className="container grid gap-4 md:grid-cols-2">
            {banners.map((banner, index) => {
              const content = (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-secondary text-secondary-foreground shadow-[0_24px_80px_-56px_rgba(15,23,42,0.5)] min-h-[160px]"
                >
                  {banner.image_url && (
                    <img src={banner.image_url} alt={banner.title} className="absolute inset-0 h-full w-full object-cover" />
                  )}
                  <div className={`relative p-6 ${banner.image_url ? "bg-secondary/80" : ""} h-full flex flex-col justify-end`}>
                    <h3 className="font-display text-2xl font-bold">{banner.title}</h3>
                    {banner.subtitle && <p className="mt-2 text-sm text-secondary-foreground/72">{banner.subtitle}</p>}
                    {banner.link_url && (
                      <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                        Learn more <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </motion.div>
              );
              return banner.link_url ? (
                <Link key={banner.id} to={banner.link_url}>{content}</Link>
              ) : (
                <div key={banner.id}>{content}</div>
              );
            })}
          </div>
        </section>
      )}




      <section className="py-8">
        <div className="container space-y-4 lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8 lg:space-y-0 xl:grid-cols-[320px_minmax(0,1fr)]">
          <CategorySection
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            productCounts={categoryCounts}
            totalProducts={allProducts.length}
          />

          <div className="space-y-8">
            {selectedCategoryName ? (
              <div className="rounded-[1.8rem] border border-border/70 bg-card/95 p-5 shadow-[0_20px_70px_-52px_rgba(15,23,42,0.4)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Active collection</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">{selectedCategoryName}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Showing the strongest products, deals, and recommendations in this category.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectCategory("")}
                    className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
                  >
                    View full catalog
                  </button>
                </div>
              </div>
            ) : null}

            <section className="rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.45)]">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Time-sensitive picks</p>
                  <h2 className="mt-2 font-display text-4xl font-bold text-foreground">Hot deals</h2>
                </div>
                <Link to="/deals" className="text-sm font-semibold text-primary transition hover:text-primary/80">
                  View all deals
                </Link>
              </div>
              {visibleFlashDeals.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleFlashDeals.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hot deals match this category yet.</p>
              )}
            </section>

            <section className="rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">High confidence buys</p>
                  <h2 className="mt-2 font-display text-4xl font-bold text-foreground">Trending now</h2>
                </div>
                <p className="max-w-md text-sm text-muted-foreground">
                  Strong ratings and consistent shopper attention are pulling these products upward right now.
                </p>
              </div>
              {visibleTrendingProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleTrendingProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No trending products match this category yet.</p>
              )}
            </section>

            <section className="rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.45)]">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Full inventory</p>
                  <h2 className="mt-2 font-display text-4xl font-bold text-foreground">All products</h2>
                </div>
                <p className="max-w-md text-sm text-muted-foreground">
                  Browse the complete electronics catalog and refine further from the search and category experience.
                </p>
              </div>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading products...</p>
              ) : visibleAllProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleAllProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No products match this category yet.</p>
              )}
            </section>

            {highlightedProducts.length > 0 ? (
              <section className="rounded-[2rem] border border-border/70 bg-secondary p-6 text-secondary-foreground shadow-[0_24px_90px_-54px_rgba(15,23,42,0.68)]">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Store picks</p>
                    <h2 className="mt-2 font-display text-4xl font-bold">Quick shortlist</h2>
                  </div>
                  <Link to="/search" className="text-sm font-semibold text-primary transition hover:text-primary/80">
                    Explore the full catalog
                  </Link>
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {highlightedProducts.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                    >
                      <p className="text-sm font-semibold">{product.name}</p>
                      <p className="mt-2 text-sm text-secondary-foreground/72">
                        {product.categories?.name || "Electronics"}
                      </p>
                      <p className="mt-3 text-lg font-bold text-white">{formatPrice(product.price)}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </section>

      <TestimonialsSection />
      <NewsletterSection />
    </div>
  );
};

export default Index;
