import { AppRole } from "@/lib/roles";

const KEY = "sahi_dam:selected_role";

export function setSelectedRole(role: AppRole) {
  try {
    sessionStorage.setItem(KEY, role);
  } catch {
    // ignore
  }
}

export function getSelectedRole(): AppRole | null {
  try {
    const v = sessionStorage.getItem(KEY);
    if (v === "client" || v === "supplier" || v === "admin") return v;
    return null;
  } catch {
    return null;
  }
}

export function clearSelectedRole() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
