import AppLayout from "@/components/app/AppLayout";
import { supabase } from "@/supabaseClient";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

export default function SupplierOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) return;

    // get supplier profile
    const { data: supplier } = await supabase
      .from("suppliers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!supplier) return;

    // fetch orders
    const { data, error } = await supabase
      .from("orders")
      .select(`
      *,
      order_items (*)
    `)
      .eq("supplier_id", supplier.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setOrders(data || []);
  }

  return (
    <AppLayout role="supplier" title="Orders">
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-bold">Supplier Orders</h2>

        {loading && <p>Loading orders...</p>}

        {!loading && orders.length === 0 && (
          <p className="text-muted-foreground">
            No orders received yet.
          </p>
        )}

        {orders.map((order) => (
          <Card key={order.id} className="p-4 space-y-3">
            <div className="flex justify-between">
              <p className="font-semibold">Order ID: {order.id}</p>
              <p>₹ {order.grand_total}</p>
            </div>

            <p className="text-sm text-muted-foreground">
              Delivery: {order.delivery_address}
            </p>

            {order.order_items?.map((item: any) => (
              <div key={item.id} className="border-t pt-2">
                <p>{item.material_name}</p>
                <p className="text-sm text-muted-foreground">
                  Qty: {item.qty} {item.unit}
                </p>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}