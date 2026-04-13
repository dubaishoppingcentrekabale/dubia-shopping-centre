import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Headphones, Heart, Menu, Search, Shield, ShoppingCart, Sparkles, User, X } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import logo from "@/assets/logo.png";

const navItems = [
  { label: "Home", to: "/", end: true },
  { label: "Categories", to: "/categories" },
  { label: "Deals", to: "/deals" },
  { label: "Orders", to: "/orders" },
];

const Header = () => {
  const { totalItems } = useCart();
  const { isAdmin } = useAuth();
  const { wishlistCount } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get("q") || "");
  }, [location.search]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchQuery.trim()) {
      navigate("/search");
      return;
    }
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const accountTarget = isAdmin ? "/admin" : "/account";

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="bg-secondary text-secondary-foreground">
        <div className="container flex min-h-10 flex-wrap items-center justify-between gap-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Local delivery in Kabale and nearby areas, with transport confirmed at checkout</span>
          </div>
          <div className="hidden items-center gap-4 text-secondary-foreground/70 md:flex">
            <span>Open daily 8am to 8pm</span>
            <span>Warranty-backed electronics</span>
          </div>
        </div>
      </div>

      <div className="container py-4">
        <div className="flex items-center gap-3 lg:gap-6">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-3 rounded-[1.5rem] border border-border/80 bg-card/90 px-4 py-2 shadow-sm transition-colors hover:border-primary/40"
          >
            <img src={logo} alt="Dubai Shopping Centre" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-primary">Kabale electronics</p>
              <p className="truncate font-display text-lg font-bold text-foreground">Dubai Shopping Centre</p>
            </div>
          </Link>

          <form onSubmit={handleSearch} className="hidden flex-1 md:block">
            <div className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search phones, laptops, gaming, and accessories"
                className="h-14 w-full rounded-[1.25rem] border border-border/80 bg-card/90 pl-5 pr-14 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90"
                aria-label="Search store"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/wishlist"
              className="relative hidden items-center gap-2 rounded-[1.1rem] border border-border/80 bg-card/90 px-3 py-3 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/40 sm:flex"
            >
              <Heart className="h-4 w-4 text-primary" />
              {wishlistCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to={accountTarget}
              className="hidden items-center gap-2 rounded-[1.1rem] border border-border/80 bg-card/90 px-4 py-3 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/40 sm:flex"
            >
              {isAdmin ? <Shield className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-primary" />}
              <span>{isAdmin ? "Admin" : "Account"}</span>
            </Link>

            <Link
              to="/cart"
              className="inline-flex items-center gap-2 rounded-[1.1rem] border border-border/80 bg-card/90 px-3 py-3 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/40 sm:px-4"
            >
              <div className="relative">
                <ShoppingCart className="h-4 w-4 text-primary" />
                {totalItems > 0 ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-2 -top-2 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
                  >
                    {totalItems}
                  </motion.span>
                ) : null}
              </div>
              <span className="hidden sm:inline">Cart</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-[1.1rem] border border-border/80 bg-card/90 text-foreground shadow-sm transition hover:border-primary/40 md:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mt-4 md:hidden">
          <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search products and deals"
              className="h-12 w-full rounded-[1.1rem] border border-border/80 bg-card/90 pl-4 pr-12 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"
              aria-label="Search store"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="mt-4 hidden items-center justify-between gap-6 lg:flex">
          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-card hover:text-foreground"
                activeClassName="bg-secondary text-secondary-foreground shadow-sm"
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 rounded-full border border-border/80 bg-card/90 px-4 py-2 text-sm text-muted-foreground shadow-sm">
            <Headphones className="h-4 w-4 text-primary" />
            <span>Call or WhatsApp +256 706 643297 for assisted shopping</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/70 bg-card/95 md:hidden"
          >
            <div className="container space-y-4 py-4">
              <nav className="grid gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className="rounded-2xl border border-border/70 px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-background"
                    activeClassName="border-primary/40 bg-primary/10 text-primary"
                  >
                    {item.label}
                  </NavLink>
                ))}
                <NavLink
                  to={accountTarget}
                  className="rounded-2xl border border-border/70 px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-background"
                  activeClassName="border-primary/40 bg-primary/10 text-primary"
                >
                  {isAdmin ? "Admin dashboard" : "My account"}
                </NavLink>
              </nav>

              <div className="rounded-[1.5rem] bg-secondary px-4 py-4 text-secondary-foreground">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Store support</p>
                <p className="mt-2 text-sm text-secondary-foreground/80">
                  Need help choosing the right device? We can guide you on delivery, warranty, and stock availability.
                </p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
};

export default Header;
