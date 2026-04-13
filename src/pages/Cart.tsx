import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { formatPrice, getSavingsAmount } from "@/lib/commerce";

const Cart = () => {
  const { items, totalItems, totalPrice, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const totalSavings = items.reduce(
    (sum, item) => sum + getSavingsAmount(item.product.price, item.product.original_price) * item.quantity,
    0,
  );

  if (items.length === 0) {
    return (
      <div className="container py-20">
        <div className="mx-auto max-w-2xl rounded-[2.2rem] border border-dashed border-border bg-card/95 px-8 py-16 text-center shadow-[0_24px_80px_-56px_rgba(15,23,42,0.42)]">
          <div className="mx-auto inline-flex rounded-[1.5rem] bg-primary/10 p-5 text-primary">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold text-foreground">Your cart is still empty</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            The good news is the upgraded storefront is ready for you. Browse the catalog and build a shortlist that
            fits your budget.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center justify-center rounded-[1rem] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container min-h-screen py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Continue shopping
      </Link>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[2rem] border border-border/70 bg-secondary px-7 py-8 text-secondary-foreground shadow-[0_30px_100px_-58px_rgba(15,23,42,0.7)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Shopping bag</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Products", value: String(items.length) },
              { label: "Units", value: String(totalItems) },
              { label: "Potential savings", value: formatPrice(totalSavings) },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-foreground/55">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-[0_24px_90px_-56px_rgba(15,23,42,0.45)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Truck className="h-4 w-4 text-primary" />
            Delivery details
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Delivery is charged separately and confirmed at checkout based on your route and pickup location.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            You can review the transport estimate before placing your order.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          {items.map((item) => (
            <motion.div
              key={item.product.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4 rounded-[1.8rem] border border-border/70 bg-card/95 p-5 shadow-[0_20px_70px_-52px_rgba(15,23,42,0.42)] sm:flex-row"
            >
              <Link to={`/product/${item.product.id}`} className="h-28 w-full overflow-hidden rounded-[1.2rem] bg-muted sm:w-28">
                <img
                  src={item.product.image_url || "/placeholder.svg"}
                  alt={item.product.name}
                  className="h-full w-full object-cover"
                />
              </Link>

              <div className="flex flex-1 flex-col justify-between gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link to={`/product/${item.product.id}`}>
                      <h2 className="text-lg font-semibold text-foreground">{item.product.name}</h2>
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">{item.product.categories?.name || "Electronics"}</p>
                    <p className="mt-3 text-xl font-bold text-foreground">{formatPrice(item.product.price)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="inline-flex items-center gap-2 self-start rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:border-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-full border border-border bg-background p-1">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-muted"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-10 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-muted"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-sm font-semibold text-foreground">
                    Line total: {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="h-fit rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-[0_24px_90px_-56px_rgba(15,23,42,0.45)] lg:sticky lg:top-28">
          <h2 className="font-display text-3xl font-bold text-foreground">Order summary</h2>
          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Delivery</span>
              <span className="font-semibold text-primary">Calculated at checkout</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Savings</span>
              <span>{formatPrice(totalSavings)}</span>
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-5">
            <div className="flex items-center justify-between text-lg font-bold text-foreground">
              <span>Current total</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Final total is confirmed at checkout after transport is calculated.
            </p>
          </div>

          <Link
            to={user ? "/checkout" : "/auth"}
            className="mt-6 inline-flex w-full items-center justify-center rounded-[1rem] bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            {user ? "Proceed to checkout" : "Sign in to checkout"}
          </Link>
          {!user ? (
            <p className="mt-3 text-center text-xs text-muted-foreground">Sign in is required before we can place your order.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Cart;
