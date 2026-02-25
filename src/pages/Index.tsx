import { ArrowRight, BadgeCheck, BellRing, ChartLine, CircleDashed, Factory, MapPinned, Recycle, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import PublicFooter from "@/components/layout/PublicFooter";
import PublicHeader from "@/components/layout/PublicHeader";
import SignatureSpotlight from "@/components/motion/SignatureSpotlight";
import MaterialSearchBar from "@/components/material/MaterialSearchBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const categories = [
  { name: "Cement", note: "OPC/PPC • Bulk & retail" },
  { name: "Steel", note: "TMT, structural" },
  { name: "Bricks", note: "Fly ash • Clay" },
  { name: "Sand", note: "M-sand • River" },
  { name: "Electricals", note: "Cables • Switchgear" },
  { name: "Recycled", note: "Circular materials" },
];

const suppliers = [
  { name: "Shakti Buildmart", city: "Pune", score: 4.7, badge: "Verified" },
  { name: "Narmada Steel Hub", city: "Indore", score: 4.6, badge: "Trusted" },
  { name: "GreenCycle Aggregates", city: "Ahmedabad", score: 4.8, badge: "Recycled" },
  { name: "Metro Electricals", city: "Delhi", score: 4.5, badge: "Fast delivery" },
];

const livePricing = [
  { material: "TMT 12mm", rate: "₹ 58/kg", delta: "+2.1% WoW", note: "Demand spike" },
  { material: "Cement (50kg)", rate: "₹ 395/bag", delta: "-1.4% WoW", note: "Inventory up" },
  { material: "M-sand", rate: "₹ 1,450/ton", delta: "+0.8% WoW", note: "Seasonal" },
  { material: "Fly-ash bricks", rate: "₹ 6.2/pc", delta: "-0.5% WoW", note: "Local supply" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-hero">
      <PublicHeader />

      <main>
        <SignatureSpotlight>
          <section className="relative overflow-hidden">
            <div className="mx-auto max-w-6xl px-6 pb-14 pt-10 md:pb-20 md:pt-14">
              <div className="grid items-start gap-10 md:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <Badge className="bg-secondary text-secondary-foreground" variant="secondary">
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI-powered material marketplace
                  </Badge>

                  <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.05] md:text-6xl">
                    सही material, सही rate, सही vendor
                  </h1>
                  <p className="mt-5 max-w-2xl text-balance text-lg text-muted-foreground md:text-xl">
                    “सही दाम” भारत के शहरों में construction materials के लिए एक trust-driven platform है — live pricing,
                    verified suppliers, distance-aware comparisons, और AI insights के साथ.
                  </p>

                  <div className="mt-7 max-w-2xl">
                    <MaterialSearchBar />
                    <p className="mt-3 text-sm text-muted-foreground">
                      उदाहरण: “Cement PPC 50kg”, “TMT 12mm”, “M-sand”, “Recycled aggregates”
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Button asChild variant="hero" size="xl">
                      <Link to="/auth/role">
                        Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="glass" size="xl">
                      <Link to="/contact">Schedule Demo</Link>
                    </Button>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="inline-flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" /> Verified supplier onboarding
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <ChartLine className="h-4 w-4 text-primary" /> Live trends + seasonality
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <MapPinned className="h-4 w-4 text-primary" /> Distance-aware delivery costing
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="rounded-2xl border bg-card/70 p-5 shadow-elevated backdrop-blur">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">AI Assistant Preview</p>
                        <p className="text-sm text-muted-foreground">Instant comparisons + risk notes</p>
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs">
                        <CircleDashed className="h-3.5 w-3.5" /> Live
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="space-y-3">
                      <div className="rounded-xl border bg-background/60 p-3">
                        <p className="text-xs text-muted-foreground">You</p>
                        <p className="mt-1 text-sm">Pune (411001) के लिए Cement PPC 50kg के best options दिखाओ.</p>
                      </div>
                      <div className="rounded-xl border bg-background/60 p-3">
                        <p className="text-xs text-muted-foreground">सही दाम AI</p>
                        <p className="mt-1 text-sm">
                          3 verified suppliers मिले. Best value: <span className="font-medium">₹395/bag</span> (12km).
                          Rain-season risk: <span className="font-medium">Low</span>. Suggested order window: <span className="font-medium">next 3 days</span>.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge className="bg-secondary" variant="secondary">
                            Credibility: High
                          </Badge>
                          <Badge className="bg-secondary" variant="secondary">
                            Delivery: 24–48h
                          </Badge>
                          <Badge className="bg-secondary" variant="secondary">
                            Seasonal: -1.4% WoW
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pointer-events-none absolute -bottom-6 -right-6 hidden h-24 w-24 rounded-3xl bg-cta opacity-80 blur-2xl md:block" />
                </div>
              </div>
            </div>
          </section>
        </SignatureSpotlight>

        <section className="mx-auto max-w-6xl px-6 pb-14">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
              <p className="text-sm font-medium">Customer savings</p>
              <p className="mt-2 text-3xl font-bold">8–18%</p>
              <p className="mt-2 text-sm text-muted-foreground">AI comparisons + verified vendors reduce leakage & price dispersion.</p>
            </Card>
            <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
              <p className="text-sm font-medium">Avg. delivery accuracy</p>
              <p className="mt-2 text-3xl font-bold">94%</p>
              <p className="mt-2 text-sm text-muted-foreground">Range-based discoverability + logistics capacity signals.</p>
            </Card>
            <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
              <p className="text-sm font-medium">Verified suppliers</p>
              <p className="mt-2 text-3xl font-bold">1,200+</p>
              <p className="mt-2 text-sm text-muted-foreground">Certificates, past records, ratings & admin moderation.</p>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Featured material categories</h2>
              <p className="mt-2 text-muted-foreground">Search, compare, and order—city by city.</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/auth/role">Explore all</Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Card key={c.name} className="group bg-card/70 p-5 shadow-elevated backdrop-blur transition-transform hover:-translate-y-0.5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold">{c.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{c.note}</p>
                  </div>
                  <div className="rounded-xl bg-secondary p-2 text-secondary-foreground">
                    <Factory className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">Nearby suppliers • trends • delivery-aware comparisons</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-14">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-secondary p-2">
                  <ChartLine className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Highlighted materials with live pricing</h2>
                  <p className="text-sm text-muted-foreground">Auto-updated market + vendor quotes (demo data)</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {livePricing.map((m) => (
                  <div key={m.material} className="flex items-center justify-between rounded-xl border bg-background/60 p-4">
                    <div>
                      <p className="font-medium">{m.material}</p>
                      <p className="text-sm text-muted-foreground">{m.note}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{m.rate}</p>
                      <p className="text-sm text-muted-foreground">{m.delta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-secondary p-2">
                  <BellRing className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Smart alerts + trend analytics</h2>
                  <p className="text-sm text-muted-foreground">Set thresholds for rate drops/spikes & seasonality</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <div className="rounded-xl border bg-background/60 p-4">
                  <p className="font-medium">Monsoon risk watch</p>
                  <p className="mt-1 text-sm text-muted-foreground">If sand/cement freight cost rises, suggest alternate suppliers within radius.</p>
                </div>
                <div className="rounded-xl border bg-background/60 p-4">
                  <p className="font-medium">Auto vendor shortlist</p>
                  <p className="mt-1 text-sm text-muted-foreground">Credibility, delivery timelines, and historical performance included.</p>
                </div>
                <div className="rounded-xl border bg-background/60 p-4">
                  <p className="font-medium">Downloadable analysis reports</p>
                  <p className="mt-1 text-sm text-muted-foreground">Rankings, charts, and assumptions—ready for procurement teams.</p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <Card className="relative overflow-hidden bg-card/70 p-8 shadow-elevated backdrop-blur">
            <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h2 className="text-2xl font-bold md:text-3xl">Circular economy & recycled materials</h2>
                <p className="mt-3 text-muted-foreground">
                  Recycled aggregates, fly-ash bricks, reclaimed steel—quality signals + compliance docs with verified suppliers.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Badge className="bg-secondary" variant="secondary">
                    <Recycle className="mr-2 h-4 w-4" /> Traceability
                  </Badge>
                  <Badge className="bg-secondary" variant="secondary">
                    <BadgeCheck className="mr-2 h-4 w-4" /> Certificates
                  </Badge>
                  <Badge className="bg-secondary" variant="secondary">
                    <ShieldCheck className="mr-2 h-4 w-4" /> Compliance-ready
                  </Badge>
                </div>
              </div>

              <div className="rounded-2xl border bg-background/60 p-6">
                <p className="text-sm font-medium">Top verified suppliers</p>
                <div className="mt-4 space-y-3">
                  {suppliers.map((s) => (
                    <div key={s.name} className="flex items-center justify-between rounded-xl border bg-background/60 px-4 py-3">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-sm text-muted-foreground">{s.city} • {s.badge}</p>
                      </div>
                      <Badge className="bg-secondary" variant="secondary">
                        {s.score.toFixed(1)} ★
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button asChild className="mt-5 w-full" variant="soft">
                  <Link to="/auth/role">View marketplace</Link>
                </Button>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cta opacity-30 blur-3xl" />
          </Card>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Index;
