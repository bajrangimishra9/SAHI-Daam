import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { getSelectedRole } from "@/auth/role-state";
import GoogleLoginButton from "@/auth/GoogleLoginButton";
import PublicHeader from "@/components/layout/PublicHeader";

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const role = getSelectedRole();

        if (role === "client") navigate("/client", { replace: true });
        else if (role === "supplier") navigate("/supplier", { replace: true });
        else if (role === "admin") navigate("/admin", { replace: true });
        else navigate("/", { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-hero">
      <PublicHeader />
      <div className="flex min-h-[70vh] items-center justify-center">
        <GoogleLoginButton />
      </div>
    </div>
  );
}
