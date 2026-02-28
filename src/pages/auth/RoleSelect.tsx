import PublicHeader from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { setSelectedRole } from "@/auth/role-state";
import { APP_ROLES, AppRole } from "@/lib/roles";
import { ShieldCheck, Store, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

const iconForRole: Record<AppRole, React.ComponentType<{ className?: string }>> = {
  client: UserRound,
  supplier: Store,
  admin: ShieldCheck,
};

export default function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-hero">
      <PublicHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <header className="max-w-3xl">
          <h1 className="text-4xl font-bold md:text-5xl">Choose your role</h1>
          <p className="mt-4 text-lg text-muted-foreground">Client, Supplier, या Admin चुनें.</p>
        </header>
        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {APP_ROLES.map((r) => {
            const Icon = iconForRole[r.id];
            return (
              <Card key={r.id} className="bg-card/70 p-6 shadow-elevated backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{r.label}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{r.tagline}</p>
                  </div>
                  <div className="rounded-xl bg-secondary p-2"><Icon className="h-5 w-5" /></div>
                </div>
                <Button
                  className="mt-6 w-full"
                  variant="hero"
                  type="button"
                  onClick={() => {
                    setSelectedRole(r.id);
                    navigate(r.id === "client" ? "/client" : r.id === "supplier" ? "/supplier" : "/admin");
                  }}
                >
                  Continue
                </Button>
              </Card>
            );
          })}
        </section>
      </main>
    </div>
  );
}
