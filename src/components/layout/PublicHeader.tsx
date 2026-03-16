import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function PublicHeader() {
  const base =
    "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadUserRole = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        if (mounted) {
          setRole(null);
          setLoading(false);
        }
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (mounted) {
        setRole(profile?.role ?? null);
        setLoading(false);
      }
    };

    loadUserRole();

    return () => {
      mounted = false;
    };
  }, []);

  // 🔥 NEW: Get Started logic
  const handleGetStarted = async () => {
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return;
    }

    window.location.href = "/auth/role";
  };

  if (loading) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg font-bold">SAHI दाम</p>
            <p className="-mt-1 text-xs text-muted-foreground">
              Construction Materials
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink end to="/" className={base} activeClassName="text-foreground">
            Home
          </NavLink>

          <NavLink to="/about" className={base} activeClassName="text-foreground">
            About
          </NavLink>

          <NavLink to="/contact" className={base} activeClassName="text-foreground">
            Contact
          </NavLink>

          {role === "admin" && (
            <NavLink
              to="/admin"
              className={base}
              activeClassName="text-foreground"
            >
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="hero" onClick={handleGetStarted}>
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}