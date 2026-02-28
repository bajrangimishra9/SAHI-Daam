import AppSidebar from "@/components/app/AppSidebar";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { clearSelectedRole } from "@/auth/role-state";
import { AppRole } from "@/lib/roles";
import { Building2, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function AppLayout({
  role,
  title,
  children,
}: {
  role: AppRole;
  title: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();

  const onExit = () => {
    clearSelectedRole();
    navigate("/");
  };

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen w-full bg-hero">
        {/* ✅ FIXED HEADER */}
        <header className="fixed top-0 left-0 w-full z-50 flex h-14 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="mr-1" />
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-secondary">
                <Building2 className="h-4 w-4" />
              </span>
              <span className="font-display text-base font-bold">
                सही दाम
              </span>
            </Link>
            <span className="hidden text-sm text-muted-foreground md:inline">
              /
            </span>
            <span className="hidden text-sm font-medium md:inline">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground sm:inline-flex">
              Role:
              <span className="ml-1 font-medium text-foreground">
                {role}
              </span>
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
                <LogOut className="mr-2 h-4 w-4" />
                Exit
              </Link>
            </Button>
          </div>
        </header>

        {/* ✅ BODY WRAPPER (pushed below header) */}
        <div className="flex w-full pt-14 min-h-screen">
          {/* Sidebar automatically aligns below header now */}
          <AppSidebar role={role} />

          {/* Main content */}
          <main className="flex-1 px-6 py-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
