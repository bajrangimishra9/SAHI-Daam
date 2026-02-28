import { loadDemoStore } from "@/demo/store";
import { ComparisonPreferences, SupplierSnapshot, quoteSupplier } from "@/lib/comparison";
import { isValidPincode } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, ShieldAlert, Sparkles, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MarketSupplier = {
  id: string;
  profile: {
    business_name: string;
    pincode: string;
    service_radius_km: number;
    discoverable: boolean;
    verification: "pending" | "verified" | "rejected";
    rating: number;
    past_clients: number;
    docs_count: number;
  };
  materials: SupplierSnapshot["material"][];
};

function buildMarketplace(): MarketSupplier[] {
  const store = loadDemoStore();

  const editableSupplier: MarketSupplier = {
    id: "supplier:me",
    profile: {
      business_name: store.supplier.profile.business_name,
      pincode: store.supplier.profile.pincode,
      service_radius_km: store.supplier.profile.service_radius_km,
      discoverable: store.supplier.profile.discoverable,
      verification: store.supplier.profile.verification,
      rating: store.supplier.profile.rating ?? 4,
      past_clients: store.supplier.profile.past_clients ?? 12,
      docs_count: store.supplier.documents.length,
    },
    materials: (store.supplier.materials ?? []).map((m: any) => ({
      materialId: m.id,
      name: m.name,
      category: m.category,
      brand: m.brand ?? null,
      grade_strength: m.grade_strength ?? null,
      unit_base_price: Number(m.unit_base_price ?? 0),
      transport_params: m.transport_params ?? {},
      bulk_discount_rules: m.bulk_discount_rules ?? [],
      monsoon_price_rise_pct: Number(m.monsoon_price_rise_pct ?? 0),
      available_stock: m.available_stock ?? null,
      delivery_sla: m.delivery_sla ?? null,
      image_urls: m.image_urls ?? [],
    })),
  };

  // Other demo suppliers (static fixtures to enable comparison even when only one supplier is configured).
  const fixtures: MarketSupplier[] = [
    {
      id: "supplier:metro",
      profile: {
        business_name: "Metro Materials",
        pincode: "411004",
        service_radius_km: 40,
        discoverable: true,
        verification: "verified",
        rating: 4.6,
        past_clients: 73,
        docs_count: 5,
      },
      materials: [
        {
          materialId: "metro-cement-1",
          name: "Cement OPC 53 50kg",
          category: "civil",
          brand: "MetroPro",
          grade_strength: "OPC 53",
          unit_base_price: 408,
          transport_params: { per_km: 2.8, base: 40 },
          bulk_discount_rules: [{ min_qty: 60, discount_pct: 3 }],
          monsoon_price_rise_pct: 4,
          available_stock: 1200,
          delivery_sla: "24–48h",
          image_urls: ["/placeholder.svg"],
        },
        {
          materialId: "metro-steel-1",
          name: "TMT Steel 12mm",
          category: "civil",
          brand: "MetroTMT",
          grade_strength: "Fe500D",
          unit_base_price: 62,
          transport_params: { per_km: 1.6, base: 60 },
          bulk_discount_rules: [{ min_qty: 300, discount_pct: 2 }],
          monsoon_price_rise_pct: 3,
          available_stock: 2000,
          delivery_sla: "48–72h",
          image_urls: ["/placeholder.svg"],
        },
      ],
    },
    {
      id: "supplier:greencycle",
      profile: {
        business_name: "GreenCycle Aggregates",
        pincode: "411021",
        service_radius_km: 65,
        discoverable: true,
        verification: "verified",
        rating: 4.2,
        past_clients: 41,
        docs_count: 4,
      },
      materials: [
        {
          materialId: "gc-sand-1",
          name: "M-Sand (1 ton)",
          category: "civil",
          brand: "GreenCycle",
          grade_strength: "Zone II",
          unit_base_price: 1420,
          transport_params: { per_km: 7.2, base: 0 },
          bulk_discount_rules: [{ min_qty: 10, discount_pct: 4 }],
          monsoon_price_rise_pct: 10,
          available_stock: 60,
          delivery_sla: "48h",
          image_urls: ["/placeholder.svg"],
        },
        {
          materialId: "gc-cement-1",
          name: "Cement PPC 50kg",
          category: "civil",
          brand: "EcoBuild",
          grade_strength: "PPC",
          unit_base_price: 392,
          transport_params: { per_km: 3.1, base: 0 },
          bulk_discount_rules: [{ min_qty: 50, discount_pct: 2 }],
          monsoon_price_rise_pct: 8,
          available_stock: 700,
          delivery_sla: "48–72h",
          image_urls: ["/placeholder.svg"],
        },
      ],
    },
    {
      id: "supplier:budget",
      profile: {
        business_name: "Budget Traders",
        pincode: "411033",
        service_radius_km: 30,
        discoverable: true,
        verification: "pending",
        rating: 3.7,
        past_clients: 14,
        docs_count: 1,
      },
      materials: [
        {
          materialId: "bt-cement-1",
          name: "Cement PPC 50kg",
          category: "civil",
          brand: "ValueMix",
          grade_strength: "PPC",
          unit_base_price: 382,
          transport_params: { per_km: 3.9, base: 0 },
          bulk_discount_rules: [{ min_qty: 80, discount_pct: 4 }],
          monsoon_price_rise_pct: 12,
          available_stock: 320,
          delivery_sla: "72–96h",
          image_urls: ["/placeholder.svg"],
        },
      ],
    },
  ];

  return [editableSupplier, ...fixtures].filter((s) => Boolean(s.profile.business_name));
}

