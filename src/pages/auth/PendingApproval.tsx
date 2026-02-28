import PublicHeader from "@/components/layout/PublicHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/auth/session";
import { useNavigate } from "react-router-dom";

export default function PendingApproval() {
  const { user } = useSession();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-hero">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-4xl font-bold md:text-5xl">Approval pending</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Your account is created, but your role access will be enabled after admin approval.
        </p>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
            <p className="text-sm font-medium">Signed in as</p>
            <p className="mt-2 font-mono text-sm text-muted-foreground">{user?.email ?? "—"}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Once approved, you can refresh and proceed to your dashboard.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="hero" onClick={() => window.location.reload()}>
                Refresh
              </Button>
              <Button variant="outline" onClick={signOut}>
                Sign out
              </Button>
            </div>
          </Card>

          <Card className="bg-card/70 p-6 shadow-elevated backdrop-blur">
            <p className="text-sm font-medium">Map integration</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Location features currently run on pincode + radius logic. Map-based geolocation (Google Maps) will be added later.
            </p>
          </Card>
        </section>
      </main>
    </div>
  );
}
