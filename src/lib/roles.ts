export type AppRole = "client" | "supplier" | "admin";

export const APP_ROLES: Array<{ id: AppRole; label: string; tagline: string }> = [
  { id: "client", label: "Client", tagline: "Compare nearby suppliers & optimize procurement" },
  { id: "supplier", label: "Supplier", tagline: "Manage listings, pricing, logistics & verification" },
  { id: "admin", label: "Admin", tagline: "Verify suppliers, moderate listings & oversee analytics" },
];

export function roleToDashboardPath(role: AppRole) {
  if (role === "client") return "/client";
  if (role === "supplier") return "/supplier";
  return "/admin";
}
