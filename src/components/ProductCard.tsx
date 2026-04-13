import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, Eye, Heart, ShoppingCart, Sparkles, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import type { DbProduct } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { formatPrice, getDiscountPercent, getSavingsAmount } from "@/lib/commerce";

interface ProductCardProps {
  product: DbProduct;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();
  const discount = getDiscountPercent(product.price, product.original_price);
  const savings = getSavingsAmount(product.price, product.original_price);
  const wishlisted = isInWishlist(product.id);
  const stockLevel = product.stock_quantity ?? 0;
  const stockMessage = !product.in_stock
    ? "Out of stock"
    : stockLevel > 0 && stockLevel <= 3
      ? `Only ${stockLevel} left`
      : "In stock";

  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!product.in_stock) {
      toast({ title: "Currently unavailable", description: `${product.name} is not available.`, variant: "destructive" });
      return;
    }
    addToCart(product);
    toast({ title: "Added to cart", description: `${product.name} is ready whenever you are.` });
  };

  const handleToggleWishlist = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    toggleWishlist(product.id);
    toast({
      title: wishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: wishlisted ? `${product.name} removed.` : `${product.name} saved for later.`,
    });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.45 }}
      className="group h-full"
    >
      <Link
        to={`/product/${product.id}`}
        className="flex h-full flex-col overflow-hidden rounded-[1.65rem] border border-border/70 bg-card/95 shadow-[0_22px_80px_-52px_rgba(15,23,42,0.55)] transition duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-[0_28px_100px_-48px_rgba(15,23,42,0.65)]"
      >
        <div className="relative aspect-[4/4.3] overflow-hidden bg-muted">
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
          

          {/* Overlay actions on hover */}
          <div className="absolute inset-0 flex items-center justify-center gap-3 bg-secondary/0 opacity-0 transition-all duration-300 group-hover:bg-secondary/30 group-hover:opacity-100">
            <motion.span
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-card/95 text-foreground shadow-lg backdrop-blur transition hover:bg-primary hover:text-primary-foreground"
            >
              <Eye className="h-4 w-4" />
            </motion.span>
          </div>

          {/* Wishlist button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            className={`absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border transition duration-200 ${
              wishlisted
                ? "border-primary bg-primary text-primary-foreground shadow-md"
                : "border-white/30 bg-white/80 text-foreground/70 hover:bg-primary hover:text-primary-foreground hover:border-primary"
            }`}
          >
            <Heart className={`h-4 w-4 ${wishlisted ? "fill-current" : ""}`} />
          </button>

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {discount > 0 && (
              <span className="rounded-full bg-destructive px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-destructive-foreground shadow-sm">
                Save {discount}%
              </span>
            )}
            {product.is_flash_sale && (
              <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-foreground shadow-sm">
                Flash deal
              </span>
            )}
          </div>

          <div className="absolute bottom-3 left-3 right-14 flex items-center justify-between gap-2">
            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary shadow-sm backdrop-blur">
              {product.categories?.name || "Electronics"}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-sm backdrop-blur ${
                product.in_stock ? "bg-secondary/90 text-secondary-foreground" : "bg-white/90 text-destructive"
              }`}
            >
              {stockMessage}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                {product.name}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                {product.description || "Trusted everyday tech with dependable local support."}
              </p>
            </div>
            <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-sm">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-primary">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="font-semibold">{product.rating || 0}</span>
              <span className="text-primary/70">/ 5</span>
            </div>
            <span className="text-sm text-muted-foreground">{product.review_count || 0} reviews</span>
          </div>

          <div className="mt-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-2xl font-extrabold tracking-tight text-foreground">{formatPrice(product.price)}</p>
              {product.original_price ? (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground line-through">{formatPrice(product.original_price)}</span>
                  <span className="text-sm font-semibold text-primary">Save {formatPrice(savings)}</span>
                </div>
              ) : (
                <div className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Warranty-backed
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-[1rem] bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-[0.98]"
          >
            <ShoppingCart className="h-4 w-4" />
            {product.in_stock ? "Add to cart" : "Unavailable"}
          </button>
        </div>
      </Link>
    </motion.article>
  );
};

export default ProductCard;
