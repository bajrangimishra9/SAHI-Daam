import PublicFooter from "@/components/layout/PublicFooter";
import PublicHeader from "@/components/layout/PublicHeader";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Globe2, Leaf, ShieldCheck } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-hero">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <header className="max-w-3xl">
          <h1 className="text-balance text-4xl font-bold md:text-5xl">हमारा मिशन</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            “सही दाम” का लक्ष्य भारत के construction procurement को transparent, data-driven और trust-first बनाना है.
          </p>
        </header>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Trust & verification</h2>
            </div>
            <p className="mt-3 text-muted-foreground">Supplier docs, certificates, ratings, and admin verification to reduce risk.</p>
          </Card>
          <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
            <div className="flex items-center gap-3">
              <Globe2 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Scale across cities</h2>
            </div>
            <p className="mt-3 text-muted-foreground">Pincode/radius discovery + distance-aware costing built for India.</p>
          </Card>
          <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">AI comparative analytics</h2>
            </div>
            <p className="mt-3 text-muted-foreground">Rankings, charts, and exportable reports with seasonality & risk signals.</p>
          </Card>
          <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
            <div className="flex items-center gap-3">
              <Leaf className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Circular economy</h2>
            </div>
            <p className="mt-3 text-muted-foreground">Recycled materials with traceability + compliance documents.</p>
          </Card>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
