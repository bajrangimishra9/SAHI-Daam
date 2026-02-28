import { buildDemoMarketplace } from "@/demo/marketplace";
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
import {
  exportProcurementCsv,
  exportProcurementPdf,
  type PreferenceLevel,
  type ProcurementLine,
  type ProcurementSupplierRow,
} from "@/lib/reporting";
import { CheckCircle2, Plus, ShieldAlert, Sparkles, Trash2, Truck } from "lucide-react";
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
import type { ComparisonPreferences, SupplierSnapshot } from "@/lib/comparison";
import { quoteSupplier } from "@/lib/comparison";

type LineItem = { id: string; query: string; qty: number };

type ItemBestQuote = ReturnType<typeof quoteSupplier> & { lineItemId: string; lineItemQuery: string };

type SupplierAggregate = {
  supplierId: string;
  supplierName: string;
  supplierPincode: string;
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

export default function ClientComparison() {
  const market = useMemo(() => buildDemoMarketplace(), []);

  const [vendorPincode, setVendorPincode] = useState("411001");
  const [radiusKm, setRadiusKm] = useState(50);

  const [items, setItems] = useState<LineItem[]>([
    { id: uid(), query: "cement", qty: 50 },
    { id: uid(), query: "steel", qty: 200 },
  ]);

  const [prefs, setPrefs] = useState<ComparisonPreferences>({
    prioritizePrice: 0.5,
    prioritizeSpeed: 0.3,
    prioritizeLowRisk: 0.2,
  });

  const [hasRun, setHasRun] = useState(false);
  const [snapshotsByItem, setSnapshotsByItem] = useState<Record<string, SupplierSnapshot[]>>({});
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const runComparison = () => {
    if (!isValidPincode(vendorPincode)) {
      toast({ title: "Invalid pincode", description: "Enter a 6-digit pincode.", variant: "destructive" });
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
        .filter((s) => s.profile.discoverable)
        .flatMap((s) =>
          s.materials
            .filter((m) => m.name.toLowerCase().includes(q))
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
        );
    }

    setSnapshotsByItem(next);
    setHasRun(true);
  };

  const aggregates = useMemo((): SupplierAggregate[] => {
    if (!hasRun) return [];

    const bySupplier: Record<string, SupplierAggregate> = {};

    const lineItems: Array<{ id: string; query: string; qty: number }> = items
      .filter((i) => i.query.trim() && i.qty > 0)
      .map((i) => ({ ...i, query: i.query.trim() }));

    for (const it of lineItems) {
      const snaps = snapshotsByItem[it.id] ?? [];
      if (!snaps.length) continue;

      const unitPrices = snaps.map((s) => Number(s.material.unit_base_price ?? 0));
      const marketMinUnitPrice = Math.min(...unitPrices);
      const marketMaxUnitPrice = Math.max(...unitPrices);

      // group by supplier and keep best quote per supplier for this item
      const perSupplier = new Map<string, ItemBestQuote>();
      for (const snap of snaps) {
        const q = quoteSupplier({
          vendorPincode,
          qty: it.qty,
          snapshot: snap,
          prefs,
          marketMinUnitPrice,
          marketMaxUnitPrice,
        });
        if (q.km > radiusKm) continue;

        const prev = perSupplier.get(q.supplierId);
        const nextQ: ItemBestQuote = { ...q, lineItemId: it.id, lineItemQuery: it.query };
        if (!prev || nextQ.score > prev.score) perSupplier.set(q.supplierId, nextQ);
      }

      for (const [supplierId, best] of perSupplier.entries()) {
        const sup = market.find((s) => s.id === supplierId);
        if (!sup) continue;
        if (!bySupplier[supplierId]) {
          bySupplier[supplierId] = {
            supplierId,
            supplierName: sup.profile.business_name,
            supplierPincode: sup.profile.pincode,
            verification: sup.profile.verification,
            rating: sup.profile.rating,
            pastClients: sup.profile.past_clients,
            docsCount: sup.profile.docs_count,
            km: best.km,
            totalLandedCost: 0,
            riskScore: 0,
            score: 0,
            eta: "48–72h",
            items: [],
          };
        }
        bySupplier[supplierId]!.items.push(best);
      }
    }

    const result = Object.values(bySupplier)
      .map((s) => {
        const total = s.items.reduce((sum, it) => sum + it.totalLandedCost, 0);
        const avgRisk = s.items.reduce((sum, it) => sum + it.riskScore, 0) / Math.max(1, s.items.length);
        const avgScore = s.items.reduce((sum, it) => sum + it.score, 0) / Math.max(1, s.items.length);
        return {
          ...s,
          totalLandedCost: total,
          riskScore: avgRisk,
          score: avgScore,
          eta: pickWorstEta(s.items),
        };
      })
      // require coverage: must have a quote for every requested item
      .filter((s) => s.items.length === items.filter((i) => i.query.trim() && i.qty > 0).length)
      .sort((a, b) => b.score - a.score);

    return result;
  }, [hasRun, items, market, prefs, radiusKm, snapshotsByItem, vendorPincode]);

  const selected = useMemo(
    () => aggregates.find((a) => a.supplierId === selectedSupplierId) ?? aggregates[0] ?? null,
    [aggregates, selectedSupplierId],
  );

  const prefsLevels = useMemo(
    () => ({
      price: levelFromPct(prefs.prioritizePrice),
      speed: levelFromPct(prefs.prioritizeSpeed),
      risk: levelFromPct(prefs.prioritizeLowRisk),
    }),
    [prefs],
  );

  const breakdownData = useMemo(() => {
    const first = selected?.items?.[0];
    if (!first) return [];
    const b = first.breakdown;
    return [
      { factor: "Price", value: Math.round(b.priceCompetitiveness) },
      { factor: "Distance", value: Math.round(b.distanceImpact) },
      { factor: "Logistics", value: Math.round(b.logisticsReliability) },
      { factor: "Credibility", value: Math.round(b.credibilityStrength) },
      { factor: "Monsoon", value: Math.round(b.monsoonRisk) },
    ];
  }, [selected]);

  const trendData = useMemo(() => {
    return aggregates.slice(0, 5).map((q, i) => ({
      name: `#${i + 1}`,
      score: Math.round(q.score),
      risk: Math.round(q.riskScore),
    }));
  }, [aggregates]);

  const summary = useMemo(() => {
    if (!aggregates.length) return "Run a comparison to generate a recommendation summary.";
    const top = aggregates[0]!;
    const itemsText = top.items
      .map((it) => `${it.lineItemQuery}: ₹${Math.round(it.totalLandedCost).toLocaleString()} (${it.km}km)`)
      .join(" • ");
    return `Top pick is ${top.supplierName}. It covers all selected items with a balanced score (≈${Math.round(top.score)}/100) and average risk (${Math.round(
      top.riskScore,
    )}/100). Item totals: ${itemsText}.`;
  }, [aggregates]);

  const exportRows: ProcurementSupplierRow[] = useMemo(
    () =>
      aggregates.map((a) => ({
        supplierName: a.supplierName,
        supplierPincode: a.supplierPincode,
        verification: a.verification,
        rating: a.rating,
        pastClients: a.pastClients,
        docsCount: a.docsCount,
        distanceKm: a.km,
        eta: a.eta,
        riskScore: a.riskScore,
        totalLandedCost: a.totalLandedCost,
        score: a.score,
      })),
    [aggregates],
  );

  const exportItems: ProcurementLine[] = useMemo(
    () => items.filter((i) => i.query.trim() && i.qty > 0).map((i) => ({ materialQuery: i.query.trim(), qty: i.qty })),
    [items],
  );

  const onExportCsv = () => {
    if (!aggregates.length) return;
    exportProcurementCsv({
      projectName: "SAHI दाम",
      vendorPincode,
      radiusKm,
      items: exportItems,
      prefs: prefsLevels,
      suppliers: exportRows,
      summary,
    });
  };

  const onExportPdf = () => {
    if (!aggregates.length) return;
    exportProcurementPdf({
      projectName: "SAHI दाम",
      vendorPincode,
      radiusKm,
      items: exportItems,
      prefs: prefsLevels,
      suppliers: exportRows,
      summary,
    });
  };

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
              <Button variant="outline" onClick={onExportCsv} disabled={!aggregates.length}>
                Download CSV
              </Button>
              <Button variant="outline" onClick={onExportPdf} disabled={!aggregates.length}>
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
              <Label htmlFor="pincode">Delivery pincode</Label>
              <Input id="pincode" value={vendorPincode} onChange={(e) => setVendorPincode(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Delivery radius: {radiusKm} km</Label>
              <Slider value={[radiusKm]} min={5} max={120} step={5} onValueChange={(v) => setRadiusKm(v[0] ?? 50)} />
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
                onClick={() => setItems((prev) => [...prev, { id: uid(), query: "", qty: 1 }])}
              >
                <Plus className="mr-2 h-4 w-4" /> Add item
              </Button>
            </div>
            <div className="mt-4 grid gap-3">
              {items.map((it) => (
                <div key={it.id} className="grid gap-3 rounded-xl border bg-background/60 p-4 md:grid-cols-[1fr_140px_44px]">
                  <div className="grid gap-2">
                    <Label>Material</Label>
                    <Input value={it.query} onChange={(e) => setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, query: e.target.value } : p)))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      value={it.qty}
                      onChange={(e) =>
                        setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, qty: Math.max(1, Number(e.target.value || 1)) } : p)))
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setItems((prev) => prev.filter((p) => p.id !== it.id))}
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

          <div className="mt-5 grid gap-3">
            {aggregates.length ? (
              aggregates.map((q, idx) => {
                const isSelected = q.supplierId === (selected?.supplierId ?? null);
                const vBadge = riskLabel(q.verification);
                return (
                  <button
                    key={q.supplierId}
                    type="button"
                    onClick={() => setSelectedSupplierId(q.supplierId)}
                    className={cn(
                      "text-left",
                      "rounded-xl border bg-background/60 p-4 transition",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected && "border-primary/50 shadow-elevated",
                    )}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">#{idx + 1} {q.supplierName}</p>
                          <Badge variant={vBadge.variant}>{vBadge.label}</Badge>
                          <Badge variant="secondary">Score {Math.round(q.score)}/100</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Covers {q.items.length} items • {q.km} km • ETA {q.eta}
                        </p>
                        <p className="mt-2 text-sm">
                          <span className="text-muted-foreground">Total landed:</span> <span className="font-semibold">₹ {Math.round(q.totalLandedCost).toLocaleString()}</span>
                          <span className="mx-2 text-muted-foreground">•</span>
                          <span className="text-muted-foreground">Risk:</span> <span className="font-medium">{Math.round(q.riskScore)}/100</span>
                        </p>
                      </div>
                      {q.items[0]?.imageUrl ? (
                        <img
                          src={q.items[0].imageUrl}
                          alt={`${q.items[0].materialLabel} image`}
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
                Click “Run AI Comparison” to see ranked suppliers.
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
              <p className="mt-2 text-sm text-muted-foreground">All costs update from pincode distance + slab transport rules.</p>
              <div className="mt-5 grid gap-3">
                {selected.items.map((it) => (
                  <div key={it.lineItemId} className="rounded-xl border bg-background/60 p-4">
                    <p className="text-sm font-medium">{it.lineItemQuery}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{it.materialLabel}</p>
                    <div className="mt-3 grid gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Base cost</span>
                        <span className="font-medium">₹ {Math.round(it.baseCost).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Transport ({it.km} km)</span>
                        <span className="font-medium">₹ {Math.round(it.transportCost).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Monsoon</span>
                        <span className="font-medium">₹ {Math.round(it.monsoonSurcharge).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-semibold">₹ {Math.round(it.totalLandedCost).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between rounded-xl border bg-background/60 p-4">
                  <p className="text-sm font-medium">Grand total</p>
                  <p className="text-lg font-bold">₹ {Math.round(selected.totalLandedCost).toLocaleString()}</p>
                </div>

                <div className="flex items-center justify-between rounded-xl border bg-background/60 p-4">
                  <p className="text-sm text-muted-foreground">Delivery ETA</p>
                  <p className="font-medium">{selected.eta}</p>
                </div>
                <div className="flex items-center justify-between rounded-xl border bg-background/60 p-4">
                  <p className="text-sm text-muted-foreground">Risk score (avg)</p>
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
            <div className="mt-5 rounded-xl border bg-background/60 p-6 text-sm text-muted-foreground">Select a supplier from the ranked list.</div>
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
              <p className="mt-3 text-sm text-muted-foreground">Breakdown shown for the first item in the selection.</p>
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
              <p className="mt-3 text-sm text-muted-foreground">Top suppliers by overall score vs average risk.</p>
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
