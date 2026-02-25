import { NavLink } from "@/components/NavLink";
import { Separator } from "@/components/ui/separator";
import { Building2, Mail, Phone } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-lg font-bold">सही दाम</p>
                <p className="text-xs text-muted-foreground">Trust-driven construction ecosystem</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Verified suppliers, live pricing, delivery-aware comparisons, and AI insights—built for scale across Indian cities.
            </p>
          </div>

          <div className="text-sm">
            <p className="font-semibold">Explore</p>
            <div className="mt-3 grid gap-2 text-muted-foreground">
              <NavLink to="/" className="hover:text-foreground">Home</NavLink>
              <NavLink to="/about" className="hover:text-foreground">About</NavLink>
              <NavLink to="/contact" className="hover:text-foreground">Contact</NavLink>
              <NavLink to="/auth/role" className="hover:text-foreground">Get Started</NavLink>
            </div>
          </div>

          <div className="text-sm">
            <p className="font-semibold">Contact</p>
            <div className="mt-3 grid gap-2 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> demo@sahidam.in
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> +91-XXXXXXXXXX
              </div>
              <p className="text-xs text-muted-foreground">(Demo placeholders — backend next)</p>
            </div>
          </div>
        </div>

        <Separator className="my-8" />
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} सही दाम. All rights reserved.</p>
      </div>
    </footer>
  );
}
