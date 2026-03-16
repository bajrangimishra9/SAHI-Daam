import { useUser } from "@/hooks/useUser";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: any) {
  const user = useUser();

  // If auth still loading
  if (user === undefined) return null;

  // If not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
