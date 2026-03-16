import { buildDemoMarketplace } from "@/demo/marketplace";
import type { MarketSupplier } from "@/demo/marketplace";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { isValidPincode } from "@/lib/geo";
import { cn } from "@/lib/utils";
import LocationPicker from "@/components/location/LocationPicker";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { loadDemoStore, saveDemoStore } from "@/demo/store";
import { supabase } from "@/supabaseClient";

import {
  exportProcurementCsv, exportProcurementPdf, type PreferenceLevel, type ProcurementLine, type ProcurementSupplierRow,
} from "@/lib/reporting";
import { CheckCircle2, Plus, ShieldAlert, Sparkles, Trash2, Truck } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { ComparisonPreferences, SupplierSnapshot } from "@/lib/comparison";
import { quoteSupplier } from "@/lib/comparison";

type LineItem = { id: string; query: string; qty: number; unit: string };

type ItemBestQuote = ReturnType<typeof quoteSupplier> & { lineItemId: string; lineItemQuery: string };

type SupplierAggregate = {
  supplierId: string;
  supplierName: string;
  supplierPincode: string;
  supplierEmail?: string;
  supplierAddress?: string;
  verification: "pending" | "verified" | "rejected";
  rating: number;
  pastClients: number;
  docsCount: number;
  km: number;
  // aggregated
  totalLandedCost: number;
  riskScore: number;
  score: number;
  eta: string;
  items: ItemBestQuote[];
  coversAll: boolean
};

function uid() {
  return Math.random().toString(16).slice(2);
}

function levelFromPct(v01: number): PreferenceLevel {
  const pct = Math.round(v01 * 100);
  if (pct <= 33) return "Low";
  if (pct <= 66) return "Medium";
  return "High";
}

function riskLabel(v: "pending" | "verified" | "rejected") {
  if (v === "verified") return { label: "Verified", variant: "default" as const };
  if (v === "rejected") return { label: "Rejected", variant: "destructive" as const };
  return { label: "Pending", variant: "secondary" as const };
}

function pickWorstEta(items: ItemBestQuote[]) {
  // quick heuristic: choose the slowest textual SLA.
  // If parsing fails, keep the first.
  const parseHours = (eta: string) => {
    const m = eta.match(/(\d+)\s*[–-]\s*(\d+)\s*h/i) || eta.match(/(\d+)\s*h/i);
    if (!m) return 72;
    if (m.length >= 3) return (parseInt(m[1]!, 10) + parseInt(m[2]!, 10)) / 2;
    return parseInt(m[1]!, 10);
  };
  return [...items].sort((a, b) => parseHours(b.eta) - parseHours(a.eta))[0]?.eta ?? "48–72h";
}

