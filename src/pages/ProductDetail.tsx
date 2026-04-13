import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Minus, Plus, ShieldCheck, ShoppingCart, Star, Truck, Wallet } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductImageGallery from "@/components/ProductImageGallery";
import ProductJsonLd from "@/components/ProductJsonLd";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { formatPrice, getDiscountPercent, getSavingsAmount } from "@/lib/commerce";

const ProductDetail = () => {
  const { id } = useParams();
  const { data: product, isLoading } = useProduct(id || "");
  const { data: allProducts = [] } = useProducts();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container px-4 py-20 text-center">
        <h2 className="font-display text-3xl font-bold text-foreground">Product not found</h2>
        <Link to="/" className="mt-4 inline-block text-primary">
          Go back to shopping
        </Link>
      </div>
    );
  }

  const discount = getDiscountPercent(product.price, product.original_price);
  const savings = getSavingsAmount(product.price, product.original_price);
  const related = allProducts.filter((item) => item.category_id === product.category_id && item.id !== product.id).slice(0, 4);
  const stockLevel = product.stock_quantity ?? 0;
  const maxQuantity = stockLevel > 0 ? stockLevel : 1;
  const stockMessage = !product.in_stock
    ? "Out of stock"
    : stockLevel > 0 && stockLevel <= 3
      ? `Only ${stockLevel} left in stock`
      : "Ready for delivery";

  const handleAddToCart = () => {
    if (!product.in_stock) {
      toast({
        title: "Currently unavailable",
        description: "This product is not available to add right now.",
        variant: "destructive",
      });
      return;
    }

    for (let index = 0; index < quantity; index += 1) {
      addToCart(product);
    }

    toast({
      title: "Added to cart",
      description: `${quantity} ${quantity === 1 ? "item" : "items"} of ${product.name} ${quantity === 1 ? "has" : "have"} been added to your bag.`,
    });
  };

  return (
    <div className="min-h-screen py-8">
      <ProductJsonLd products={[product]} />
      <div className="container space-y-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to shopping
        </Link>

        <div className="grid gap-8 xl:grid-cols-[1fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="overflow-hidden rounded-[2.2rem] border border-border/70 bg-card p-4 shadow-[0_30px_100px_-60px_rgba(15,23,42,0.5)]">
              <ProductImageGallery
                productId={product.id}
                fallbackImage={product.image_url}
                productName={product.name}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Stock", value: stockMessage },
                { label: "Delivery", value: "Calculated at checkout" },
                { label: "Category", value: product.categories?.name || "Electronics" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.35rem] border border-border/70 bg-card/95 p-4 shadow-[0_20px_70px_-52px_rgba(15,23,42,0.42)]"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="space-y-6"
          >
            <div className="rounded-[2rem] border border-border/70 bg-card/95 p-7 shadow-[0_24px_90px_-56px_rgba(15,23,42,0.45)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                {product.categories?.name || "Electronics"}
              </p>
              <h1 className="mt-4 font-display text-5xl font-bold leading-none text-foreground">{product.name}</h1>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-primary">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-semibold">{product.rating || 0}</span>
                </div>
                <span className="text-sm text-muted-foreground">{product.review_count || 0} verified reviews</span>
                <span
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    product.in_stock ? "bg-secondary text-secondary-foreground" : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {stockMessage}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-end gap-4">
                <span className="text-4xl font-extrabold tracking-tight text-foreground">{formatPrice(product.price)}</span>
                {product.original_price ? (
                  <>
                    <span className="text-lg text-muted-foreground line-through">{formatPrice(product.original_price)}</span>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                      Save {discount}% / {formatPrice(savings)}
                    </span>
                  </>
                ) : null}
              </div>

              <p className="mt-6 text-sm leading-7 text-muted-foreground">
                {product.description || "A dependable product selection for everyday performance and practical local support."}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-4">
                <div className="inline-flex items-center rounded-[1rem] border border-border bg-background">
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    className="inline-flex h-12 w-12 items-center justify-center text-foreground transition hover:text-primary"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="inline-flex min-w-14 items-center justify-center text-sm font-semibold text-foreground">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((current) => Math.min(maxQuantity, current + 1))}
                    disabled={!product.in_stock || quantity >= maxQuantity}
                    className="inline-flex h-12 w-12 items-center justify-center text-foreground transition hover:text-primary disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {product.in_stock && stockLevel > 0 ? (
                  <span className="text-sm text-muted-foreground">Available quantity: {stockLevel}</span>
                ) : null}
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!product.in_stock}
                  className="inline-flex items-center justify-center gap-2 rounded-[1rem] bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {product.in_stock ? `Add ${quantity} to cart` : "Unavailable"}
                </button>
                <Link
                  to="/cart"
                  className="inline-flex items-center justify-center rounded-[1rem] border border-border px-5 py-3.5 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
                >
                  Review cart
                </Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Truck,
                  title: "Fast local delivery",
                  copy: "Delivery costs are confirmed at checkout based on your route.",
                },
                {
                  icon: ShieldCheck,
                  title: "Protected purchase",
                  copy: "Warranty-backed products with dependable after-sales guidance.",
                },
                {
                  icon: Wallet,
                  title: "Flexible payment",
                  copy: "Choose mobile money, card, or cash on delivery at checkout.",
                },
              ].map(({ icon: Icon, title, copy }) => (
                <div
                  key={title}
                  className="rounded-[1.7rem] border border-border/70 bg-card/95 p-5 shadow-[0_20px_70px_-52px_rgba(15,23,42,0.42)]"
                >
                  <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {related.length > 0 ? (
          <section className="rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.45)]">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">More to explore</p>
                <h2 className="mt-2 font-display text-4xl font-bold text-foreground">You may also like</h2>
              </div>
              <p className="max-w-md text-sm text-muted-foreground">
                More products from the same category to help you compare before you buy.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {related.map((item, index) => (
                <ProductCard key={item.id} product={item} index={index} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default ProductDetail;
