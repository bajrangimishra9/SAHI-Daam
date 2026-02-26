import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useUser } from "@/hooks/useUser";

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
  const user = useUser();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setRole(data?.role ?? null);
      setLoading(false);
    };

    checkRole();
  }, [user]);

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  if (!role) return <Navigate to="/" replace />;

  if (roleHierarchy[role] < roleHierarchy[allowedRole]) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