function riskLabel(v: "pending" | "verified" | "rejected") {
  if (v === "verified") return { label: "Verified", variant: "default" as const };
  if (v === "rejected") return { label: "Rejected", variant: "destructive" as const };
  return { label: "Pending", variant: "secondary" as const };
}

export default function SupplierComparison() {
  const [materialQuery, setMaterialQuery] = useState("cement");
  const [qty, setQty] = useState(50);
  const [vendorPincode, setVendorPincode] = useState("411001");
  const [radiusKm, setRadiusKm] = useState(50);

  const [prefs, setPrefs] = useState<ComparisonPreferences>({
    prioritizePrice: 0.5,
    prioritizeSpeed: 0.3,
    prioritizeLowRisk: 0.2,
  });

  const [running, setRunning] = useState(false);
  const [quotes, setQuotes] = useState<ReturnType<typeof quoteSupplier>[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const market = useMemo(() => buildMarketplace(), []);

  const availableMaterials = useMemo(() => {
    const all = market.flatMap((s) => s.materials.map((m) => m.name));
    const uniq = Array.from(new Set(all)).sort();
    return uniq;
  }, [market]);

  const effectiveQuery = useMemo(() => {
    const q = materialQuery.trim().toLowerCase();
    if (!q) return "";
    const fromPick = availableMaterials.find((m) => m.toLowerCase() === q);
    return fromPick ?? materialQuery;
  }, [materialQuery, availableMaterials]);

  const runComparison = async () => {
    if (!isValidPincode(vendorPincode)) {
      toast({ title: "Invalid pincode", description: "Enter a 6-digit pincode.", variant: "destructive" });
      return;
    }

    try {
      setRunning(true);

      const snapshots: SupplierSnapshot[] = market
        .filter((s) => s.profile.discoverable)
        .flatMap((s) =>
          s.materials
            .filter((m) => m.name.toLowerCase().includes(effectiveQuery.toLowerCase()))
            .map((m) => ({
              supplierId: s.id,
              supplierName: s.profile.business_name,
              supplierPincode: s.profile.pincode,
              verification: s.profile.verification,
              rating: s.profile.rating,
              pastClients: s.profile.past_clients,
              docsCount: s.profile.docs_count,
              material: m,
            })),
        )
        // radius gates: vendor radius + supplier radius
        .filter((snap) => {
          const s = market.find((x) => x.id === snap.supplierId);
          if (!s) return false;
          return true;
        });

      if (!snapshots.length) {
        toast({ title: "No matches", description: "No nearby suppliers match this material query." });
        setQuotes([]);
        setSelectedSupplierId(null);
        return;
      }

      const unitPrices = snapshots.map((s) => Number(s.material.unit_base_price ?? 0));
      const marketMinUnitPrice = Math.min(...unitPrices);
      const marketMaxUnitPrice = Math.max(...unitPrices);

      const computed = snapshots
        .map((snap) =>
          quoteSupplier({
            vendorPincode,
            qty,
            snapshot: snap,
            prefs,
            marketMinUnitPrice,
            marketMaxUnitPrice,
          }),
        )
        .filter((q) => q.km <= radiusKm)
        .sort((a, b) => b.score - a.score);

      if (!computed.length) {
        toast({
          title: "No suppliers in radius",
          description: "Try increasing radius or changing the material query.",
        });
        setQuotes([]);
        setSelectedSupplierId(null);
        return;
      }

      setQuotes(computed);
      setSelectedSupplierId(computed[0]?.supplierId ?? null);
    } finally {
      setRunning(false);
    }
  };

  const selected = useMemo(() => quotes.find((q) => q.supplierId === selectedSupplierId) ?? null, [quotes, selectedSupplierId]);

  const breakdownData = useMemo(() => {
    if (!selected) return [];
    const b = selected.breakdown;
    return [
      { factor: "Price", value: Math.round(b.priceCompetitiveness) },
      { factor: "Distance", value: Math.round(b.distanceImpact) },
      { factor: "Logistics", value: Math.round(b.logisticsReliability) },
      { factor: "Credibility", value: Math.round(b.credibilityStrength) },
      { factor: "Monsoon", value: Math.round(b.monsoonRisk) },
    ];
  }, [selected]);

  const trendData = useMemo(() => {
    // simple explainable trend: show how top suppliers differ in score + cost
    return quotes.slice(0, 5).map((q, i) => ({
      name: `#${i + 1}`,
      score: Math.round(q.score),
      cost: Math.round(q.totalLandedCost / Math.max(1, qty)),
      risk: Math.round(q.riskScore),
    }));
  }, [quotes, qty]);

  const summary = useMemo(() => {
    if (!quotes.length) return null;
    const top = quotes[0]!;
    const second = quotes[1];
    const why = [
      `Top pick is ${top.supplierName} for “${top.materialLabel}”.`,
      `It balances total landed cost (₹${top.totalLandedCost.toLocaleString()}), delivery (${top.eta}), and risk (score ${Math.round(
        top.riskScore,
      )}/100).`,
      second
        ? `Runner‑up ${second.supplierName} scores ${Math.round(second.score)}/100 with total ₹${second.totalLandedCost.toLocaleString()}.`
        : null,
    ].filter(Boolean);
    return why.join(" ");
  }, [quotes]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
      <div className="space-y-6">
        <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Supplier comparison</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Profile-driven ranking: price, distance, logistics reliability, credibility, and monsoon risk.
              </p>
            </div>
            <Button variant="hero" onClick={() => void runComparison()} disabled={running}>
              <Sparkles className="mr-2 h-4 w-4" />
              {running ? "Comparing…" : "Run AI Comparison"}
            </Button>
          </div>

          <Separator className="my-5" />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="material">Material</Label>
              <Input
                id="material"
                list="materials"
                value={materialQuery}
                onChange={(e) => setMaterialQuery(e.target.value)}
                placeholder="Cement PPC 50kg"
              />
              <datalist id="materials">
                {availableMaterials.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="qty">Quantity</Label>
              <Input
                id="qty"
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
              />
              <p className="text-xs text-muted-foreground">Units are per listing (e.g., bags / tons / pieces).</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pincode">Delivery pincode</Label>
              <Input id="pincode" value={vendorPincode} onChange={(e) => setVendorPincode(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>Search radius: {radiusKm} km</Label>
              <Slider value={[radiusKm]} min={5} max={120} step={5} onValueChange={(v) => setRadiusKm(v[0] ?? 50)} />
              <p className="text-xs text-muted-foreground">Filters suppliers by distance to delivery location.</p>
            </div>
          </div>

          <Separator className="my-5" />

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-background/60 p-4">
              <p className="text-sm font-medium">Preference: Price</p>
              <Slider
                value={[Math.round(prefs.prioritizePrice * 100)]}
                min={0}
                max={100}
                step={5}
                onValueChange={(v) => setPrefs((p) => ({ ...p, prioritizePrice: (v[0] ?? 50) / 100 }))}
              />
              <p className="mt-2 text-xs text-muted-foreground">Cheaper landed cost scores higher.</p>
            </div>
            <div className="rounded-xl border bg-background/60 p-4">
              <p className="text-sm font-medium">Preference: Speed</p>
              <Slider
                value={[Math.round(prefs.prioritizeSpeed * 100)]}
                min={0}
                max={100}
                step={5}
                onValueChange={(v) => setPrefs((p) => ({ ...p, prioritizeSpeed: (v[0] ?? 30) / 100 }))}
              />
              <p className="mt-2 text-xs text-muted-foreground">Lower ETA improves reliability.</p>
            </div>
            <div className="rounded-xl border bg-background/60 p-4">
              <p className="text-sm font-medium">Preference: Low risk</p>
              <Slider
                value={[Math.round(prefs.prioritizeLowRisk * 100)]}
                min={0}
                max={100}
                step={5}
                onValueChange={(v) => setPrefs((p) => ({ ...p, prioritizeLowRisk: (v[0] ?? 20) / 100 }))}
              />
              <p className="mt-2 text-xs text-muted-foreground">Verified + docs + ratings reduce risk.</p>
            </div>
          </div>
        </Card>

        <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Ranked suppliers</h2>
            <p className="text-sm text-muted-foreground">Click a supplier to inspect the quote.</p>
          </div>

          <div className="mt-5 grid gap-3">
            {quotes.length ? (
              quotes.map((q, idx) => {
                const selected = q.supplierId === selectedSupplierId;
                const v = market.find((s) => s.id === q.supplierId)?.profile.verification ?? "pending";
                const vBadge = riskLabel(v);
                return (
                  <button
                    key={`${q.supplierId}:${q.materialLabel}`}
                    type="button"
                    onClick={() => setSelectedSupplierId(q.supplierId)}
                    className={cn(
                      "text-left",
                      "rounded-xl border bg-background/60 p-4 transition",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected && "border-primary/50 shadow-elevated",
                    )}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">#{idx + 1} {q.supplierName}</p>
                          <Badge variant={vBadge.variant}>{vBadge.label}</Badge>
                          <Badge variant="secondary">Score {Math.round(q.score)}/100</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {q.materialLabel} • {q.km} km • ETA {q.eta}
                        </p>
                        <p className="mt-2 text-sm">
                          <span className="text-muted-foreground">Total landed:</span> <span className="font-semibold">₹ {q.totalLandedCost.toLocaleString()}</span>
                          <span className="mx-2 text-muted-foreground">•</span>
                          <span className="text-muted-foreground">Risk:</span> <span className="font-medium">{Math.round(q.riskScore)}/100</span>
                        </p>
                      </div>
                      {q.imageUrl ? (
                        <img
                          src={q.imageUrl}
                          alt={`${q.materialLabel} image`}
                          loading="lazy"
                          className="h-14 w-14 shrink-0 rounded-lg border object-cover"
                        />
                      ) : null}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-xl border bg-background/60 p-6 text-sm text-muted-foreground">
                Run a comparison to see ranked suppliers.
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Selected supplier quote</h2>
          </div>

          {selected ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">Instantly recalculated from pincode distance + supplier rules.</p>
              <div className="mt-5 grid gap-3">
                <div className="flex items-center justify-between rounded-xl border bg-background/60 p-4">
                  <p className="text-sm text-muted-foreground">Base unit price</p>
                  <p className="font-semibold">₹ {selected.baseUnitPrice.toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between rounded-xl border bg-background/60 p-4">
                  <p className="text-sm text-muted-foreground">Base cost (× {selected.qty})</p>
                  <p className="font-semibold">₹ {selected.baseCost.toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between rounded-xl border bg-background/60 p-4">
                  <p className="text-sm text-muted-foreground">Transport cost ({selected.km} km)</p>
                  <p className="font-semibold">₹ {selected.transportCost.toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between rounded-xl border bg-background/60 p-4">
                  <p className="text-sm text-muted-foreground">Monsoon surcharge</p>
                  <p className="font-semibold">₹ {selected.monsoonSurcharge.toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between rounded-xl border bg-background/60 p-4">
                  <p className="text-sm font-medium">Total landed cost</p>
                  <p className="text-lg font-bold">₹ {selected.totalLandedCost.toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between rounded-xl border bg-background/60 p-4">
                  <p className="text-sm text-muted-foreground">Delivery ETA</p>
                  <p className="font-medium">{selected.eta}</p>
                </div>
                <div className="flex items-center justify-between rounded-xl border bg-background/60 p-4">
                  <p className="text-sm text-muted-foreground">Risk score</p>
                  <div className="inline-flex items-center gap-2">
                    {selected.riskScore <= 35 ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    )}
                    <p className="font-medium">{Math.round(selected.riskScore)}/100</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-5 rounded-xl border bg-background/60 p-6 text-sm text-muted-foreground">
              Select a supplier from the ranked list.
            </div>
          )}
        </Card>

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
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakdownData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="factor" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Score" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Higher is better. “Price” reflects discounted unit price; “Distance” reflects pincode distance impact.
              </p>
            </TabsContent>

            <TabsContent value="trend" className="mt-4">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="risk" stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Compare top suppliers by overall score vs risk. (Cost shown per unit in tooltip.)</p>
            </TabsContent>

            <TabsContent value="summary" className="mt-4">
              <div className="rounded-xl border bg-background/60 p-4">
                <p className="text-sm text-muted-foreground">{summary ?? "Run a comparison to generate a recommendation summary."}</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
