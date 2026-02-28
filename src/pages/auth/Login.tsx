import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { getSelectedRole } from "@/auth/role-state";
import GoogleLoginButton from "@/auth/GoogleLoginButton";

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuth = async () => {
      // This processes the OAuth hash in the URL
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error(error);
        return;
      }

      if (data?.session) {
        const role = getSelectedRole();

        if (role === "client") navigate("/client", { replace: true });
        else if (role === "supplier") navigate("/supplier", { replace: true });
        else if (role === "admin") navigate("/admin", { replace: true });
        else navigate("/", { replace: true });
      }
    };

    handleOAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <GoogleLoginButton />
    </div>
  );
}
