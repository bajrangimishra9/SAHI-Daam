import { useEffect, useState } from "react";
import AppLayout from "@/components/app/AppLayout";
import { Card } from "@/components/ui/card";
import { supabase } from "@/supabaseClient";

export default function OrdersPage() {

  const [orders,setOrders] = useState<any[]>([]);

  useEffect(()=>{
    loadOrders();
  },[]);

  const loadOrders = async () => {

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if(!user) return;

    const { data: supplier } = await supabase
      .from("suppliers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if(!supplier) return;

    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (*)
      `)
      .eq("supplier_id", supplier.id)
      .order("created_at",{ascending:false});

    setOrders(data || []);
  };

  return (
    <AppLayout role="supplier" title="Orders">

      <div className="space-y-6">

        {orders.map(order => (

          <Card key={order.id} className="p-6">

            <div className="flex justify-between mb-3">
              <div>
                <p className="text-sm">Order ID: {order.id}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="text-right">
                <p className="font-semibold">₹ {order.grand_total}</p>
                <p className="text-xs">{order.payment_method}</p>
              </div>
            </div>

            {order.order_items.map((item:any)=>(
              <div key={item.id} className="flex justify-between border-t py-3">

                <div>
                  <p className="font-medium">{item.material_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.qty} {item.unit}
                  </p>
                  <p className="text-xs">ETA: {item.eta}</p>
                </div>

                <div className="font-medium">
                  ₹ {item.total_price}
                </div>

              </div>
            ))}

            <div className="border-t pt-3 text-sm">
              Delivery: {order.delivery_address}
            </div>

          </Card>

        ))}

      </div>

    </AppLayout>
  );
}