import PublicHeader from "@/components/layout/PublicHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { APP_ROLES } from "@/lib/roles";
import { Store, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const iconForRole: Record<
  "client" | "supplier",
  React.ComponentType<{ className?: string }>
> = {
  client: UserRound,
  supplier: Store,
};

export default function RoleSelect() {
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState<
    "client" | "supplier" | null
  >(null);

  const handleRoleSelect = (role: "client" | "supplier") => {
    setLoadingRole(role);
    navigate(role === "client" ? "/client" : "/supplier");
  };

  return (
    <div className="min-h-screen bg-hero">
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <header className="max-w-3xl">
          <h1 className="text-4xl font-bold md:text-5xl">
            Choose your role
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Client या Supplier चुनें.
          </p>
        </header>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          {APP_ROLES.filter((r) => r.id !== "admin").map((r) => {
            const Icon = iconForRole[r.id as "client" | "supplier"];

            return (
              <Card
                key={r.id}
                className="bg-card/70 p-6 shadow-elevated backdrop-blur"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{r.label}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {r.tagline}
                    </p>
                  </div>
                  <div className="rounded-xl bg-secondary p-2">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <Button
                  className="mt-6 w-full"
                  variant="hero"
                  type="button"
                  disabled={loadingRole === r.id}
                  onClick={() =>
                    handleRoleSelect(r.id as "client" | "supplier")
                  }
                >
                  {loadingRole === r.id ? "Loading..." : "Continue"}
                </Button>
              </Card>
            );
          })}
        </section>
      </main>
    </div>
  );
}