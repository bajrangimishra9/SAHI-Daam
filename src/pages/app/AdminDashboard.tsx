import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { loadDemoStore, saveDemoStore } from "@/demo/store";
import { Ban, CheckCircle2, ClipboardCheck, Settings, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";

export default function AdminDashboard() {
  const store = loadDemoStore();
  const weights = store.rules;

  const demoQueue = useMemo(
    () => [
      { id: "demo-1", name: "Metro Electricals", city: "Delhi", docs: "KYC pending" },
      { id: "demo-2", name: "Narmada Steel Hub", city: "Indore", docs: "Certificates uploaded" },
      { id: "demo-3", name: "GreenCycle Aggregates", city: "Ahmedabad", docs: "Site visit requested" },
    ],
    []
  );

  return (
    <AppLayout role="admin" title="Admin Dashboard">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-6">
          <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">System control center</h1>
                <p className="mt-2 text-sm text-muted-foreground">Verify suppliers, moderate listings, and manage rules.</p>
              </div>
              <Button variant="hero"><ShieldCheck className="mr-2 h-4 w-4" />Admin actions</Button>
            </div>
            <Separator className="my-5" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-background/60 p-4"><p className="font-medium">Platform health</p><p className="mt-1 text-sm text-muted-foreground">Uptime, data freshness (demo).</p></div>
              <div className="rounded-xl border bg-background/60 p-4"><p className="font-medium">Moderation</p><p className="mt-1 text-sm text-muted-foreground">Flagged listings & disputes (demo).</p></div>
            </div>
          </Card>

          <Card id="verify" className="bg-card/70 p-6 shadow-elevated backdrop-blur">
            <div className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" /><h2 className="text-xl font-bold">Verification queue</h2></div>
            <p className="mt-2 text-sm text-muted-foreground">Demo mode: actions update local demo state only.</p>
            <div className="mt-5 grid gap-3">
              {demoQueue.map((s) => (
                <div key={s.id} className="flex flex-col gap-3 rounded-xl border bg-background/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="font-medium">{s.name}</p><p className="text-sm text-muted-foreground">{s.city} • {s.docs}</p></div>
                  <div className="flex gap-2">
                    <Button
                      variant="soft"
                      size="sm"
                      onClick={() => {
                        const next = loadDemoStore();
                        next.supplier.profile.verification = "verified";
                        saveDemoStore(next);
                        toast({ title: "Approved (demo)", description: "Supplier marked verified in demo store." });
                      }}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const next = loadDemoStore();
                        next.supplier.profile.verification = "rejected";
                        saveDemoStore(next);
                        toast({ title: "Rejected (demo)", description: "Supplier marked rejected in demo store." });
                      }}
                    >
                      <Ban className="mr-2 h-4 w-4" />Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card id="rules" className="bg-card/70 p-6 shadow-elevated backdrop-blur">
            <div className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-primary" /><h2 className="text-xl font-bold">Analytics rules</h2></div>
            <p className="mt-2 text-sm text-muted-foreground">Ranking weights (used by AI comparisons).</p>
            <form
              className="mt-5 grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const payload: Record<string, number> = {
                  credibility: Number(fd.get("credibility") ?? 0.35),
                  distance: Number(fd.get("distance") ?? 0.25),
                  monsoon: Number(fd.get("monsoon") ?? 0.2),
                  sla: Number(fd.get("sla") ?? 0.2),
                };
                const next = loadDemoStore();
                next.rules = {
                  credibility: payload.credibility,
                  distance: payload.distance,
                  monsoon: payload.monsoon,
                  sla: payload.sla,
                };
                saveDemoStore(next);
                toast({ title: "Rules saved (demo)" });
              }}
            >
              <div className="grid gap-2"><Label>Credibility weight</Label><Input name="credibility" defaultValue={String(weights.credibility)} /></div>
              <div className="grid gap-2"><Label>Distance weight</Label><Input name="distance" defaultValue={String(weights.distance)} /></div>
              <div className="grid gap-2"><Label>Seasonality/monsoon risk</Label><Input name="monsoon" defaultValue={String(weights.monsoon)} /></div>
              <div className="grid gap-2"><Label>Delivery SLA</Label><Input name="sla" defaultValue={String(weights.sla)} /></div>
              <Button type="submit" variant="hero">Save rules</Button>
            </form>
          </Card>

          <Card id="settings" className="bg-card/70 p-6 shadow-elevated backdrop-blur">
            <div className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /><h2 className="text-xl font-bold">System settings</h2></div>
            <p className="mt-2 text-sm text-muted-foreground">For production, roles must be validated server-side.</p>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
