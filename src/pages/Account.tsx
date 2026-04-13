import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AuthFormCard from "@/components/AuthFormCard";
import { User, ShoppingBag, LogOut, Shield, Heart, Save, Loader2, MapPin, Phone, Mail } from "lucide-react";

interface Profile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
}

const Account = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>({ full_name: null, email: null, phone: null, address: null, city: null });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, email, phone, address, city")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data);
        else setProfile((p) => ({ ...p, email: user.email || null }));
        setLoaded(true);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ user_id: user.id, ...profile, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (error) throw error;
      toast({ title: "Profile updated", description: "Your details have been saved." });
    } catch {
      toast({ title: "Save failed", description: "Could not update profile.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto min-h-screen px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <div className="rounded-[2rem] border border-border/70 bg-card/95 p-8 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.42)]">
            <div className="inline-flex rounded-2xl bg-primary/10 p-4 text-primary">
              <User className="h-8 w-8" />
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold text-foreground">Your account</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
              Sign in or create an account to track orders, manage your profile, and access your dashboard.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { title: "Orders", copy: "See current and previous purchases." },
                { title: "Profile", copy: "Keep your details up to date." },
                { title: "Wishlist", copy: "Save products for later." },
              ].map((item) => (
                <div key={item.title} className="rounded-[1.5rem] border border-border/70 bg-background/70 p-4">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
          <AuthFormCard
            onSignedIn={(signedInAsAdmin) => {
              if (signedInAsAdmin) navigate("/admin", { replace: true });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto min-h-screen max-w-5xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {/* Profile hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-border/70 bg-secondary px-7 py-8 text-secondary-foreground shadow-[0_30px_100px_-58px_rgba(15,23,42,0.7)]"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-primary">
                <User className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">{profile.full_name || user.email}</p>
                <p className="text-sm text-secondary-foreground/72">
                  Member since {new Date(user.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                </p>
                {isAdmin && (
                  <span className="mt-1 inline-flex rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Profile form */}
          {loaded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.42)]"
            >
              <h2 className="font-display text-3xl font-bold text-foreground">Edit profile</h2>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <User className="h-3.5 w-3.5 text-primary" /> Full name
                  </label>
                  <input
                    type="text"
                    value={profile.full_name || ""}
                    onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))}
                    placeholder="Your full name"
                    className="h-12 w-full rounded-[1rem] border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Mail className="h-3.5 w-3.5 text-primary" /> Email
                  </label>
                  <input
                    type="email"
                    value={profile.email || ""}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    placeholder="Email address"
                    className="h-12 w-full rounded-[1rem] border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Phone className="h-3.5 w-3.5 text-primary" /> Phone
                    </label>
                    <input
                      type="tel"
                      value={profile.phone || ""}
                      onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+256..."
                      className="h-12 w-full rounded-[1rem] border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> City
                    </label>
                    <input
                      type="text"
                      value={profile.city || ""}
                      onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                      placeholder="City"
                      className="h-12 w-full rounded-[1rem] border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> Address
                  </label>
                  <input
                    type="text"
                    value={profile.address || ""}
                    onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Street or area"
                    className="h-12 w-full rounded-[1rem] border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-[1rem] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save changes
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Quick actions sidebar */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.42)]"
          >
            <h2 className="font-display text-2xl font-bold text-foreground">Quick actions</h2>
            <div className="mt-5 space-y-2">
              <Link
                to="/orders"
                className="flex items-center gap-3 rounded-[1.2rem] border border-border/70 bg-background px-4 py-4 text-sm font-medium text-foreground transition hover:border-primary/40"
              >
                <ShoppingBag className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">My Orders</p>
                  <p className="text-xs text-muted-foreground">Track purchases and delivery</p>
                </div>
              </Link>
              <Link
                to="/wishlist"
                className="flex items-center gap-3 rounded-[1.2rem] border border-border/70 bg-background px-4 py-4 text-sm font-medium text-foreground transition hover:border-primary/40"
              >
                <Heart className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Wishlist</p>
                  <p className="text-xs text-muted-foreground">Products saved for later</p>
                </div>
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-3 rounded-[1.2rem] border border-primary/20 bg-primary/5 px-4 py-4 text-sm font-medium text-foreground transition hover:border-primary/40"
                >
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-primary">Admin Dashboard</p>
                    <p className="text-xs text-muted-foreground">Manage products, orders & more</p>
                  </div>
                </Link>
              )}
            </div>
          </motion.div>

          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-[1.2rem] border border-border/70 bg-card/95 px-4 py-4 text-sm font-medium text-destructive transition hover:border-destructive/40 hover:bg-destructive/5"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Account;
