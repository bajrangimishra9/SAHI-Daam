import PublicHeader from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { AppRole, roleToDashboardPath } from "@/lib/roles";
import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(200),
});

function asRole(value: string | null): AppRole | null {
  if (value === "client" || value === "supplier" || value === "admin") return value;
  return null;
}

export default function Login() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const role = useMemo(() => asRole(params.get("role")), [params]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = { email: String(fd.get("email") ?? ""), password: String(fd.get("password") ?? "") };
    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) {
      toast({ title: "Invalid credentials", description: parsed.error.issues[0]?.message, variant: "destructive" });
      return;
    }
    if (!role) {
      toast({
        title: "Select role first",
        description: "Please choose a role before signing in.",
        variant: "destructive",
      });
      navigate("/auth/role");
      return;
    }
    toast({ title: "Signed in (demo)", description: `Routing to ${role} dashboard.` });
    navigate(roleToDashboardPath(role));
  };

  return (
    <div className="min-h-screen bg-hero">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <header className="max-w-2xl">
          <h1 className="text-4xl font-bold md:text-5xl">Sign in</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Role: <span className="font-medium text-foreground">{role ?? "not selected"}</span>
          </p>
        </header>
        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
            <form className="grid gap-4" onSubmit={onSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" placeholder="you@company.com" autoComplete="email" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" autoComplete="current-password" />
              </div>
              <Button type="submit" variant="hero" size="lg">
                Continue
              </Button>
              <p className="text-xs text-muted-foreground">Demo routing only. Production security comes with Cloud.</p>
            </form>
          </Card>
          <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
            <h2 className="text-xl font-bold">After login</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>• Client: location/radius, supplier map/list, analytics, reports.</li>
              <li>• Supplier: listings, pricing, logistics, documents, verification.</li>
              <li>• Admin: verification queue, rule weights, moderation.</li>
            </ul>
          </Card>
        </section>
      </main>
    </div>
  );
}
