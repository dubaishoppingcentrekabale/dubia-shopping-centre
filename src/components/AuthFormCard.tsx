import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable/index";
import { getErrorMessage } from "@/lib/errors";
import logo from "@/assets/logo.png";

interface AuthFormCardProps {
  onSignedIn?: (isAdmin: boolean) => void;
  showBackLink?: boolean;
}

type AuthView = "login" | "signup" | "forgot";

const AuthFormCard = ({ onSignedIn, showBackLink = false }: AuthFormCardProps) => {
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signUp, requestPasswordReset } = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast({ title: "Google sign-in failed", description: result.error.message, variant: "destructive" });
      }
    } catch (error) {
      toast({
        title: "Google sign-in failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const isLogin = view === "login";
  const isForgotPassword = view === "forgot";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isForgotPassword) {
      const { error } = await requestPasswordReset(email);

      if (error) {
        toast({ title: "Reset email failed", description: error.message, variant: "destructive" });
      } else {
        toast({
          title: "Reset email sent",
          description: "Check your inbox for the password reset link.",
        });
        setView("login");
      }

      setLoading(false);
      return;
    }

    if (isLogin) {
      const { error, isAdmin } = await signIn(email, password);

      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: isAdmin ? "Admin access granted" : "Welcome back!" });
        onSignedIn?.(isAdmin);
      }
    } else {
      if (!fullName.trim()) {
        toast({ title: "Please enter your full name", variant: "destructive" });
        setLoading(false);
        return;
      }

      const { error } = await signUp(email, password, fullName);

      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Account created!", description: "Please check your email to verify your account." });
        setView("login");
      }
    }

    setLoading(false);
  };

  const title =
    view === "login" ? "Welcome Back" : view === "signup" ? "Create Account" : "Forgot Password";
  const subtitle =
    view === "login"
      ? "Sign in to your Dubai Shopping Centre account."
      : view === "signup"
        ? "Join Dubai Shopping Centre to shop faster and track purchases."
        : "Enter your email and we will send you a password reset link.";

  return (
    <div className="w-full max-w-md space-y-6 rounded-[2rem] border border-border/70 bg-card/95 p-6 shadow-[0_22px_80px_-56px_rgba(15,23,42,0.42)] md:p-8">
      {showBackLink && (
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to shopping
        </Link>
      )}

      <div className="flex flex-col items-center text-center">
        <img src={logo} alt="Dubai Shopping Centre" className="h-16 w-auto mb-3" />
        <h1 className="text-3xl font-display font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {view === "signup" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-border bg-card p-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Enter your full name"
              required
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-card p-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="you@example.com"
            required
          />
        </div>

        {!isForgotPassword && (
          <div>
            <div className="mb-1 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-foreground">Password</label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => setView("forgot")}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-card p-3 pr-10 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Enter password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading
            ? "Please wait..."
            : view === "login"
              ? "Sign In"
              : view === "signup"
                ? "Create Account"
                : "Send Reset Link"}
        </button>
      </form>

      {!isForgotPassword && (
        <>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">Or continue with</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-border bg-background py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </button>
        </>
      )}

      <div className="text-center text-sm text-muted-foreground">
        {view === "login" && (
          <p>
            Don't have an account?{" "}
            <button onClick={() => setView("signup")} className="font-medium text-primary hover:underline">
              Sign up
            </button>
          </p>
        )}

        {view === "signup" && (
          <p>
            Already have an account?{" "}
            <button onClick={() => setView("login")} className="font-medium text-primary hover:underline">
              Sign in
            </button>
          </p>
        )}

        {view === "forgot" && (
          <p>
            Remembered your password?{" "}
            <button onClick={() => setView("login")} className="font-medium text-primary hover:underline">
              Back to sign in
            </button>
          </p>
        )}
      </div>

      <p className="text-center text-[11px] text-muted-foreground/60">
        Dubai Shopping Centre &middot; Kabale, Uganda
      </p>
    </div>
  );
};

export default AuthFormCard;
