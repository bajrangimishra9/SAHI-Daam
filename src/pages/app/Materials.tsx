import AppLayout from "@/components/app/AppLayout";
import MaterialDialog from "@/components/supplier/MaterialDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/supabaseClient";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, []);

  const getOrCreateSupplier = async (user: any) => {
    // 1️⃣ Try to fetch existing supplier
    const { data: existing, error: fetchErr } = await supabase
      .from("suppliers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;

    if (existing) return existing;

    // 2️⃣ If not found → create supplier automatically
    const { data: created, error: insertErr } = await supabase
      .from("suppliers")
      .insert({
        user_id: user.id,
        name: user.user_metadata?.full_name ?? "New Supplier",
        email: user.email,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return created;
  };

  const loadMaterials = async () => {
    try {
      setLoading(true);

      // Get logged-in user
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      // 🔥 Get or create supplier automatically
      const supplier = await getOrCreateSupplier(user);

      // Fetch materials
      const { data, error } = await supabase
        .from("supplier_materials")
        .select("*")
        .eq("supplier_id", supplier.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMaterials(data || []);
    } catch (err: any) {
      toast({
        title: "Failed to load materials",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("supplier_materials")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Material deleted" });
      loadMaterials();
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout role="supplier" title="Materials">
      <div className="space-y-6">
        <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Materials offered</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Civil • Electrical • Machinery
              </p>
            </div>

            <MaterialDialog
              triggerLabel="Add material"
              onSaved={loadMaterials}
            />
          </div>

          <div className="mt-6 grid gap-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading materials...
              </p>
            ) : materials.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No materials added yet.
              </p>
            ) : (
              materials.map((m: any) => (
                <div
                  key={m.id}
                  className="flex flex-col gap-4 rounded-xl border bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    {/* 🖼 Image */}
                    {m.image_urls && m.image_urls.length > 0 ? (
                      <img
                        src={m.image_urls[0]}
                        alt={m.name}
                        className="h-16 w-16 rounded-lg object-cover border"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        No Image
                      </div>
                    )}

                    {/* 📦 Info */}
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {m.category} • ₹ {m.unit_base_price} / {m.unit ?? "-"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <MaterialDialog
                      triggerLabel="Edit"
                      initial={m}
                      onSaved={loadMaterials}
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(m.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}