import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  unit: z.enum(["kg", "bag", "ton", "piece", "cubic_meter"]),
  unit_base_price: z.coerce.number().min(0).max(10_000_000),
  monsoon_price_rise_pct: z.coerce.number().min(0).max(1000),
  available_stock: z.coerce.number().min(0).max(1_000_000).optional(),
  delivery_sla: z.string().trim().max(1000).optional().or(z.literal("")),

  // Transport inputs
  transport_per_km: z.coerce.number().min(0).optional(),
  transport_base: z.coerce.number().min(0).optional(),

  // Bulk discount inputs
  bulk_min_qty: z.coerce.number().min(0).optional(),
  bulk_discount_pct: z.coerce.number().min(0).max(100).optional(),

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
      toast({
        title: "Invalid material",
        description: parsed.error.issues[0]?.message,
        variant: "destructive",
      });
      return;
    }

    const payload = {
      name: parsed.data.name,
      category: parsed.data.category,
      brand: parsed.data.brand || null,
      grade_strength: parsed.data.grade_strength || null,
      unit: parsed.data.unit,
      unit_base_price: parsed.data.unit_base_price,
      monsoon_price_rise_pct: parsed.data.monsoon_price_rise_pct,
      available_stock: parsed.data.available_stock ?? null,
      delivery_sla: parsed.data.delivery_sla || null,

      transport_params: {
        per_km: parsed.data.transport_per_km ?? 0,
        base: parsed.data.transport_base ?? 0,
      },

      bulk_discount_rules:
        parsed.data.bulk_min_qty && parsed.data.bulk_discount_pct
          ? [
              {
                min_qty: parsed.data.bulk_min_qty,
                discount_pct: parsed.data.bulk_discount_pct,
              },
            ]
          : [],

      image_urls: parseImageUrls(parsed.data.image_urls),
    };

    try {
      setSaving(true);
      const store = loadDemoStore();

      if (initial?.id) {
        store.supplier.materials = store.supplier.materials.map((m) =>
          m.id === initial.id ? { ...m, ...payload } : m
        );
      } else {
        store.supplier.materials = [
          {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            ...payload,
          },
          ...store.supplier.materials,
        ] as any;
      }

      saveDemoStore(store);
      toast({ title: initial?.id ? "Material updated" : "Material added" });
      setOpen(false);
      onSaved();
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={initial?.id ? "outline" : "hero"}
          size={initial?.id ? "sm" : "default"}
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initial?.id ? "Edit material" : "Add material"}
          </DialogTitle>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="name">Material name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initial?.name ?? ""}
              placeholder="Cement PPC 50kg"
            />
          </div>

          <div className="grid gap-2">
            <Label>Category</Label>
            <Select
              name="category"
              defaultValue={String(initial?.category ?? "civil")}
            >
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
              <Input
                id="brand"
                name="brand"
                defaultValue={initial?.brand ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="grade_strength">Grade / strength</Label>
              <Input
                id="grade_strength"
                name="grade_strength"
                defaultValue={initial?.grade_strength ?? ""}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="unit_base_price">Unit base price</Label>
              <Input
                type="number"
                id="unit_base_price"
                name="unit_base_price"
                defaultValue={String(initial?.unit_base_price ?? 0)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Unit</Label>
              <Select
                name="unit"
                defaultValue={String(initial?.unit ?? "kg")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kg</SelectItem>
                  <SelectItem value="bag">Bag</SelectItem>
                  <SelectItem value="ton">Ton</SelectItem>
                  <SelectItem value="piece">Piece</SelectItem>
                  <SelectItem value="cubic_meter">Cubic Meter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="monsoon_price_rise_pct">
                Monsoon price rise (%)
              </Label>
              <Input
                type="number"
                id="monsoon_price_rise_pct"
                name="monsoon_price_rise_pct"
                defaultValue={String(initial?.monsoon_price_rise_pct ?? 0)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="available_stock">Available stock</Label>
              <Input
                type="number"
                id="available_stock"
                name="available_stock"
                defaultValue={initial?.available_stock ?? ""}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="delivery_sla">Delivery SLA</Label>
              <Input
                id="delivery_sla"
                name="delivery_sla"
                defaultValue={initial?.delivery_sla ?? ""}
                placeholder="24–48h"
              />
            </div>
          </div>

          {/* Transport */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="transport_per_km">Transport cost per km</Label>
              <Input
                type="number"
                id="transport_per_km"
                name="transport_per_km"
                defaultValue={initial?.transport_params?.per_km ?? 0}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="transport_base">Base transport cost</Label>
              <Input
                type="number"
                id="transport_base"
                name="transport_base"
                defaultValue={initial?.transport_params?.base ?? 0}
              />
            </div>
          </div>

          {/* Bulk Discount */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="bulk_min_qty">
                Bulk discount – Minimum quantity
              </Label>
              <Input
                type="number"
                id="bulk_min_qty"
                name="bulk_min_qty"
                defaultValue={
                  initial?.bulk_discount_rules?.[0]?.min_qty ?? ""
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bulk_discount_pct">
                Bulk discount (%)
              </Label>
              <Input
                type="number"
                id="bulk_discount_pct"
                name="bulk_discount_pct"
                defaultValue={
                  initial?.bulk_discount_rules?.[0]?.discount_pct ?? ""
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="image_urls">
              Product image URLs (one per line)
            </Label>
            <Textarea
              id="image_urls"
              name="image_urls"
              defaultValue={(initial?.image_urls ?? []).join("\n")}
              placeholder="https://example.com/cement.jpg"
            />
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

function parseImageUrls(v: string | undefined) {
  const raw = (v ?? "").trim();
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}
