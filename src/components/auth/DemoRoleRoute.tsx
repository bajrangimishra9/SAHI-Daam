import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

type RoleType = "admin" | "client" | "supplier";

export default function DemoRoleRoute({
  role: requiredRole,
  children,
}: {
  role: RoleType;
  children: React.ReactNode;
}) {
  const { user, role, loading } = useAuth();

  // Wait until auth resolves
  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Admin protection
  if (requiredRole === "admin" && role !== "admin") {
    return <Navigate to="/auth/role" replace />;
  }

  // Client & Supplier are allowed for all logged-in users
  return <>{children}</>;
}