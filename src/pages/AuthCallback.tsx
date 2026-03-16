import { useEffect } from "react";
import { supabase } from "@/lib/supabase"; 

export default function AuthCallback() {
  useEffect(() => {
    const handleRedirect = async () => {
      // Get logged in user
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.replace("/");
        return;
      }

      // Fetch profile role
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (error || !profile) {
        window.location.replace("/");
        return;
      }

      // Redirect based on role
      if (profile.role === "admin") {
        window.location.replace("/admin");
      } else {
        window.location.replace("/auth/role");
      }
    };

    handleRedirect();
  }, []);

  return <div className="p-6">Signing you in...</div>;
}