import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, MapPin, ShieldCheck, Truck, Wallet, X, TicketPercent } from "lucide-react";
import LocationMapPicker from "@/components/LocationMapPicker";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/commerce";
import { getErrorMessage } from "@/lib/errors";
import {
  formatCoordinatePair,
  getFallbackTransportEstimate,
  TRANSPORT_RATE_PER_KM,
  type MapCoordinates,
  type TransportEstimate,
} from "@/lib/transport";

const Checkout = () => {
  const { user, loading: authLoading } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Kabale");
  const [locationDetails, setLocationDetails] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mobile_money" | "cash_on_delivery">("mobile_money");
  const [submitting, setSubmitting] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState<MapCoordinates | null>(null);
  const [transportFare, setTransportFare] = useState<number | null>(null);
  const [transportDistance, setTransportDistance] = useState("");
  const [transportDuration, setTransportDuration] = useState("");
  const [transportNote, setTransportNote] = useState("");
  const [calculatingFare, setCalculatingFare] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, navigate, user]);

  const trimmedAddress = address.trim();
  const trimmedCity = city.trim();
  const trimmedLocationDetails = locationDetails.trim();
  const trimmedPhone = phone.trim();
  const phoneDigits = trimmedPhone.replace(/\D/g, "");
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const grandTotal = Math.max(0, totalPrice + (transportFare ?? 0) - couponDiscount);
  const hasDeliveryDetails = Boolean(trimmedAddress && trimmedCity && trimmedLocationDetails);
  const hasTransportOrigin = Boolean(selectedMapLocation || hasDeliveryDetails);
  const deliveryLocation = useMemo(
    () => (hasDeliveryDetails ? [trimmedAddress, trimmedLocationDetails, trimmedCity].join(", ") : ""),
    [hasDeliveryDetails, trimmedAddress, trimmedCity, trimmedLocationDetails],
  );
  const transportOrigin = useMemo(
    () =>
      selectedMapLocation ? `${selectedMapLocation.lat.toFixed(6)},${selectedMapLocation.lng.toFixed(6)}` : deliveryLocation,
    [deliveryLocation, selectedMapLocation],
  );
  const transportOriginLabel = selectedMapLocation ? "selected map location" : "delivery details";
  const deliveryRouteLabel = useMemo(() => {
    if (selectedMapLocation) {
      return `Selected map pin: ${formatCoordinatePair(selectedMapLocation)}`;
    }
    return deliveryLocation;
  }, [deliveryLocation, selectedMapLocation]);

  const resetTransportEstimate = () => {
    setTransportFare(null);
    setTransportDistance("");
    setTransportDuration("");
    setTransportNote("");
  };

  const applyTransportEstimate = (estimate: TransportEstimate) => {
    setTransportFare(estimate.fare);
    setTransportDistance(estimate.distanceText);
    setTransportDuration(estimate.durationText);
    setTransportNote(estimate.note ?? "");
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) { toast({ variant: "destructive", title: "Enter a coupon code" }); return; }
    setCouponLoading(true);
    try {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) {
        toast({ variant: "destructive", title: "Invalid coupon", description: "This coupon code doesn't exist or is inactive." });
        return;
      }

      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast({ variant: "destructive", title: "Coupon expired", description: "This coupon has expired." });
        return;
      }

      // Check max uses
      if (data.max_uses && data.current_uses >= data.max_uses) {
        toast({ variant: "destructive", title: "Coupon exhausted", description: "This coupon has been used the maximum number of times." });
        return;
      }

      // Check min order
      if (totalPrice < data.min_order_amount) {
        toast({ variant: "destructive", title: "Minimum not met", description: `This coupon requires a minimum order of ${formatPrice(data.min_order_amount)}.` });
        return;
      }

      // Calculate discount
      let discount = 0;
      if (data.discount_type === "percentage") {
        discount = Math.round(totalPrice * data.discount_value / 100);
      } else {
        discount = data.discount_value;
      }
      discount = Math.min(discount, totalPrice); // Don't exceed subtotal

      setCouponDiscount(discount);
      setAppliedCoupon(code);
      toast({ title: "Coupon applied!", description: `You save ${formatPrice(discount)}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Could not apply coupon", description: getErrorMessage(e, "Try again.") });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponDiscount(0);
    setAppliedCoupon(null);
    setCouponCode("");
  };

  if (authLoading) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Loading checkout...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <h2 className="font-display text-4xl font-bold text-foreground">Nothing to checkout</h2>
        <p className="mt-3 text-sm text-muted-foreground">Your cart is empty, so there is nothing to place just yet.</p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center rounded-[1rem] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  const calculateTransportEstimate = async () => {
    if (!hasTransportOrigin) {
      toast({
        title: "Add a delivery location",
        description: "Enter your address, city, and key location details or choose a pin on the map before calculating transport.",
        variant: "destructive",
      });
      return null;
    }

    setCalculatingFare(true);

    try {
      const { data, error } = await supabase.functions.invoke("calculate-transport", {
        body: { origin: transportOrigin },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const nextFare = Number(data?.fare);
      if (!Number.isFinite(nextFare)) throw new Error("Transport fare is unavailable right now.");

      const estimate: TransportEstimate = {
        distanceKm: Number(data?.distance_km ?? 0) || 0,
        distanceText: String(data.distance_text ?? ""),
        durationText: String(data.duration_text ?? ""),
        fare: nextFare,
        source: data?.source === "fallback" ? "fallback" : "maps",
        note: typeof data?.note === "string" && data.note ? data.note : selectedMapLocation ? "Calculated from the selected map location using Google Maps route data." : "",
      };

      applyTransportEstimate(estimate);
      toast({
        title: estimate.source === "fallback" ? "Transport estimated" : "Transport calculated",
        description: estimate.source === "fallback"
          ? `${formatPrice(nextFare)} estimated from our local route guide.`
          : `Estimated delivery cost is ${formatPrice(nextFare)} from the ${transportOriginLabel}.`,
      });
      return nextFare;
    } catch (error) {
      const fallbackEstimate = getFallbackTransportEstimate(transportOrigin);
      if (fallbackEstimate) {
        applyTransportEstimate(fallbackEstimate);
        toast({ title: "Transport estimated", description: `${formatPrice(fallbackEstimate.fare)} estimated from our local route guide.` });
        return fallbackEstimate.fare;
      }
      resetTransportEstimate();
      toast({ title: "Could not calculate transport", description: getErrorMessage(error, "Please review the address and try again."), variant: "destructive" });
      return null;
    } finally {
      setCalculatingFare(false);
    }
  };

  const handleCalculateTransport = async () => {
    await calculateTransportEstimate();
  };

  const handleMapLocationChange = (value: MapCoordinates | null) => {
    setSelectedMapLocation(value);
    resetTransportEstimate();
  };

  const handlePlaceOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    if (!trimmedPhone || phoneDigits.length < 9) {
      toast({
        title: "Enter a valid phone number",
        description: "Phone number is required at checkout so we can confirm payment and delivery.",
        variant: "destructive",
      });
      return;
    }

    if (!hasDeliveryDetails) {
      toast({
        title: "Complete delivery details",
        description: "Address, city, and key location details are required before you place the order.",
        variant: "destructive",
      });
      return;
    }

    let resolvedTransportFare = transportFare;
    if (resolvedTransportFare === null) {
      resolvedTransportFare = await calculateTransportEstimate();
      if (resolvedTransportFare === null) return;
    }

    setSubmitting(true);

    try {
      const finalTotal = Math.max(0, totalPrice + resolvedTransportFare - couponDiscount);
      const shippingAddress = [
        trimmedAddress,
        `Key location details: ${trimmedLocationDetails}`,
        selectedMapLocation ? `Map pin: ${formatCoordinatePair(selectedMapLocation)}` : null,
      ]
        .filter(Boolean)
        .join(" | ");
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total: finalTotal,
          payment_method: paymentMethod,
          shipping_address: shippingAddress,
          shipping_city: trimmedCity,
          phone: trimmedPhone,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      // Increment coupon usage
      if (appliedCoupon) {
        const { data: promo } = await supabase
          .from("promotions")
          .select("current_uses")
          .eq("code", appliedCoupon)
          .maybeSingle();
        if (promo) {
          await supabase
            .from("promotions")
            .update({ current_uses: (promo.current_uses ?? 0) + 1 } as any)
            .eq("code", appliedCoupon);
        }
      }

      clearCart();
      toast({ title: "Order placed", description: `Order #${order.id.slice(0, 8)} has been confirmed.` });
      navigate("/orders");
    } catch (error) {
      toast({ title: "Order failed", description: getErrorMessage(error, "Please try again in a moment."), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const paymentLabels: Record<string, string> = {
    card: "Visa or Mastercard",
    mobile_money: "Mobile money",
    cash_on_delivery: "Cash on delivery",
  };

  return (
    <div className="container min-h-screen py-8">
      <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to cart
      </Link>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-border/70 bg-secondary px-7 py-8 text-secondary-foreground shadow-[0_30px_100px_-58px_rgba(15,23,42,0.7)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Checkout</p>
          <h1 className="mt-4 font-display text-5xl font-bold md:text-6xl">Finish your order with a cleaner final step.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-secondary-foreground/74">
            Delivery details, transport, payment choice, and final order review all live here so you can complete the
            purchase with confidence.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Items", value: String(itemCount) },
              { label: "Payment options", value: "3 methods" },
              { label: "Order total", value: formatPrice(grandTotal) },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-secondary-foreground/55">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
          {[
            { icon: Truck, title: "Delivery ready", copy: "Use the transport calculator for a distance-based estimate outside your normal Kabale route." },
            { icon: ShieldCheck, title: "Protected order", copy: "Order details are saved directly to your account history after placement." },
            { icon: Wallet, title: "Payment flexibility", copy: "Choose the method that fits how you prefer to pay today." },
          ].map(({ icon: Icon, title, copy }) => (
            <div key={title} className="rounded-[1.7rem] border border-border/70 bg-card/95 p-5 shadow-[0_20px_70px_-52px_rgba(15,23,42,0.42)]">
              <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-[0_24px_90px_-56px_rgba(15,23,42,0.45)]">
            <h2 className="font-display text-3xl font-bold text-foreground">Delivery details</h2>
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Address</label>
                <input type="text" value={address} onChange={(event) => { setAddress(event.target.value); resetTransportEstimate(); }} required placeholder="Street, area, or nearby landmark" className="h-12 w-full rounded-[1rem] border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Key location details</label>
                <textarea
                  value={locationDetails}
                  onChange={(event) => { setLocationDetails(event.target.value); resetTransportEstimate(); }}
                  required
                  rows={3}
                  placeholder="Nearest stage, building name, shop number, apartment, gate color, or another detail that helps us find you."
                  className="w-full rounded-[1rem] border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  This field is required and helps make the delivery location and transport estimate more accurate.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">City</label>
                  <input type="text" value={city} onChange={(event) => { setCity(event.target.value); resetTransportEstimate(); }} required placeholder="City" className="h-12 w-full rounded-[1rem] border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-foreground">Phone number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    pattern="^\+?[0-9\s()-]{9,}$"
                    title="Enter a valid phone number"
                    placeholder="+256..."
                    className="h-12 w-full rounded-[1rem] border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    This field is required so we can reach you quickly about payment and delivery.
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-[1.35rem] border border-border/70 bg-background/70 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Map location</p>
                    <p className="mt-2 text-sm text-muted-foreground">Add a map pin if you want the most accurate distance and transport fee from the selected location.</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <LocationMapPicker value={selectedMapLocation} onChange={handleMapLocationChange} />
                    {selectedMapLocation ? (
                      <button type="button" onClick={() => handleMapLocationChange(null)} className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] border border-border bg-background px-5 text-sm font-semibold text-muted-foreground transition hover:border-destructive/40 hover:text-destructive">
                        <X className="h-4 w-4" />Clear pin
                      </button>
                    ) : null}
                  </div>
                </div>
                {selectedMapLocation ? (
                  <div className="mt-4 rounded-[1rem] border border-primary/20 bg-primary/5 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Selected pin</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{formatCoordinatePair(selectedMapLocation)}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-[0_24px_90px_-56px_rgba(15,23,42,0.45)]">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <h2 className="font-display text-3xl font-bold text-foreground">Transport estimate</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Rate: {formatPrice(TRANSPORT_RATE_PER_KM)} per km from your {transportOriginLabel} to Dubai Shopping Centre, Kabale. Add a map pin if you want the most accurate distance.
            </p>
            <div className="mt-5 rounded-[1.4rem] border border-border/70 bg-background/80 p-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Delivery route</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {deliveryRouteLabel || "Add your address, city, and key location details above or pick a map pin to calculate transport."}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {selectedMapLocation ? "Transport will be calculated from the selected map location for the most accurate distance." : "For the most accurate distance, add a map pin. Otherwise we will use your typed delivery details."}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={handleCalculateTransport} disabled={calculatingFare || !hasTransportOrigin} className="inline-flex h-12 items-center justify-center rounded-[1rem] bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
                {calculatingFare ? <Loader2 className="h-4 w-4 animate-spin" /> : "Calculate transport"}
              </button>
              {transportFare === null ? (
                <p className="text-sm text-muted-foreground">We'll add transport to the final total after calculation.</p>
              ) : null}
            </div>
            {transportFare !== null ? (
              <div className="mt-5 rounded-[1.4rem] border border-primary/20 bg-primary/5 p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Distance</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{transportDistance}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Travel time</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{transportDuration}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Transport fee</p>
                    <p className="mt-2 text-sm font-semibold text-primary">{formatPrice(transportFare)}</p>
                  </div>
                </div>
                {transportNote ? <p className="mt-4 text-xs leading-5 text-muted-foreground">{transportNote}</p> : null}
              </div>
            ) : null}
          </div>

          {/* Coupon Code Section */}
          <div className="rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-[0_24px_90px_-56px_rgba(15,23,42,0.45)]">
            <div className="flex items-center gap-2">
              <TicketPercent className="h-5 w-5 text-primary" />
              <h2 className="font-display text-3xl font-bold text-foreground">Coupon code</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Have a promo code? Enter it below to get a discount on your order.
            </p>
            {appliedCoupon ? (
              <div className="mt-4 rounded-[1.4rem] border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Applied coupon</p>
                    <p className="mt-2 text-sm font-semibold text-foreground font-mono">{appliedCoupon}</p>
                    <p className="mt-1 text-sm text-primary font-semibold">-{formatPrice(couponDiscount)}</p>
                  </div>
                  <button type="button" onClick={handleRemoveCoupon} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/40 transition">
                    <X className="h-3 w-3" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex gap-3">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter code e.g. SAVE20"
                  className="h-12 flex-1 rounded-[1rem] border border-border bg-background px-4 text-sm text-foreground font-mono outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button type="button" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} className="inline-flex h-12 items-center justify-center rounded-[1rem] bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
                  {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-[0_24px_90px_-56px_rgba(15,23,42,0.45)]">
            <h2 className="font-display text-3xl font-bold text-foreground">Payment method</h2>
            <div className="mt-6 space-y-3">
              {(["mobile_money", "card", "cash_on_delivery"] as const).map((method) => (
                <label
                  key={method}
                  className={`flex cursor-pointer items-center justify-between gap-4 rounded-[1.2rem] border px-4 py-4 transition ${
                    paymentMethod === method ? "border-primary bg-primary/5" : "border-border bg-background"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{paymentLabels[method]}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {method === "mobile_money" ? "Quick confirmation using your phone." : method === "card" ? "Secure card entry during order placement." : "Pay when your order arrives."}
                    </p>
                  </div>
                  <input type="radio" name="payment" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} className="h-4 w-4 accent-primary" />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="h-fit rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-[0_24px_90px_-56px_rgba(15,23,42,0.45)] lg:sticky lg:top-28">
          <h2 className="font-display text-3xl font-bold text-foreground">Order summary</h2>
          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="font-semibold text-foreground">{item.product.name}</p>
                  <p className="mt-1 text-muted-foreground">{item.quantity} x {formatPrice(item.product.price)}</p>
                </div>
                <span className="font-semibold text-foreground">{formatPrice(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>Transport</span>
              <span>{transportFare !== null ? formatPrice(transportFare) : hasTransportOrigin ? "Ready to calculate" : "Add address or pin first"}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="mt-3 flex items-center justify-between text-sm text-primary font-semibold">
                <span>Coupon ({appliedCoupon})</span>
                <span>-{formatPrice(couponDiscount)}</span>
              </div>
            )}
            <div className="mt-3 flex items-center justify-between text-lg font-bold text-foreground">
              <span>Total</span>
              <span>{formatPrice(grandTotal)}</span>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="mt-6 inline-flex w-full items-center justify-center rounded-[1rem] bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
            {submitting ? "Placing order..." : "Place order"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
