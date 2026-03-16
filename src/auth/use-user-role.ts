import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/lib/roles";
import { useQuery } from "@tanstack/react-query";

export function useUserRoles(userId?: string) {
  return useQuery({
    queryKey: ["auth", "roles", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });
}

export function useRoleRequestStatus(userId?: string) {
  return useQuery({
    queryKey: ["auth", "role-request", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("role_requests").select("status,requested_role").eq("user_id", userId!).maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });
}

export function pickPrimaryRole(roles: AppRole[]): AppRole {
  // deterministic priority
  if (roles.includes("admin")) return "admin";
  if (roles.includes("supplier")) return "supplier";
  return "client";
}
