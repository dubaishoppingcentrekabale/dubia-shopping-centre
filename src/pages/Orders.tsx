import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Package, ArrowLeft, ChevronDown, MapPin, Phone, CreditCard, Clock } from "lucide-react";
import { formatPrice } from "@/lib/commerce";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products?: { name: string; image_url: string | null } | null;
}

interface Order {
  id: string;
  total: number;
  status: string;
  payment_method: string;
  shipping_address: string | null;
  shipping_city: string | null;
  phone: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  confirmed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  processing: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  shipped: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  delivered: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
};

const statusSteps = ["pending", "confirmed", "processing", "shipped", "delivered"];

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setOrders(data || []);
          setLoading(false);
        });
    }
  }, [user, authLoading, navigate]);

  const loadOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) return;
    const { data } = await supabase
      .from("order_items")
      .select("*, products(name, image_url)")
      .eq("order_id", orderId);
    setOrderItems((prev) => ({ ...prev, [orderId]: (data as OrderItem[]) || [] }));
  };

  const handleToggle = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      loadOrderItems(orderId);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container min-h-screen py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="w-4 h-4" /> Continue shopping
      </Link>

      <div className="mt-6 rounded-[2rem] border border-border/70 bg-secondary px-7 py-8 text-secondary-foreground shadow-[0_30px_100px_-58px_rgba(15,23,42,0.7)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Order history</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Total orders", value: String(orders.length) },
            { label: "Active", value: String(orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length) },
            { label: "Delivered", value: String(orders.filter((o) => o.status === "delivered").length) },
          ].map((item) => (
            <div key={item.label} className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-foreground/55">{item.label}</p>
              <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-border bg-card/95 px-8 py-16 text-center shadow-[0_24px_80px_-56px_rgba(15,23,42,0.42)]">
          <div className="mx-auto inline-flex rounded-[1.5rem] bg-primary/10 p-5 text-primary">
            <Package className="h-10 w-10" />
          </div>
          <h2 className="mt-6 font-display text-3xl font-bold text-foreground">No orders yet</h2>
          <p className="mt-3 text-sm text-muted-foreground">Start shopping and your order history will appear here.</p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center justify-center rounded-[1rem] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrder === order.id;
            const items = orderItems[order.id] || [];
            const stepIndex = statusSteps.indexOf(order.status);
            const isCancelled = order.status === "cancelled";

            return (
              <motion.div
                key={order.id}
                layout
                className="rounded-[1.8rem] border border-border/70 bg-card/95 shadow-[0_20px_70px_-52px_rgba(15,23,42,0.42)] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => handleToggle(order.id)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-muted/30"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                    <p className="text-sm font-semibold text-foreground">Order #{order.id.slice(0, 8)}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(order.created_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}>
                      {order.status}
                    </span>
                    <span className="text-sm font-bold text-foreground">{formatPrice(order.total)}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-border/70"
                    >
                      <div className="p-5 space-y-5">
                        {/* Status progress bar */}
                        {!isCancelled && (
                          <div className="rounded-[1.2rem] border border-border/70 bg-background/70 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">Order progress</p>
                            <div className="flex items-center gap-1">
                              {statusSteps.map((step, idx) => (
                                <div key={step} className="flex-1 flex flex-col items-center gap-1">
                                  <div className={`h-2 w-full rounded-full transition ${idx <= stepIndex ? "bg-primary" : "bg-border"}`} />
                                  <span className={`text-[10px] capitalize ${idx <= stepIndex ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                                    {step}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Order details */}
                        <div className="grid gap-3 sm:grid-cols-3">
                          {order.shipping_address && (
                            <div className="flex items-start gap-2 rounded-[1rem] border border-border/70 bg-background/70 p-3">
                              <MapPin className="h-4 w-4 text-primary mt-0.5" />
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Address</p>
                                <p className="mt-1 text-sm text-foreground">{order.shipping_address}</p>
                                {order.shipping_city && <p className="text-xs text-muted-foreground">{order.shipping_city}</p>}
                              </div>
                            </div>
                          )}
                          {order.phone && (
                            <div className="flex items-start gap-2 rounded-[1rem] border border-border/70 bg-background/70 p-3">
                              <Phone className="h-4 w-4 text-primary mt-0.5" />
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Phone</p>
                                <p className="mt-1 text-sm text-foreground">{order.phone}</p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-start gap-2 rounded-[1rem] border border-border/70 bg-background/70 p-3">
                            <CreditCard className="h-4 w-4 text-primary mt-0.5" />
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Payment</p>
                              <p className="mt-1 text-sm capitalize text-foreground">{order.payment_method.replace(/_/g, " ")}</p>
                            </div>
                          </div>
                        </div>

                        {/* Line items */}
                        {items.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Items ordered</p>
                            {items.map((item) => (
                              <div key={item.id} className="flex items-center gap-3 rounded-[1rem] border border-border/70 bg-background/70 p-3">
                                <div className="h-12 w-12 overflow-hidden rounded-lg bg-muted">
                                  <img
                                    src={item.products?.image_url || "/placeholder.svg"}
                                    alt={item.products?.name || "Product"}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate">
                                    {item.products?.name || "Product"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{item.quantity} × {formatPrice(item.price)}</p>
                                </div>
                                <p className="text-sm font-semibold text-foreground">{formatPrice(item.price * item.quantity)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
