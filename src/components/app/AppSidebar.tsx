import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { AppRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import {
  ChartLine, ClipboardCheck, Gauge, MapPinned, Settings, ShieldCheck, Store, Users, Activity, Database, ListOrdered, Upload, FileText, ShoppingCart,
} from "lucide-react";

type Item = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

const vendorItems: Item[] = [
  { title: "Overview", url: "/client", icon: Gauge },
  { title: "Map", url: "/admin/map", icon: MapPinned },
  { title: "Marketplace", url: "/client/marketplace", icon: Store },
  { title: "Analytics", url: "/client/analytics", icon: ChartLine },
  { title: "Orders", url: "/client/orders", icon: ListOrdered },
  { title: "BOQ Generation", url: "/client/boq-generation", icon: FileText },
  { title: "Upload Drawing", url: "/client/upload-drawing", icon: Upload },
  { title: "Bill of Quantities", url: "/client/bill-of-quantities", icon: FileText },
  { title: "AI Procurement", url: "/client/ai-procurement", icon: ShoppingCart },
  { title: "Settings", url: "/client/quantify-settings", icon: Settings },
];

const supplierItems: Item[] = [
  { title: "Dashboard", url: "/supplier", icon: Store },
  { title: "Map", url: "/admin/map", icon: MapPinned },
  { title: "Materials", url: "/supplier/materials", icon: Database },
  { title: "Verification", url: "/supplier/verification", icon: ClipboardCheck },
  { title: "Settings", url: "/supplier/settings", icon: Settings },
  { title: "Orders", url: "/supplier/orders", icon: ListOrdered },
];

const adminItems: Item[] = [
  { title: "Dashboard", url: "/admin", icon: Gauge },
  { title: "Map Intelligence", url: "/admin/map", icon: MapPinned },
  { title: "Suppliers", url: "/admin/suppliers", icon: Users },
  { title: "Verification", url: "/admin/verification", icon: ClipboardCheck },
  { title: "Pricing Engine", url: "/admin/rules", icon: ChartLine },
  { title: "Analytics", url: "/admin/analytics", icon: Activity },
  { title: "System Settings", url: "/admin/settings", icon: Settings },
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
    <Sidebar
      collapsible="icon"
      className="fixed top-14 left-0 h-[calc(100vh-3.5rem)]"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {role === "client"
              ? "Client"
              : role === "supplier"
                ? "Supplier"
                : "Admin"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                        "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                        "transition-colors"
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
