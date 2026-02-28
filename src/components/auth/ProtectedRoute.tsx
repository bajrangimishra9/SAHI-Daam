import { useSession } from "@/auth/session";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/lib/roles";
import { useQuery } from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router-dom";

async function fetchRoles(userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.role as AppRole);
}

async function fetchRoleRequestStatus(userId: string) {
  const { data, error } = await supabase
    .from("role_requests")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.status ?? null;
}

export default function ProtectedRoute({ role, children }: { role: AppRole; children: React.ReactNode }) {
  const { user, loading } = useSession();
  const location = useLocation();

  const rolesQuery = useQuery({
    queryKey: ["auth", "roles", user?.id],
    enabled: !!user?.id,
    queryFn: () => fetchRoles(user!.id),
  });

  const roleReqQuery = useQuery({
    queryKey: ["auth", "role-request", user?.id],
    enabled: !!user?.id,
    queryFn: () => fetchRoleRequestStatus(user!.id),
  });

  if (loading) return null;
  if (!user) return <Navigate to="/auth/role" replace state={{ from: location.pathname }} />;

  if (rolesQuery.isLoading || roleReqQuery.isLoading) return null;
  if (rolesQuery.isError || roleReqQuery.isError) return <Navigate to="/auth/role" replace />;

  const roles = rolesQuery.data ?? [];
  const has = roles.includes(role);
  if (has) return <>{children}</>;

  // If they don't have the role yet, they are pending approval.
  if (roleReqQuery.data === "pending") return <Navigate to="/auth/pending" replace />;

  return <Navigate to="/auth/role" replace />;
}