function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function ClientComparison() {
  const [market, setMarket] = useState<MarketSupplier[]>([]);

  const [deliveryLocation, setDeliveryLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  const [openMap, setOpenMap] = useState(false);

  useEffect(() => {
    async function loadMarket() {
      const data = await buildDemoMarketplace();
      setMarket(data);
    }

    loadMarket();
  }, []);

  // keep internal pincode for AI engine
  const [vendorPincode] = useState("411001");
  const [radiusKm, setRadiusKm] = useState(50);

  const [items, setItems] = useState<LineItem[]>([
    { id: uid(), query: "cement", qty: 50, unit: "bag" },
    { id: uid(), query: "steel", qty: 200, unit: "ton" },
  ]);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);

  const [prefs, setPrefs] = useState<ComparisonPreferences>({
    prioritizePrice: 0.5,
    prioritizeSpeed: 0.3,
    prioritizeLowRisk: 0.2,
  });

  const [hasRun, setHasRun] = useState(false);
  const [snapshotsByItem, setSnapshotsByItem] = useState<Record<string, SupplierSnapshot[]>>({});
  const [selectedByMaterial, setSelectedByMaterial] = useState<Record<string, string>>({});

  const runComparison = () => {
    if (!deliveryLocation) {
      toast({
        title: "Select delivery location",
        description: "Choose your delivery location on map.",
        variant: "destructive",
      });
      return;
    }
    const next: Record<string, SupplierSnapshot[]> = {};
    const validItems = items.filter((i) => i.query.trim().length > 0 && i.qty > 0);
    if (!validItems.length) {
      toast({ title: "Add at least one material", description: "Enter a material and quantity before comparing." });
      return;
    }

    for (const it of validItems) {
      const q = it.query.trim().toLowerCase();

      next[it.id] = market
        .filter((s) => {
          if (!s.profile.discoverable) return false;
          if (!deliveryLocation) return false;
          if (!s.profile.location) return false;

          const km = getDistanceKm(
            deliveryLocation.lat,
            deliveryLocation.lng,
            s.profile.location.lat,
            s.profile.location.lng
          );

          return km <= radiusKm && km <= s.profile.service_radius_km;
        })
        .flatMap((s) =>
          s.materials
            .filter((m) => m.name.toLowerCase().includes(q))
            .map((m) => ({
              supplierId: s.id,
              supplierName: s.profile.business_name,
              supplierEmail: s.profile.email ?? "",
              supplierAddress: s.profile.address ?? "",
              supplierPincode: s.profile.pincode,
              verification: s.profile.verification,
              rating: s.profile.rating,
              pastClients: s.profile.past_clients,
              docsCount: s.profile.docs_count,
              profile: {
                location: s.profile.location ?? null,
              },
              material: m,
            }))
        );
    }

    setSnapshotsByItem(next);
    setHasRun(true);
  };

  const rankingsByMaterial = useMemo(() => {
    if (!hasRun) return {};

    const result: Record<string, SupplierAggregate[]> = {};

    const validItems = items
      .filter((i) => i.query.trim() && i.qty > 0)
      .map((i) => ({ ...i, query: i.query.trim() }));

    for (const it of validItems) {
      const snaps = snapshotsByItem[it.id] ?? [];
      if (!snaps.length) continue;

      const unitPrices = snaps.map((s) =>
        Number(s.material.unit_base_price ?? 0)
      );

      const marketMinUnitPrice = Math.min(...unitPrices);
      const marketMaxUnitPrice = Math.max(...unitPrices);

      const rankedSuppliers: SupplierAggregate[] = [];

      for (const snap of snaps) {
        const baseQuote = quoteSupplier({
          deliveryLocation,
          qty: it.qty,
          snapshot: snap,
          prefs,
          marketMinUnitPrice,
          marketMaxUnitPrice,
        });

        const q: ItemBestQuote = {
          ...baseQuote,
          lineItemId: it.id,
          lineItemQuery: it.query,
        };

        if (q.km > radiusKm) continue;

        rankedSuppliers.push({
          supplierId: q.supplierId,
          supplierName: q.supplierName,
          supplierPincode: snap.supplierPincode,
          supplierEmail: snap.supplierEmail ?? "",
          supplierAddress: snap.supplierAddress ?? "",
          verification: snap.verification,
          rating: snap.rating,
          pastClients: snap.pastClients,
          docsCount: snap.docsCount,
          km: q.km,
          totalLandedCost: q.totalLandedCost,
          riskScore: q.riskScore,
          score: q.score,
          eta: q.eta,
          items: [q],
          coversAll: true,
        });
      }

      result[it.id] = rankedSuppliers.sort((a, b) => b.score - a.score);
    }

    return result;
  }, [hasRun, items, snapshotsByItem, prefs, deliveryLocation, radiusKm]);

  useEffect(() => {
    setSelectedByMaterial((prev) => {
      const next = { ...prev };

      Object.entries(rankingsByMaterial).forEach(([itemId, suppliers]) => {
        if (!suppliers.length) return;

        // only set default if user hasn't selected anything yet
        if (!next[itemId]) {
          next[itemId] = suppliers[0].supplierId;
        }

        // also if the selected supplier no longer exists, fallback to rank 1
        const stillExists = suppliers.some((s) => s.supplierId === next[itemId]);
        if (!stillExists) {
          next[itemId] = suppliers[0].supplierId;
        }
      });

      return next;
    });
  }, [rankingsByMaterial]);

  const selectedSuppliers = useMemo(() => {
    const result: ItemBestQuote[] = [];

    Object.entries(rankingsByMaterial).forEach(([itemId, suppliers]) => {
      if (!suppliers.length) return;

      const selectedId = selectedByMaterial[itemId];

      const chosen =
        suppliers.find(s => s.supplierId === selectedId) ??
        suppliers[0];

      if (!chosen) return;

      result.push(...chosen.items);
    });

    return result;
  }, [rankingsByMaterial, selectedByMaterial]);

  const prefsLevels = useMemo(
    () => ({
      price: levelFromPct(prefs.prioritizePrice),
      speed: levelFromPct(prefs.prioritizeSpeed),
      risk: levelFromPct(prefs.prioritizeLowRisk),
    }),
    [prefs],
  );

  const breakdownByMaterial = useMemo(() => {
    return selectedSuppliers.map((it) => ({
      material: it.lineItemQuery,
      data: [
        { factor: "Price", value: Math.round(it.breakdown.priceCompetitiveness) },
        { factor: "Distance", value: Math.round(it.breakdown.distanceImpact) },
        { factor: "Logistics", value: Math.round(it.breakdown.logisticsReliability) },
        { factor: "Credibility", value: Math.round(it.breakdown.credibilityStrength) },
        { factor: "Monsoon", value: Math.round(it.breakdown.monsoonRisk) },
      ],
    }));
  }, [selectedSuppliers]);

  const trendByMaterial = useMemo(() => {
    return Object.entries(rankingsByMaterial).map(([itemId, suppliers]) => {
      return {
        material: items.find(i => i.id === itemId)?.query ?? itemId,
        data: suppliers.slice(0, 5).map((s, index) => ({
          name: `#${index + 1}`,
          supplier: s.supplierName,
          score: Math.round(s.score),
          risk: Math.round(s.riskScore),
        })),
      };
    });
  }, [rankingsByMaterial, items]);

  const exportGrandTotal = useMemo(() => {
    return Object.entries(rankingsByMaterial).reduce((sum, [itemId, suppliers]) => {
      if (!suppliers.length) return sum;

      const selectedId = selectedByMaterial[itemId];

      const chosen =
        suppliers.find(s => s.supplierId === selectedId) ??
        suppliers[0]; // fallback to rank 1

      return sum + chosen.totalLandedCost;
    }, 0);
  }, [rankingsByMaterial, selectedByMaterial]);

  const summary = useMemo(() => {
    if (!selectedSuppliers.length)
      return "Run a comparison to generate a recommendation summary.";

    const grandTotal = selectedSuppliers.reduce(
      (sum, it) => sum + it.totalLandedCost,
      0
    );

    const lines = selectedSuppliers.map((it) => {
      return `${it.lineItemQuery.toUpperCase()} sourced from ${it.supplierName
        } (Score ${Math.round(it.score)}/100, Risk ${Math.round(
          it.riskScore
        )}/100, ₹${Math.round(it.totalLandedCost).toLocaleString()}, ${Math.round(
          it.km
        )}km)`;
    });

    const strongest = selectedSuppliers.sort((a, b) => b.score - a.score)[0];

    return `
Strategic procurement recommendation:

${lines.join(". ")}

Overall estimated procurement value: ₹${grandTotal.toLocaleString()}.

Top performing supplier in this basket is ${strongest.supplierName
      }, demonstrating the highest composite intelligence score (${Math.round(
        strongest.score
      )}/100) driven by price competitiveness, logistics reliability and credibility strength.

This combination balances cost efficiency, operational speed and supply risk — delivering an optimized multi-material sourcing decision.
`;
  }, [selectedSuppliers]);

  const exportRows: ProcurementSupplierRow[] = useMemo(() => {
    const rows: ProcurementSupplierRow[] = [];

    Object.entries(rankingsByMaterial).forEach(([itemId, suppliers]) => {
      if (!suppliers.length) return;

      const selectedId = selectedByMaterial[itemId];

      const chosen =
        suppliers.find(s => s.supplierId === selectedId) ??
        suppliers[0];

      if (!chosen) return;

      rows.push({
        supplierName: chosen.supplierName,
        supplierPincode: chosen.supplierPincode,
        verification: chosen.verification,
        rating: chosen.rating,
        pastClients: chosen.pastClients,
        docsCount: chosen.docsCount,
        distanceKm: chosen.km,
        eta: chosen.eta,
        riskScore: chosen.riskScore,
        totalLandedCost: chosen.totalLandedCost,
        score: chosen.score,
      });
    });

    return rows;
  }, [rankingsByMaterial, selectedByMaterial]);

  const exportItems: ProcurementLine[] = useMemo(
    () => items.filter((i) => i.query.trim() && i.qty > 0).map((i) => ({ materialQuery: i.query.trim(), qty: i.qty })),
    [items],
  );

  const onExportCsv = () => {
    if (!exportRows.length) return;

    exportProcurementCsv({
      projectName: "SAHI दाम",
      vendorPincode,
      radiusKm,
      items: exportItems,
      prefs: prefsLevels,
      suppliers: exportRows,
      grandTotal: exportGrandTotal,
      summary,
    });
  };

  const avgRisk =
    exportRows.reduce((sum, s) => sum + s.riskScore, 0) /
    (exportRows.length || 1);

  const onExportPdf = async () => {
    if (!exportRows.length) return;

    await exportProcurementPdf({
      projectName: "SAHI DAAM",
      vendorPincode,
      radiusKm,
      items: exportItems,
      prefs: prefsLevels,
      suppliers: exportRows,
      grandTotal: exportGrandTotal,
      summary,
      deliveryEta: exportRows[0]?.eta ?? "N/A",
      avgRiskScore: avgRisk,
    });
  };

  async function createCashOnDeliveryOrder() {

    const store: any = loadDemoStore();

    const validItems = items.filter((i) => i.query.trim() && i.qty > 0);

    const lines = validItems
      .map((it) => {
        const chosenSupplierId = selectedByMaterial[it.id];
        if (!chosenSupplierId) return null;

        const ranked = rankingsByMaterial[it.id] ?? [];
        const chosen = ranked.find((s) => s.supplierId === chosenSupplierId);
        if (!chosen) return null;

        const quote = chosen.items?.[0];

        return {
          lineItemId: it.id,
          materialName: it.query.trim(),
          qty: it.qty,
          unit: it.unit ?? "",
          supplierId: chosen.supplierId,
          supplierName: chosen.supplierName,
          supplierPincode: chosen.supplierPincode ?? "",
          eta: quote?.eta ?? chosen.eta ?? "",
          km: Math.round(chosen.km ?? 0),
          totalLandedCost: Math.round(
            quote?.totalLandedCost ?? chosen.totalLandedCost ?? 0
          ),
          image: quote?.imageUrl ?? "",
        };
      })
      .filter(Boolean) as any[];

    if (!lines.length) {
      toast({
        title: "No supplier selected",
        description: "Select at least one supplier from the ranked list before buying.",
        variant: "destructive",
      });
      return;
    }

    const orderTotal = lines.reduce((sum, l) => sum + (l.totalLandedCost || 0), 0);

    try {

      // 🔹 get logged-in buyer
      const { data: auth } = await supabase.auth.getUser();
      const buyer = auth?.user;

      if (!buyer) throw new Error("Login required");

      const { data: orderRow, error: orderErr } = await supabase
        .from("orders")
        .insert({
          buyer_id: buyer?.id,
          supplier_id: lines[0].supplierId.replace("supplier:", ""),
          payment_method: "Cash on Delivery",
          delivery_address: deliveryLocation?.address ?? "",
          delivery_lat: deliveryLocation?.lat ?? null,
          delivery_lng: deliveryLocation?.lng ?? null,
          grand_total: orderTotal,
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 🔹 create order items
      const orderItems = lines.map((l) => ({
        order_id: orderRow.id,
        material_name: l.materialName,
        qty: l.qty,
        unit: l.unit,
        unit_price: l.totalLandedCost / l.qty,
        total_price: l.totalLandedCost,
        eta: l.eta,
      }));

      const { error: itemsErr } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsErr) throw itemsErr;

      // 🔹 keep demo store if needed
      const order = {
        id: orderRow.id,
        paymentMethod: "Cash on Delivery",
        createdAt: new Date().toISOString(),
        total: orderTotal,
        lines,
      };

      if (!store.client) store.client = { orders: [] };
      if (!store.client.orders) store.client.orders = [];

      store.client.orders.unshift(order);
      saveDemoStore(store);

      toast({
        title: "Order placed",
        description: "Supplier will receive the order.",
      });

    } catch (err: any) {

      toast({
        title: "Order failed",
        description: err.message,
        variant: "destructive",
      });

    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
      <div className="space-y-6">
        <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Client comparison</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Multi-material procurement ranking: price, distance, logistics reliability, credibility, and monsoon risk.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={onExportCsv}
                disabled={!Object.keys(rankingsByMaterial).length}
              >
                Download CSV
              </Button>
              <Button
                variant="outline"
                onClick={onExportPdf}
                disabled={!Object.keys(rankingsByMaterial).length}
              >
                Download PDF
              </Button>
              <Button variant="hero" onClick={runComparison}>
                <Sparkles className="mr-2 h-4 w-4" /> Run AI Comparison
              </Button>
            </div>
          </div>

          <Separator className="my-5" />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Delivery Location</Label>

              <Dialog open={openMap} onOpenChange={setOpenMap}>
                <DialogTrigger asChild>
                  <Button variant="outline" type="button">
                    Select Delivery Location
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-4xl">
                  <VisuallyHidden>
                    <DialogTitle>Select delivery location</DialogTitle>
                    <DialogDescription>
                      Choose a delivery location on the map to compare suppliers.
                    </DialogDescription>
                  </VisuallyHidden>

                  <LocationPicker
                    serviceRadius={radiusKm}
                    onConfirm={(loc) => {
                      setDeliveryLocation(loc);
                      setOpenMap(false);
                    }}
                  />
                </DialogContent>
              </Dialog>

              {deliveryLocation && (
                <div className="rounded-xl border bg-background/60 p-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">📍 Delivery Address</p>
                  <p>{deliveryLocation.address}</p>
                  <p className="text-xs">
                    {deliveryLocation.lat.toFixed(4)}, {deliveryLocation.lng.toFixed(4)}
                  </p>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Delivery radius: {radiusKm} km</Label>
              <Slider value={[radiusKm]} min={5} max={1000} step={5} onValueChange={(v) => setRadiusKm(v[0] ?? 50)} />
              <p className="text-xs text-muted-foreground">Quotes update as radius/pincode/preferences change (after first run).</p>
            </div>
          </div>

          <Separator className="my-5" />

          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Materials</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setItems((prev) => [
                    ...prev,
                    { id: uid(), query: "", qty: 1, unit: "bag" },
                  ])
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Add item
              </Button>
            </div>

            <div className="mt-4 grid gap-3">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="grid gap-3 rounded-xl border bg-background/60 p-4 md:grid-cols-[1fr_120px_120px_44px]"
                >
                  {/* Material */}
                  <div className="grid gap-2">
                    <Label>Material</Label>
                    <Input
                      value={it.query}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((p) =>
                            p.id === it.id
                              ? { ...p, query: e.target.value }
                              : p
                          )
                        )
                      }
                    />
                  </div>

                  {/* Quantity */}
                  <div className="grid gap-2">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      value={it.qty}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((p) =>
                            p.id === it.id
                              ? {
                                ...p,
                                qty: Math.max(
                                  1,
                                  Number(e.target.value || 1)
                                ),
                              }
                              : p
                          )
                        )
                      }
                    />
                  </div>

                  {/* Unit */}
                  <div className="grid gap-2">
                    <Label>Unit</Label>
                    <select
                      value={it.unit}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((p) =>
                            p.id === it.id
                              ? { ...p, unit: e.target.value }
                              : p
                          )
                        )
                      }
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="bag">Bag</option>
                      <option value="kg">Kg</option>
                      <option value="ton">Ton</option>
                      <option value="piece">Piece</option>
                    </select>
                  </div>

                  {/* Delete Button */}
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setItems((prev) =>
                          prev.filter((p) => p.id !== it.id)
                        )
                      }
                      disabled={items.length <= 1}
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-5" />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-background/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Preference: Price</p>
                <Badge variant="secondary">{prefsLevels.price}</Badge>
              </div>
              <Slider
                value={[Math.round(prefs.prioritizePrice * 100)]}
                min={0}
                max={100}
                step={5}
                onValueChange={(v) => setPrefs((p) => ({ ...p, prioritizePrice: (v[0] ?? 50) / 100 }))}
              />
              <p className="mt-2 text-xs text-muted-foreground">Low → High changes ranking and scoring.</p>
            </div>
            <div className="rounded-xl border bg-background/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Preference: Speed</p>
                <Badge variant="secondary">{prefsLevels.speed}</Badge>
              </div>
              <Slider
                value={[Math.round(prefs.prioritizeSpeed * 100)]}
                min={0}
                max={100}
                step={5}
                onValueChange={(v) => setPrefs((p) => ({ ...p, prioritizeSpeed: (v[0] ?? 30) / 100 }))}
              />
              <p className="mt-2 text-xs text-muted-foreground">ETA and reliability influence this.</p>
            </div>
            <div className="rounded-xl border bg-background/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Preference: Low risk</p>
                <Badge variant="secondary">{prefsLevels.risk}</Badge>
              </div>
              <Slider
                value={[Math.round(prefs.prioritizeLowRisk * 100)]}
                min={0}
                max={100}
                step={5}
                onValueChange={(v) => setPrefs((p) => ({ ...p, prioritizeLowRisk: (v[0] ?? 20) / 100 }))}
              />
              <p className="mt-2 text-xs text-muted-foreground">Verification + docs + rating reduce risk.</p>
            </div>
          </div>
        </Card>

        <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Ranked suppliers</h2>
            <p className="text-sm text-muted-foreground">Click to inspect combined quote.</p>
          </div>

          <div className="mt-5 grid gap-6">
            {Object.keys(rankingsByMaterial).length ? (
              Object.entries(rankingsByMaterial).map(([itemId, suppliers]) => (
                <div key={itemId} className="space-y-4">

                  <h3 className="text-lg font-semibold">
                    Ranked suppliers — {items.find(i => i.id === itemId)?.query}
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {suppliers.map((q, idx) => {
                      const isSelected = selectedByMaterial[itemId] === q.supplierId;
                      const vBadge = riskLabel(q.verification);

                      return (
                        <button
                          key={`${itemId}-${q.supplierId}`}
                          type="button"
                          onClick={() =>
                            setSelectedByMaterial(prev => ({
                              ...prev,
                              [itemId]: q.supplierId
                            }))
                          }
                          className={cn(
                            "text-left rounded-xl border bg-background/60 p-4 transition",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isSelected && "border-primary/50 shadow-elevated"
                          )}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium">
                                  #{idx + 1} {q.supplierName}
                                </p>
                                <Badge variant={vBadge.variant}>
                                  {vBadge.label}
                                </Badge>
                                <Badge variant="secondary">
                                  Score {Math.round(q.score)}/100
                                </Badge>
                              </div>

                              <p className="mt-1 text-sm text-muted-foreground">
                                {Math.round(q.km)} km • ETA {q.eta}
                              </p>

                              {/* 🔽 ADD THIS SECTION */}
                              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span>Email:</span>
                                <span>{q.supplierEmail}</span>

                                <span>Address:</span>
                                <span>{q.supplierAddress}</span>

                                <span>Pincode:</span>
                                <span>{q.supplierPincode}</span>

                                <span>Documents:</span>
                                <span>{q.docsCount}</span>
                              </div>

                              <p className="mt-3 text-sm">
                                <span className="text-muted-foreground">Total landed:</span>{" "}
                                <span className="font-semibold">
                                  ₹ {Math.round(q.totalLandedCost).toLocaleString()}
                                </span>
                                <span className="mx-2 text-muted-foreground">•</span>
                                <span className="text-muted-foreground">Risk:</span>{" "}
                                <span className="font-medium">
                                  {Math.round(q.riskScore)}/100
                                </span>
                              </p>
                            </div>

                            {q.items[0]?.imageUrl && (
                              <img
                                src={q.items[0].imageUrl}
                                alt={`${q.items[0].materialLabel} image`}
                                loading="lazy"
                                className="h-14 w-14 shrink-0 rounded-lg border object-cover"
                              />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border bg-background/60 p-6 text-sm text-muted-foreground">
                Click “Run AI Comparison” to see ranked suppliers.
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Selected supplier quote</h2>

            <Button
              disabled={!Object.keys(selectedByMaterial).length}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              onClick={() => setOpenPaymentModal(true)}
            >
              Buy Now
            </Button>
          </div>

          {selectedSuppliers.length ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                All costs update from pincode distance + slab transport rules.
              </p>

              <div className="mt-5 grid gap-3">
                {selectedSuppliers.map((it) => (
                  <div
                    key={it.lineItemId}
                    className="rounded-xl border bg-background/60 p-4"
                  >
                    <p className="text-sm font-medium">{it.lineItemQuery}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {it.materialLabel}
                    </p>

                    <div className="mt-3 grid gap-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Base cost</span>
                        <span className="font-medium">
                          ₹ {Math.round(it.baseCost).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Transport ({Math.round(it.km)} km)
                        </span>
                        <span className="font-medium">
                          ₹ {Math.round(it.transportCost).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monsoon</span>
                        <span className="font-medium">
                          ₹ {Math.round(it.monsoonSurcharge).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-semibold">
                          ₹ {Math.round(it.totalLandedCost).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Grand Total */}
                <div className="flex justify-between rounded-xl border bg-background/60 p-4">
                  <p className="text-sm font-medium">Grand total</p>
                  <p className="text-lg font-bold">
                    ₹{" "}
                    {selectedSuppliers
                      .reduce((sum, it) => sum + it.totalLandedCost, 0)
                      .toLocaleString()}
                  </p>
                </div>

                {/* Combined ETA */}
                <div className="flex justify-between rounded-xl border bg-background/60 p-4">
                  <p className="text-sm text-muted-foreground">Delivery ETA</p>
                  <p className="font-medium">
                    {
                      selectedSuppliers.sort((a, b) =>
                        a.eta.localeCompare(b.eta)
                      )[selectedSuppliers.length - 1]?.eta
                    }
                  </p>
                </div>

                {/* Average Risk */}
                <div className="flex justify-between rounded-xl border bg-background/60 p-4">
                  <p className="text-sm text-muted-foreground">Risk score (avg)</p>
                  <div className="inline-flex items-center gap-2">
                    {(
                      selectedSuppliers.reduce(
                        (sum, it) => sum + it.riskScore,
                        0
                      ) / selectedSuppliers.length
                    ) <= 35 ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    )}

                    <p className="font-medium">
                      {Math.round(
                        selectedSuppliers.reduce(
                          (sum, it) => sum + it.riskScore,
                          0
                        ) / selectedSuppliers.length
                      )}
                      /100
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-5 rounded-xl border bg-background/60 p-6 text-sm text-muted-foreground">
              Select suppliers from ranked lists.
            </div>
          )}
        </Card>

        {openPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

            <div className="w-[420px] rounded-xl bg-white p-6 shadow-xl">

              <h2 className="text-xl font-semibold">Choose payment method</h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Select how you want to pay for this order.
              </p>

              <div className="mt-6 flex flex-col gap-3">

                <Button
                  className="w-full"
                  onClick={() => {
                    alert("Online payment coming soon.");
                  }}
                >
                  Pay Now
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    createCashOnDeliveryOrder();
                    setOpenPaymentModal(false);
                  }}
                >
                  Cash on Delivery
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setOpenPaymentModal(false)}
                >
                  Cancel
                </Button>

              </div>

            </div>

          </div>
        )}

        <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Explainable scoring</h2>
            <Badge variant="secondary">0–100</Badge>
          </div>
          <Tabs defaultValue="breakdown" className="mt-5">
            <TabsList>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              <TabsTrigger value="trend">Preference trend</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="breakdown" className="mt-4">
              {breakdownByMaterial.length ? (
                <div className="grid gap-6">
                  {breakdownByMaterial.map((section) => (
                    <div key={section.material}>
                      <p className="mb-3 text-sm font-medium">
                        {section.material} — Score breakdown
                      </p>

                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={section.data}
                            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="factor" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            <Bar
                              dataKey="value"
                              name="Score"
                              fill="hsl(var(--primary))"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No supplier selected.
                </p>
              )}
            </TabsContent>

            <TabsContent value="trend" className="mt-4">
              {trendByMaterial.length ? (
                <div className="grid gap-6">
                  {trendByMaterial.map((section) => (
                    <div key={section.material}>
                      <p className="mb-3 text-sm font-medium">
                        {section.material} — Supplier comparison
                      </p>

                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={section.data}
                            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />

                            <Line
                              type="monotone"
                              dataKey="score"
                              stroke="hsl(var(--primary))"
                              strokeWidth={3}
                            />

                            <Line
                              type="monotone"
                              dataKey="risk"
                              stroke="hsl(var(--muted-foreground))"
                              strokeWidth={3}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No supplier data available.
                </p>
              )}
            </TabsContent>

            <TabsContent value="summary" className="mt-4">
              <div className="rounded-xl border bg-background/60 p-4">
                <p className="text-sm text-muted-foreground">{summary}</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
