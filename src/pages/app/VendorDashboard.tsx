import AppLayout from "@/components/app/AppLayout";
import ClientComparison from "@/components/client/ClientComparison";

export default function VendorDashboard() {
  return (
    <AppLayout role="client" title="Client Dashboard">
      <ClientComparison />
    </AppLayout>
  );
}
