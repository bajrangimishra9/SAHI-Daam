import AppLayout from "@/components/app/AppLayout";
import { Card } from "@/components/ui/card";
import { loadDemoStore } from "@/demo/store";

export default function ClientOrders() {

  const store: any = loadDemoStore();
  const orders = store.client?.orders ?? [];

  return (
    <AppLayout role="client" title="Orders">

      <div className="space-y-6">

        {orders.length === 0 && (
          <Card className="p-6">
            No orders yet.
          </Card>
        )}

        {orders.map((o: any) => (
          <Card key={o.id} className="p-6 space-y-4">

            {/* Header */}
            <div className="flex justify-between items-start">

              <div>
                <p className="text-sm text-muted-foreground">
                  Order ID: {o.id}
                </p>

                <p className="text-sm text-muted-foreground">
                  Ordered on {new Date(o.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="text-right">
                <p className="font-semibold">
                  ₹ {Math.round(o.total ?? 0).toLocaleString()}
                </p>

                <p className="text-xs text-muted-foreground">
                  {o.paymentMethod}
                </p>
              </div>

            </div>


            {/* Materials */}
            {o.lines && (
              <div className="space-y-3 border-t pt-4">

                {o.lines.map((m: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start">

                    <div>

                      <p className="font-medium">
                        {m.materialName}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Supplier: {m.supplierName}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Qty: {m.qty} {m.unit}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        ETA: {m.eta}
                      </p>

                    </div>

                    <p className="font-semibold">
                      ₹ {Math.round(m.totalLandedCost ?? 0).toLocaleString()}
                    </p>

                  </div>
                ))}

              </div>
            )}

          </Card>
        ))}

      </div>

    </AppLayout>
  );
}