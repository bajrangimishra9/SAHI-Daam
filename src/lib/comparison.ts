import { approxKmBetweenPincodes } from "@/lib/geo";

export type ComparisonPreferences = {
  prioritizePrice: number; // 0..1
  prioritizeSpeed: number; // 0..1
  prioritizeLowRisk: number; // 0..1
};

export type SupplierSnapshot = {
  supplierId: string;
  supplierName: string;
  supplierPincode: string;
  verification: "pending" | "verified" | "rejected";
  rating: number; // 0..5
  pastClients: number;
  docsCount: number;
  material: {
    materialId: string;
    name: string;
    category: "civil" | "electrical" | "machinery";
    brand?: string | null;
    grade_strength?: string | null;
    unit_base_price: number;
    transport_params: {
      base?: number;
      per_km?: number;
      slabs?: Array<{ up_to_km: number; per_km: number }>;
    };
    bulk_discount_rules: Array<{ min_qty: number; discount_pct: number }>;
    monsoon_price_rise_pct: number;
    available_stock?: number | null;
    delivery_sla?: string | null;
    image_urls?: string[];
  };
};

function transportPerKm(km: number, params: SupplierSnapshot["material"]["transport_params"]) {
  const slabs = (params?.slabs ?? []).filter((s) => Number.isFinite(s.up_to_km) && Number.isFinite(s.per_km));
  if (slabs.length) {
    const sorted = [...slabs].sort((a, b) => a.up_to_km - b.up_to_km);
    const match = sorted.find((s) => km <= s.up_to_km);
    return Number(match?.per_km ?? sorted[sorted.length - 1]!.per_km);
  }
  return Number(params?.per_km ?? 0);
}

export type SupplierScoreBreakdown = {
  priceCompetitiveness: number; // 0..100 (higher is better)
  distanceImpact: number; // 0..100 (higher is better)
  logisticsReliability: number; // 0..100 (higher is better)
  credibilityStrength: number; // 0..100 (higher is better)
  monsoonRisk: number; // 0..100 (higher is better)
};

export type SupplierQuote = {
  supplierId: string;
  supplierName: string;
  km: number;
  qty: number;
  baseUnitPrice: number;
  baseCost: number;
  transportCost: number;
  monsoonSurcharge: number;
  totalLandedCost: number;
  eta: string;
  riskScore: number; // 0..100 (lower is safer)
  score: number; // 0..100 (higher is better)
  breakdown: SupplierScoreBreakdown;
  materialLabel: string;
  imageUrl?: string;
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function clamp100(n: number) {
  return Math.max(0, Math.min(100, n));
}

function parseEtaToHours(eta: string | null | undefined) {
  const v = (eta ?? "").trim();
  const match = v.match(/(\d+)\s*[–-]\s*(\d+)\s*h/i) || v.match(/(\d+)\s*h/i);
  if (!match) return 72;
  if (match.length >= 3) return (parseInt(match[1]!, 10) + parseInt(match[2]!, 10)) / 2;
  return parseInt(match[1]!, 10);
}

function bulkDiscountPct(rules: Array<{ min_qty: number; discount_pct: number }>, qty: number) {
  const sorted = [...(rules ?? [])].sort((a, b) => (a.min_qty ?? 0) - (b.min_qty ?? 0));
  let pct = 0;
  for (const r of sorted) {
    if ((r.min_qty ?? 0) <= qty) pct = Math.max(pct, r.discount_pct ?? 0);
  }
  return pct;
}

export function quoteSupplier(params: {
  vendorPincode: string;
  qty: number;
  snapshot: SupplierSnapshot;
  prefs: ComparisonPreferences;
  marketMinUnitPrice: number;
  marketMaxUnitPrice: number;
}) {
  const { vendorPincode, qty, snapshot, prefs, marketMinUnitPrice, marketMaxUnitPrice } = params;

  const km = approxKmBetweenPincodes(vendorPincode, snapshot.supplierPincode);

  const baseTransport = Number(snapshot.material.transport_params?.base ?? 0);
  const perKm = transportPerKm(km, snapshot.material.transport_params);
  let transportCost = Math.round(baseTransport + perKm * km);
  // Never return a silent zero-transport quote; fall back to sensible demo defaults.
  if (!Number.isFinite(transportCost) || transportCost <= 0) {
    transportCost = Math.max(50, Math.round(50 + 2 * km));
  }

  const discountPct = bulkDiscountPct(snapshot.material.bulk_discount_rules ?? [], qty);
  const discountedUnit = snapshot.material.unit_base_price * (1 - discountPct / 100);

  const baseCost = Math.round(discountedUnit * qty);
  const monsoonSurcharge = Math.round(baseCost * (snapshot.material.monsoon_price_rise_pct / 100));
  const totalLandedCost = baseCost + transportCost + monsoonSurcharge;

  // --- Breakdown (0..100) ---
  const unitSpan = Math.max(1, marketMaxUnitPrice - marketMinUnitPrice);
  const priceCompetitiveness = clamp100(
    100 - ((discountedUnit - marketMinUnitPrice) / unitSpan) * 100,
  );

  const distanceImpact = clamp100(100 - (km / 200) * 100);

  const etaHours = parseEtaToHours(snapshot.material.delivery_sla ?? null);
  const logisticsReliability = clamp100(100 - (etaHours / 96) * 100);

  const rating01 = clamp01((snapshot.rating ?? 0) / 5);
  const docs01 = clamp01((snapshot.docsCount ?? 0) / 6);
  const verifiedBonus = snapshot.verification === "verified" ? 1 : snapshot.verification === "pending" ? 0.65 : 0.25;
  const credibilityStrength = clamp100((rating01 * 0.55 + docs01 * 0.25 + verifiedBonus * 0.2) * 100);

  const monsoonRisk = clamp100(100 - (snapshot.material.monsoon_price_rise_pct / 20) * 100);

  // Risk score (lower is better)
  const riskScore = clamp100(
    100 - (credibilityStrength * 0.6 + logisticsReliability * 0.2 + monsoonRisk * 0.2),
  );

  const wPrice = clamp01(prefs.prioritizePrice);
  const wSpeed = clamp01(prefs.prioritizeSpeed);
  const wRisk = clamp01(prefs.prioritizeLowRisk);
  const wSum = Math.max(0.001, wPrice + wSpeed + wRisk);

  const score = clamp100(
    ((priceCompetitiveness * wPrice + logisticsReliability * wSpeed + (100 - riskScore) * wRisk) / wSum) * 1,
  );

  const materialLabel = [snapshot.material.name, snapshot.material.brand, snapshot.material.grade_strength]
    .filter(Boolean)
    .join(" • ");

  return {
    supplierId: snapshot.supplierId,
    supplierName: snapshot.supplierName,
    km,
    qty,
    baseUnitPrice: Math.round(discountedUnit),
    baseCost,
    transportCost,
    monsoonSurcharge,
    totalLandedCost,
    eta: snapshot.material.delivery_sla || "48–72h",
    riskScore,
    score,
    breakdown: {
      priceCompetitiveness,
      distanceImpact,
      logisticsReliability,
      credibilityStrength,
      monsoonRisk,
    },
    materialLabel,
    imageUrl: snapshot.material.image_urls?.[0],
  } satisfies SupplierQuote;
}
