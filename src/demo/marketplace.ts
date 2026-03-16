import type { SupplierSnapshot } from "@/lib/comparison";
import { supabase } from "@/lib/supabase";

export type VerificationStatus = "pending" | "verified" | "rejected";

export type MarketSupplier = {
  id: string;
  profile: {
    business_name: string;
    email?: string;
    address?: string;
    pincode: string;
    location?: { lat: number; lng: number; address: string } | null;
    service_radius_km: number;
    discoverable: boolean;
    verification: VerificationStatus;
    rating: number;
    past_clients: number;
    docs_count: number;
  };
  materials: SupplierSnapshot["material"][];
};

function asVerification(v: unknown): VerificationStatus {
  if (v === true) return "verified";
  if (v === false) return "pending";
  if (v === "verified" || v === "rejected" || v === "pending") return v;
  return "pending";
}

export async function buildDemoMarketplace(): Promise<MarketSupplier[]> {
  // 1️⃣ Fetch suppliers
  const { data: suppliers, error: supplierError } = await supabase
    .from("suppliers")
    .select("id, name, pincode, email, address, latitude, longitude, service_radius_km, verified, rating, past_clients, docs_count");

  if (supplierError) {
    console.error("Supabase suppliers fetch failed:", supplierError);
    return [];
  }

  if (!suppliers || suppliers.length === 0) {
    return [];
  }

  const supplierIds = suppliers.map((s) => s.id);

  // 2️⃣ Fetch supplier materials
  const { data: materialsData, error: materialError } = await supabase
    .from("supplier_materials")
    .select(`
      supplier_id,
      material_id,
      name,
      category,
      brand,
      grade_strength,
      unit_base_price,
      transport_params,
      bulk_discount_rules,
      monsoon_price_rise_pct,
      available_stock,
      delivery_sla,
      image_urls
    `)
    .in("supplier_id", supplierIds);

  if (materialError) {
    console.error("Supabase supplier_materials fetch failed:", materialError);
  }

  // 3️⃣ Group materials by supplier
  const materialsBySupplier = new Map<string, any[]>();

  (materialsData ?? []).forEach((row) => {
    const existing = materialsBySupplier.get(row.supplier_id) ?? [];
    existing.push(row);
    materialsBySupplier.set(row.supplier_id, existing);
  });

  // 4️⃣ Build final marketplace structure
  const marketplace: MarketSupplier[] = suppliers.map((supplier: any) => {
    const supplierMaterials =
      materialsBySupplier.get(supplier.id) ?? [];

    const mappedMaterials: SupplierSnapshot["material"][] =
      supplierMaterials.map((m: any) => ({
        materialId: m.material_id,
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
      }));

    return {
      id: `supplier:${supplier.id}`,
      profile: {
        business_name: String(supplier.name ?? ""),
        pincode: String(supplier.pincode ?? ""),
        location:
          supplier.latitude != null && supplier.longitude != null
            ? {
              lat: Number(supplier.latitude),
              lng: Number(supplier.longitude),
              address: "",
            }
            : null,
        service_radius_km: Number(supplier.service_radius_km ?? 50),
        discoverable: true,
        verification: asVerification(supplier.verified),
        rating: Number(supplier.rating ?? 0),
        past_clients: Number(supplier.past_clients ?? 0),
        docs_count: Number(supplier.docs_count ?? 0),
        address: supplier.address ?? "",
        email: supplier.email ?? "",
      },
      materials: mappedMaterials,
    };
  });

  return marketplace;
}