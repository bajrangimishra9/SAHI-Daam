import PublicFooter from "@/components/layout/PublicFooter";
import PublicHeader from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(10).max(1000),
});

export default function Contact() {
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      message: String(fd.get("message") ?? ""),
    };
    const parsed = contactSchema.safeParse(raw);
    if (!parsed.success) {
      toast({ title: "Please check details", description: parsed.error.issues[0]?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Request received", description: "Demo mode: backend not connected yet." });
    e.currentTarget.reset();
  };

  return (
    <div className="min-h-screen bg-hero">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <header className="max-w-2xl">
          <h1 className="text-4xl font-bold md:text-5xl">Contact us</h1>
          <p className="mt-4 text-lg text-muted-foreground">Demo, partnerships, या city onboarding के लिए संदेश भेजें.</p>
        </header>
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
            <h2 className="text-xl font-bold">Schedule a demo</h2>
            <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="Your name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" placeholder="you@company.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">What do you need?</Label>
                <Textarea id="message" name="message" placeholder="Tell us your city, materials, volumes..." rows={5} />
              </div>
              <Button type="submit" variant="hero" size="lg">Send request</Button>
            </form>
          </Card>
          <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
            <h2 className="text-xl font-bold">Ready to Get Started?</h2>
            <p className="mt-2 text-muted-foreground">
              See how delivery-aware pricing, verified suppliers, and transparent cost
              breakdowns can simplify your construction procurement.
              Schedule a demo and experience smarter sourcing with Sahi Daam.
            </p>
          </Card>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
