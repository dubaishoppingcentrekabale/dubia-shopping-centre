import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AuthFormCard from "@/components/AuthFormCard";
import logo from "@/assets/logo.png";

const AuthPage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate(isAdmin ? "/admin" : "/account", { replace: true });
    }
  }, [authLoading, isAdmin, navigate, user]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-background">
      <AuthFormCard
        showBackLink
        onSignedIn={(signedInAsAdmin) => {
          navigate(signedInAsAdmin ? "/admin" : "/account", { replace: true });
        }}
      />
    </div>
  );
};

export default AuthPage;
