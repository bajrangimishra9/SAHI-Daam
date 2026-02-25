import { AppRole } from "@/lib/roles";

const KEY = "sahi_dam:demo_store_v1";

export type DemoSupplierProfile = {
  business_name: string;
  pincode: string;
  service_radius_km: number;
  discoverable: boolean;
  verification: "pending" | "verified" | "rejected";
  // Demo-only credibility signals (no-login mode)
  rating?: number; // 0..5
  past_clients?: number;
};

export type DemoMaterial = {
  id: string;
  name: string;
  category: "civil" | "electrical" | "machinery";
  brand?: string;
  grade_strength?: string;
  unit_base_price: number;
  transport_params: any;
  bulk_discount_rules: any;
  monsoon_price_rise_pct: number;
  available_stock?: number;
  delivery_sla?: string;
  image_urls?: string[];
  created_at: string;
};

export type DemoDoc = {
  id: string;
  doc_type: string;
  file_name: string;
  created_at: string;
};

export type DemoRulesWeights = {
  credibility: number;
  distance: number;
  monsoon: number;
  sla: number;
};

export type DemoStore = {
  rules: DemoRulesWeights;
  supplier: {
    profile: DemoSupplierProfile;
    materials: DemoMaterial[];
    documents: DemoDoc[];
  };
};

const defaultStore: DemoStore = {
  rules: { credibility: 0.35, distance: 0.25, monsoon: 0.2, sla: 0.2 },
  supplier: {
    profile: {
      business_name: "Shakti Buildmart",
      pincode: "411001",
      service_radius_km: 50,
      discoverable: true,
      verification: "pending",
      rating: 4.3,
      past_clients: 28,
    },
    materials: [
      {
        id: crypto.randomUUID(),
        name: "Cement PPC 50kg",
        category: "civil",
        brand: "Demo",
        grade_strength: "PPC",
        unit_base_price: 395,
        transport_params: { per_km: 3.2, base: 0 },
        bulk_discount_rules: [{ min_qty: 50, discount_pct: 2 }],
        monsoon_price_rise_pct: 6,
        available_stock: 500,
        delivery_sla: "24–48h",
        image_urls: ["/placeholder.svg"],
        created_at: new Date().toISOString(),
      },
    ],
    documents: [],
  },
};

export function loadDemoStore(): DemoStore {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return structuredClone(defaultStore);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(defaultStore), ...parsed };
  } catch {
    return structuredClone(defaultStore);
  }
}

export function saveDemoStore(next: DemoStore) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function resetDemoStore() {
  saveDemoStore(structuredClone(defaultStore));
}

export function isDemoAdmin(role: AppRole | null) {
  return role === "admin";
}
