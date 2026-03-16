import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";

const roleHierarchy: Record<string, number> = {
  client: 1,
  supplier: 2,
  admin: 3,
};

export default function ProtectedRoleRoute({
  children,
  allowedRole,
}: {
  children: React.ReactNode;
  allowedRole: string;
}) {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // Wait for session restoration
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentUser = session?.user;

      if (!currentUser) {
        setLoading(false);
        return;
      }

      setUser(currentUser);

      const { data } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", currentUser.id)
        .single();

      setRole(data?.role ?? null);
      setLoading(false);
    };

    init();
  }, []);

  if (loading) return null;

  if (!user) return <Navigate to="/" replace />;

  if (!role) return <Navigate to="/" replace />;

  if (roleHierarchy[role] < roleHierarchy[allowedRole]) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
