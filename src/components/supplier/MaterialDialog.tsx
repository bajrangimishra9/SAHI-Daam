import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { loadDemoStore, saveDemoStore } from "@/demo/store";
import { useState } from "react";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.enum(["civil", "electrical", "machinery"]),
  brand: z.string().trim().max(80).optional().or(z.literal("")),
  grade_strength: z.string().trim().max(1000).optional().or(z.literal("")),
  unit_base_price: z.coerce.number().min(0).max(10_000_000),
  monsoon_price_rise_pct: z.coerce.number().min(0).max(1000),
  available_stock: z.coerce.number().min(0).max(1_000_000).optional(),
  delivery_sla: z.string().trim().max(1000).optional().or(z.literal("")),
  transport_params: z.string().trim().max(2000).optional().or(z.literal("")),
  bulk_discount_rules: z.string().trim().max(4000).optional().or(z.literal("")),
  image_urls: z.string().trim().max(4000).optional().or(z.literal("")),
});

export default function MaterialDialog({
  triggerLabel,
  initial,
  onSaved,
}: {
  triggerLabel: string;
  initial?: { id: string } & Partial<Record<string, any>>;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      toast({ title: "Invalid material", description: parsed.error.issues[0]?.message, variant: "destructive" });
      return;
    }

    const payload = {
      name: parsed.data.name,
      category: parsed.data.category,
      brand: parsed.data.brand || null,
      grade_strength: parsed.data.grade_strength || null,
      unit_base_price: parsed.data.unit_base_price,
      monsoon_price_rise_pct: parsed.data.monsoon_price_rise_pct,
      available_stock: parsed.data.available_stock ?? null,
      delivery_sla: parsed.data.delivery_sla || null,
      transport_params: safeJson(parsed.data.transport_params, {}),
      bulk_discount_rules: safeJson(parsed.data.bulk_discount_rules, []),
      image_urls: parseImageUrls(parsed.data.image_urls),
    };

    try {
      setSaving(true);
      const store = loadDemoStore();
      if (initial?.id) {
        store.supplier.materials = store.supplier.materials.map((m) => (m.id === initial.id ? { ...m, ...payload } : m));
      } else {
        store.supplier.materials = [
          { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...payload },
          ...store.supplier.materials,
        ] as any;
      }
      saveDemoStore(store);
      toast({ title: initial?.id ? "Material updated" : "Material added" });
      setOpen(false);
      onSaved();
    } catch (err: any) {
      toast({ title: "Save failed", description: err?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={initial?.id ? "outline" : "hero"} size={initial?.id ? "sm" : "default"}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Edit material" : "Add material"}</DialogTitle>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="name">Material name</Label>
            <Input id="name" name="name" defaultValue={initial?.name ?? ""} placeholder="Cement PPC 50kg" />
          </div>

          <div className="grid gap-2">
            <Label>Category</Label>
            <Select name="category" defaultValue={String(initial?.category ?? "civil")}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="civil">Civil</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="machinery">Machinery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" name="brand" defaultValue={initial?.brand ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="grade_strength">Grade / strength</Label>
              <Input id="grade_strength" name="grade_strength" defaultValue={initial?.grade_strength ?? ""} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="unit_base_price">Unit base price</Label>
              <Input id="unit_base_price" name="unit_base_price" defaultValue={String(initial?.unit_base_price ?? 0)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="monsoon_price_rise_pct">Monsoon price rise (%)</Label>
              <Input
                id="monsoon_price_rise_pct"
                name="monsoon_price_rise_pct"
                defaultValue={String(initial?.monsoon_price_rise_pct ?? 0)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="available_stock">Available stock</Label>
              <Input id="available_stock" name="available_stock" defaultValue={initial?.available_stock ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="delivery_sla">Delivery SLA</Label>
              <Input id="delivery_sla" name="delivery_sla" defaultValue={initial?.delivery_sla ?? ""} placeholder="24–48h" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transport_params">Transport cost parameters (JSON)</Label>
            <Textarea
              id="transport_params"
              name="transport_params"
              defaultValue={toJson(initial?.transport_params)}
              placeholder='{"per_km":3.2,"base":0}'
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bulk_discount_rules">Bulk discount rules (JSON)</Label>
            <Textarea
              id="bulk_discount_rules"
              name="bulk_discount_rules"
              defaultValue={toJson(initial?.bulk_discount_rules)}
              placeholder='[{"min_qty":50,"discount_pct":2}]'
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="image_urls">Product image URLs (one per line)</Label>
            <Textarea
              id="image_urls"
              name="image_urls"
              defaultValue={(initial?.image_urls ?? []).join("\n")}
              placeholder="https://example.com/cement.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Demo mode: paste image URLs. (File uploads can be added later with backend storage.)
            </p>
          </div>

          <DialogFooter>
            <Button type="submit" variant="hero" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function safeJson(value: string | undefined, fallback: any) {
  const v = (value ?? "").trim();
  if (!v) return fallback;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
}

function toJson(v: any) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return "";
  }
}

function parseImageUrls(v: string | undefined) {
  const raw = (v ?? "").trim();
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}
