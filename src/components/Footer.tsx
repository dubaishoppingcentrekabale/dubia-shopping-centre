import { Link } from "react-router-dom";
import { Clock3, MapPin, PhoneCall, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => (
  <footer className="mt-20 border-t border-border/70 bg-secondary text-secondary-foreground">
    <div className="container py-12">
      <div className="grid gap-10 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="Dubai Shopping Centre" className="h-12 w-auto" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">Dubai Shopping Centre</p>
                <p className="text-xs text-secondary-foreground/60">Kabale, Uganda</p>
              </div>
            </div>
            <h2 className="mt-3 max-w-xl font-display text-4xl font-bold">
              Electronics with reliable stock, practical support, and fast local delivery.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-secondary-foreground/72">
              We help shoppers in Kabale find phones, laptops, home entertainment, and everyday accessories without the
              guesswork. The catalog is built for quick comparison, simple checkout, and trusted after-sales support.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-secondary-foreground/10 bg-white/5 p-4">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-semibold">Warranty-backed catalog</p>
              <p className="mt-2 text-sm text-secondary-foreground/68">Shop devices backed by clear product support.</p>
            </div>
            <div className="rounded-[1.5rem] border border-secondary-foreground/10 bg-white/5 p-4">
              <Clock3 className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-semibold">Fast local fulfillment</p>
              <p className="mt-2 text-sm text-secondary-foreground/68">
                Transport is calculated at checkout based on your delivery location.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-secondary-foreground/10 bg-white/5 p-4">
              <PhoneCall className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-semibold">Assisted shopping</p>
              <p className="mt-2 text-sm text-secondary-foreground/68">
                Reach out for recommendations before you commit.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary-foreground/60">Shop</h3>
            <div className="mt-4 grid gap-3 text-sm text-secondary-foreground/74">
              <Link to="/" className="transition hover:text-primary">
                New arrivals
              </Link>
              <Link to="/deals" className="transition hover:text-primary">
                Flash sale
              </Link>
              <Link to="/categories" className="transition hover:text-primary">
                Browse categories
              </Link>
              <Link to="/cart" className="transition hover:text-primary">
                Cart
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary-foreground/60">Account</h3>
            <div className="mt-4 grid gap-3 text-sm text-secondary-foreground/74">
              <Link to="/account" className="transition hover:text-primary">
                My account
              </Link>
              <Link to="/orders" className="transition hover:text-primary">
                Orders
              </Link>
              <Link to="/auth" className="transition hover:text-primary">
                Sign in
              </Link>
            </div>
          </div>

          <div className="sm:col-span-2 rounded-[1.75rem] border border-secondary-foreground/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-secondary-foreground/60">Visit or contact</h3>
            <div className="mt-4 space-y-3 text-sm text-secondary-foreground/78">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <span>Kabale, Uganda</span>
              </div>
              <div className="flex items-start gap-3">
                <PhoneCall className="mt-0.5 h-4 w-4 text-primary" />
                <span>+256 706 643297</span>
              </div>
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 text-primary" />
                <span>Open daily, 8am to 8pm</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-3 border-t border-secondary-foreground/10 pt-6 text-xs text-secondary-foreground/48 md:flex-row md:items-center md:justify-between">
        <p>&copy; {new Date().getFullYear()} Dubai Shopping Centre. Built for local electronics shoppers in Kabale.</p>
        <p>Reliable stock information, practical deals, and a cleaner buying experience.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
