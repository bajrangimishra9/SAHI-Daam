import AppSidebar from "@/components/app/AppSidebar";
import ProfileMenu from "@/components/app/ProfileMenu";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { clearSelectedRole, getSelectedRole, setSelectedRole } from "@/auth/role-state";
import { AppRole } from "@/lib/roles";
import { Building2, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function AppLayout({ role, title, children }: { role: AppRole; title: string; children: React.ReactNode }) {
  const navigate = useNavigate();

  const onExit = async () => {
    clearSelectedRole();
    navigate("/");
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen w-full bg-hero">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b bg-background/70 px-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="mr-1" />
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-secondary"><Building2 className="h-4 w-4" /></span>
              <span className="font-display text-base font-bold">सही दाम</span>
            </Link>
            <span className="hidden text-sm text-muted-foreground md:inline">/</span>
            <span className="hidden text-sm font-medium md:inline">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground sm:inline-flex">
              Role: <span className="ml-1 font-medium text-foreground">{role}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearSelectedRole();
                navigate("/auth/role");
              }}
            >
              Switch role
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/" onClick={onExit}>
                <LogOut className="mr-2 h-4 w-4" />Exit
              </Link>
            </Button>
          </div>
        </header>
        <div className="flex min-h-[calc(100vh-3.5rem)] w-full">
          <AppSidebar role={role} />
          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
