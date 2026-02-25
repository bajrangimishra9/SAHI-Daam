import { AppRole, roleToDashboardPath } from "@/lib/roles";
import { getSelectedRole } from "@/auth/role-state";
import { Navigate, useLocation } from "react-router-dom";

export default function DemoRoleRoute({ role, children }: { role: AppRole; children: React.ReactNode }) {
  const location = useLocation();
  const selected = getSelectedRole();
  if (!selected) return <Navigate to="/auth/role" replace state={{ from: location.pathname }} />;
  if (selected !== role) return <Navigate to={roleToDashboardPath(selected)} replace />;
  return <>{children}</>;
}
