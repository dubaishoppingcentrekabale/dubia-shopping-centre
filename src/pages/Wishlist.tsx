import { Link } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/context/WishlistContext";
import { useProducts } from "@/hooks/useProducts";

const Wishlist = () => {
  const { wishlist } = useWishlist();
  const { data: allProducts = [] } = useProducts();
  const wishlistedProducts = allProducts.filter((p) => wishlist.includes(p.id));

  return (
    <div className="container min-h-screen py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Continue shopping
      </Link>

      <div className="mt-6 rounded-[2rem] border border-border/70 bg-secondary px-7 py-8 text-secondary-foreground shadow-[0_30px_100px_-58px_rgba(15,23,42,0.7)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Your wishlist</p>
        <h1 className="mt-4 font-display text-5xl font-bold md:text-6xl">Saved for later.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-secondary-foreground/74">
          Products you've bookmarked for future reference. Add them to cart when you're ready.
        </p>
        <div className="mt-7 inline-flex rounded-[1.35rem] border border-white/10 bg-white/5 px-5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-foreground/55">
            {wishlistedProducts.length} saved {wishlistedProducts.length === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      {wishlistedProducts.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-border bg-card/95 px-8 py-16 text-center shadow-[0_24px_80px_-56px_rgba(15,23,42,0.42)]">
          <div className="mx-auto inline-flex rounded-[1.5rem] bg-primary/10 p-5 text-primary">
            <Heart className="h-10 w-10" />
          </div>
          <h2 className="mt-6 font-display text-3xl font-bold text-foreground">No saved items yet</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Tap the heart icon on any product to save it here for later.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center justify-center rounded-[1rem] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {wishlistedProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
