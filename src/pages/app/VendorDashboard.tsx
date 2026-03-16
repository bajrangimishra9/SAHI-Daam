import AppLayout from "@/components/app/AppLayout";
import ClientComparison from "@/components/client/ClientComparison";
import { Outlet, useLocation } from "react-router-dom";

export default function VendorDashboard() {
  const location = useLocation();
  const isClientHome = location.pathname === "/client";

  return (
    <AppLayout role="client" title="Client Dashboard">
      {isClientHome ? <ClientComparison /> : <Outlet />}
    </AppLayout>
  );
}