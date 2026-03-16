import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function RequireAuth({
  children,
}: {
  children: JSX.Element;
}) {
  const { user, loading } = useAuth();

  // Wait until auth is resolved
  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  // If not logged in → redirect to home
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}