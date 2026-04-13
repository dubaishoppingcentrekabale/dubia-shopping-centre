import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

type RecoveryStatus = "loading" | "ready" | "invalid";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword, isAdmin } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<RecoveryStatus>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasRecoveryHash = useMemo(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const searchParams = new URLSearchParams(window.location.search);
    return (
      hashParams.get("type") === "recovery" ||
      hashParams.has("access_token") ||
      searchParams.get("mode") === "recovery"
    );
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkRecoverySession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (session && hasRecoveryHash) {
        setStatus("ready");
      } else if (!hasRecoveryHash) {
        setStatus("invalid");
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" || (hasRecoveryHash && !!session)) {
        setStatus("ready");
      }
    });

    void checkRecoverySession();

    const invalidTimer = window.setTimeout(() => {
      if (isMounted) {
        setStatus((currentStatus) => (currentStatus === "loading" ? "invalid" : currentStatus));
      }
    }, 4000);

    return () => {
      isMounted = false;
      window.clearTimeout(invalidTimer);
      subscription.unsubscribe();
    };
  }, [hasRecoveryHash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    setSaving(true);

    const { error } = await updatePassword(password);

    if (error) {
      toast({ title: "Password reset failed", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    toast({ title: "Password updated", description: "You can now continue with your account." });
    navigate(isAdmin ? "/admin" : "/account", { replace: true });
    setSaving(false);
  };

  return (
    <div className="container mx-auto flex min-h-screen max-w-xl items-center justify-center px-4 py-12">
      <div className="w-full rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
        <Link to="/account" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to account
        </Link>

        <div className="mt-6 text-center">
          <div className="mx-auto inline-flex rounded-2xl bg-primary/10 p-4 text-primary">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-3xl font-display font-bold text-foreground">Reset Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a new password for your account.
          </p>
        </div>

        {status === "loading" && (
          <div className="mt-8 rounded-2xl border border-border bg-background/70 p-5 text-center text-sm text-muted-foreground">
            Preparing your recovery session...
          </div>
        )}

        {status === "invalid" && (
          <div className="mt-8 space-y-4 rounded-2xl border border-border bg-background/70 p-5 text-center">
            <p className="text-sm text-muted-foreground">
              This password reset link is missing, expired, or no longer valid.
            </p>
            <Link
              to="/account"
              className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Request a new reset link
            </Link>
          </div>
        )}

        {status === "ready" && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card p-3 pr-10 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card p-3 pr-10 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Updating password..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
