import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function PublicHeader() {
  const base =
    "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg font-bold">SAHI दाम</p>
            <p className="-mt-1 text-xs text-muted-foreground">AI Construction Materials</p>
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
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="hero">
            <Link to="/auth/role">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
