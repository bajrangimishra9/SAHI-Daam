import { loadDemoStore } from "@/demo/store";
import type { SupplierSnapshot } from "@/lib/comparison";

export type MarketSupplier = {
  id: string;
  profile: {
    business_name: string;
    pincode: string;
    service_radius_km: number;
    discoverable: boolean;
    verification: "pending" | "verified" | "rejected";
    rating: number;
    past_clients: number;
    docs_count: number;
  };
  materials: SupplierSnapshot["material"][];
};

/**
 * Demo marketplace: combines the editable supplier from session demo store
 * with a few fixture suppliers so comparisons always have multiple options.
 */
export function buildDemoMarketplace(): MarketSupplier[] {
  const store = loadDemoStore();

  const editableSupplier: MarketSupplier = {
    id: "supplier:me",
    profile: {
      business_name: store.supplier.profile.business_name,
      pincode: store.supplier.profile.pincode,
      service_radius_km: store.supplier.profile.service_radius_km,
      discoverable: store.supplier.profile.discoverable,
      verification: store.supplier.profile.verification,
      rating: store.supplier.profile.rating ?? 4,
      past_clients: store.supplier.profile.past_clients ?? 12,
      docs_count: store.supplier.documents.length,
    },
    materials: (store.supplier.materials ?? []).map((m: any) => ({
      materialId: m.id,
      name: m.name,
      category: m.category,
      brand: m.brand ?? null,
      grade_strength: m.grade_strength ?? null,
      unit_base_price: Number(m.unit_base_price ?? 0),
      transport_params: m.transport_params ?? {},
      bulk_discount_rules: m.bulk_discount_rules ?? [],
      monsoon_price_rise_pct: Number(m.monsoon_price_rise_pct ?? 0),
      available_stock: m.available_stock ?? null,
      delivery_sla: m.delivery_sla ?? null,
      image_urls: m.image_urls ?? [],
    })),
  };

  const fixtures: MarketSupplier[] = [
    {
      id: "supplier:metro",
      profile: {
        business_name: "Metro Materials",
        pincode: "411004",
        service_radius_km: 40,
        discoverable: true,
        verification: "verified",
        rating: 4.6,
        past_clients: 73,
        docs_count: 5,
      },
      materials: [
        {
          materialId: "metro-cement-1",
          name: "Cement OPC 53 50kg",
          category: "civil",
          brand: "MetroPro",
          grade_strength: "OPC 53",
          unit_base_price: 408,
          transport_params: {
            base: 60,
            slabs: [
              { up_to_km: 10, per_km: 2.4 },
              { up_to_km: 25, per_km: 2.8 },
              { up_to_km: 9999, per_km: 3.4 },
            ],
          },
          bulk_discount_rules: [{ min_qty: 60, discount_pct: 3 }],
          monsoon_price_rise_pct: 4,
          available_stock: 1200,
          delivery_sla: "24–48h",
          image_urls: ["/placeholder.svg"],
        },
        {
          materialId: "metro-steel-1",
          name: "TMT Steel 12mm",
          category: "civil",
          brand: "MetroTMT",
          grade_strength: "Fe500D",
          unit_base_price: 62,
          transport_params: {
            base: 80,
            slabs: [
              { up_to_km: 10, per_km: 1.2 },
              { up_to_km: 25, per_km: 1.6 },
              { up_to_km: 9999, per_km: 2.2 },
            ],
          },
          bulk_discount_rules: [{ min_qty: 300, discount_pct: 2 }],
          monsoon_price_rise_pct: 3,
          available_stock: 2000,
          delivery_sla: "48–72h",
          image_urls: ["/placeholder.svg"],
        },
        {
          materialId: "metro-elec-1",
          name: "Electrical Cable 90m",
          category: "electrical",
          brand: "MetroWire",
          grade_strength: "FR",
          unit_base_price: 1350,
          transport_params: {
            base: 120,
            slabs: [
              { up_to_km: 10, per_km: 2.0 },
              { up_to_km: 25, per_km: 2.6 },
              { up_to_km: 9999, per_km: 3.0 },
            ],
          },
          bulk_discount_rules: [{ min_qty: 20, discount_pct: 3 }],
          monsoon_price_rise_pct: 2,
          available_stock: 500,
          delivery_sla: "24–48h",
          image_urls: ["/placeholder.svg"],
        },
      ],
    },
    {
      id: "supplier:greencycle",
      profile: {
        business_name: "GreenCycle Aggregates",
        pincode: "411021",
        service_radius_km: 65,
        discoverable: true,
        verification: "verified",
        rating: 4.2,
        past_clients: 41,
        docs_count: 4,
      },
      materials: [
        {
          materialId: "gc-sand-1",
          name: "M-Sand (1 ton)",
          category: "civil",
          brand: "GreenCycle",
          grade_strength: "Zone II",
          unit_base_price: 1420,
          transport_params: {
            base: 90,
            slabs: [
              { up_to_km: 10, per_km: 6.6 },
              { up_to_km: 25, per_km: 7.2 },
              { up_to_km: 9999, per_km: 8.6 },
            ],
          },
          bulk_discount_rules: [{ min_qty: 10, discount_pct: 4 }],
          monsoon_price_rise_pct: 10,
          available_stock: 60,
          delivery_sla: "48h",
          image_urls: ["/placeholder.svg"],
        },
        {
          materialId: "gc-cement-1",
          name: "Cement PPC 50kg",
          category: "civil",
          brand: "EcoBuild",
          grade_strength: "PPC",
          unit_base_price: 392,
          transport_params: {
            base: 50,
            slabs: [
              { up_to_km: 10, per_km: 2.8 },
              { up_to_km: 25, per_km: 3.1 },
              { up_to_km: 9999, per_km: 3.8 },
            ],
          },
          bulk_discount_rules: [{ min_qty: 50, discount_pct: 2 }],
          monsoon_price_rise_pct: 8,
          available_stock: 700,
          delivery_sla: "48–72h",
          image_urls: ["/placeholder.svg"],
        },
        {
          materialId: "gc-crane-1",
          name: "Crane rental (per day)",
          category: "machinery",
          brand: "GreenCycle",
          grade_strength: "25T",
          unit_base_price: 14500,
          transport_params: {
            base: 600,
            slabs: [
              { up_to_km: 10, per_km: 20 },
              { up_to_km: 25, per_km: 30 },
              { up_to_km: 9999, per_km: 38 },
            ],
          },
          bulk_discount_rules: [{ min_qty: 3, discount_pct: 5 }],
          monsoon_price_rise_pct: 6,
          available_stock: 4,
          delivery_sla: "24–48h",
          image_urls: ["/placeholder.svg"],
        },
      ],
    },
    {
      id: "supplier:budget",
      profile: {
        business_name: "Budget Traders",
        pincode: "411033",
        service_radius_km: 30,
        discoverable: true,
        verification: "pending",
        rating: 3.7,
        past_clients: 14,
        docs_count: 1,
      },
      materials: [
        {
          materialId: "bt-cement-1",
          name: "Cement PPC 50kg",
          category: "civil",
          brand: "ValueMix",
          grade_strength: "PPC",
          unit_base_price: 382,
          transport_params: {
            base: 40,
            slabs: [
              { up_to_km: 10, per_km: 3.2 },
              { up_to_km: 25, per_km: 3.9 },
              { up_to_km: 9999, per_km: 4.6 },
            ],
          },
          bulk_discount_rules: [{ min_qty: 80, discount_pct: 4 }],
          monsoon_price_rise_pct: 12,
          available_stock: 320,
          delivery_sla: "72–96h",
          image_urls: ["/placeholder.svg"],
        },
      ],
    },
  ];

  return [editableSupplier, ...fixtures].filter((s) => Boolean(s.profile.business_name));
}
