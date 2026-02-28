import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { ChartLine, ClipboardCheck, Gauge, MapPinned, PackageSearch, Settings, ShieldCheck, Store } from "lucide-react";

type Item = { title: string; url: string; icon: React.ComponentType<{ className?: string }> };

const vendorItems: Item[] = [
  { title: "Overview", url: "/client", icon: Gauge },
  { title: "Marketplace", url: "/client#market", icon: PackageSearch },
  { title: "Map", url: "/client#map", icon: MapPinned },
  { title: "Analytics", url: "/client#analytics", icon: ChartLine },
];

const supplierItems: Item[] = [
  { title: "Dashboard", url: "/supplier", icon: Store },
  { title: "Materials", url: "/supplier#materials", icon: PackageSearch },
  { title: "Verification", url: "/supplier#verification", icon: ClipboardCheck },
  { title: "Settings", url: "/supplier#settings", icon: Settings },
];

const adminItems: Item[] = [
  { title: "Admin Home", url: "/admin", icon: ShieldCheck },
  { title: "Verification", url: "/admin#verify", icon: ClipboardCheck },
  { title: "Rules", url: "/admin#rules", icon: ChartLine },
  { title: "Settings", url: "/admin#settings", icon: Settings },
];

function itemsForRole(role: AppRole): Item[] {
  if (role === "client") return vendorItems;
  if (role === "supplier") return supplierItems;
  return adminItems;
}

export default function AppSidebar({ role }: { role: AppRole }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const items = itemsForRole(role);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{role === "client" ? "Client" : role === "supplier" ? "Supplier" : "Admin"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        "transition-colors",
                      )}
                      activeClassName="bg-muted text-foreground"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
