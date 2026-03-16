/**
 * Deterministic material requirement calculations.
 * Converts BOQ volumes into raw material quantities using standard mix ratios.
 */

import type { BOQItem } from "./mock-data";

export interface RawMaterial {
  id: string;
  material: string;
  category: "cement" | "sand" | "aggregate" | "bricks" | "steel" | "water";
  quantity: number;
  unit: string;
  derivedFrom: string; // BOQ item description
  formula: string;
  icon: string;
}

export interface MaterialRequirementResult {
  materials: RawMaterial[];
  totalCementBags: number;
  totalSandM3: number;
  totalAggregateM3: number;
  totalBricks: number;
  totalSteelKg: number;
  totalWaterLiters: number;
}

// Standard concrete mix ratios (dry volume factor = 1.54 for compaction)
const CONCRETE_MIX: Record<string, { cement: number; sand: number; aggregate: number; water: number }> = {
  "M25": { cement: 8.22, sand: 0.42, aggregate: 0.84, water: 191 }, // bags/m³, m³/m³, m³/m³, L/m³
  "M20": { cement: 6.94, sand: 0.44, aggregate: 0.88, water: 180 },
  "M15": { cement: 5.78, sand: 0.46, aggregate: 0.92, water: 170 },
};

// Mortar for masonry: CM 1:6 and CM 1:4
const MORTAR_RATES: Record<string, { cementBagsPerM2: number; sandM3PerM2: number }> = {
  "230mm": { cementBagsPerM2: 1.14, sandM3PerM2: 0.036 },
  "115mm": { cementBagsPerM2: 0.57, sandM3PerM2: 0.018 },
};

// Bricks per m² of wall
const BRICKS_PER_M2: Record<string, number> = {
  "230mm": 460,
  "115mm": 230,
};

export function computeMaterialRequirements(boqItems: BOQItem[]): MaterialRequirementResult {
  const materials: RawMaterial[] = [];
  let idCounter = 1;
  const nextId = () => `MAT-${String(idCounter++).padStart(3, "0")}`;

  let totalCementBags = 0;
  let totalSandM3 = 0;
  let totalAggregateM3 = 0;
  let totalBricks = 0;
  let totalSteelKg = 0;
  let totalWaterLiters = 0;

  for (const item of boqItems) {
    const desc = item.description;
    const qtyWithWastage = item.quantity * (1 + item.wastagePercent / 100);

    // --- Concrete items ---
    const concreteMatch = desc.match(/M(\d+)\s+Grade\s+(RCC|PCC)/);
    if (concreteMatch && item.unit === "m³") {
      const grade = `M${concreteMatch[1]}`;
      const mix = CONCRETE_MIX[grade] || CONCRETE_MIX["M20"];

      const cementBags = Math.ceil(qtyWithWastage * mix.cement);
      const sandVol = round2(qtyWithWastage * mix.sand);
      const aggVol = round2(qtyWithWastage * mix.aggregate);
      const waterVol = Math.ceil(qtyWithWastage * mix.water);

      materials.push({
        id: nextId(), material: `Cement (OPC 53) for ${grade}`, category: "cement",
        quantity: cementBags, unit: "bags", derivedFrom: desc,
        formula: `${round2(qtyWithWastage)} m³ × ${mix.cement} bags/m³ = ${cementBags} bags`,
        icon: "🏗️",
      });
      materials.push({
        id: nextId(), material: `Sand (River) for ${grade}`, category: "sand",
        quantity: sandVol, unit: "m³", derivedFrom: desc,
        formula: `${round2(qtyWithWastage)} m³ × ${mix.sand} m³/m³ = ${sandVol} m³`,
        icon: "⏳",
      });
      materials.push({
        id: nextId(), material: `Aggregate (20mm) for ${grade}`, category: "aggregate",
        quantity: aggVol, unit: "m³", derivedFrom: desc,
        formula: `${round2(qtyWithWastage)} m³ × ${mix.aggregate} m³/m³ = ${aggVol} m³`,
        icon: "🪨",
      });
      materials.push({
        id: nextId(), material: `Water for ${grade}`, category: "water",
        quantity: waterVol, unit: "L", derivedFrom: desc,
        formula: `${round2(qtyWithWastage)} m³ × ${mix.water} L/m³ = ${waterVol} L`,
        icon: "💧",
      });

      totalCementBags += cementBags;
      totalSandM3 += sandVol;
      totalAggregateM3 += aggVol;
      totalWaterLiters += waterVol;
      continue;
    }

    // --- Masonry items ---
    if (desc.includes("Brick Wall") && item.unit === "m²") {
      const isThick = desc.includes("230mm");
      const thickness = isThick ? "230mm" : "115mm";
      const mortar = MORTAR_RATES[thickness];
      const bricksPerM2 = BRICKS_PER_M2[thickness];

      const brickCount = Math.ceil(qtyWithWastage * bricksPerM2);
      const mortarCement = Math.ceil(qtyWithWastage * mortar.cementBagsPerM2);
      const mortarSand = round2(qtyWithWastage * mortar.sandM3PerM2);

      materials.push({
        id: nextId(), material: `Bricks (Standard) for ${thickness} Wall`, category: "bricks",
        quantity: brickCount, unit: "nos", derivedFrom: desc,
        formula: `${round2(qtyWithWastage)} m² × ${bricksPerM2} bricks/m² = ${brickCount} nos`,
        icon: "🧱",
      });
      materials.push({
        id: nextId(), material: `Cement for ${thickness} Mortar`, category: "cement",
        quantity: mortarCement, unit: "bags", derivedFrom: desc,
        formula: `${round2(qtyWithWastage)} m² × ${mortar.cementBagsPerM2} bags/m² = ${mortarCement} bags`,
        icon: "🏗️",
      });
      materials.push({
        id: nextId(), material: `Sand for ${thickness} Mortar`, category: "sand",
        quantity: mortarSand, unit: "m³", derivedFrom: desc,
        formula: `${round2(qtyWithWastage)} m² × ${mortar.sandM3PerM2} m³/m² = ${mortarSand} m³`,
        icon: "⏳",
      });

      totalBricks += brickCount;
      totalCementBags += mortarCement;
      totalSandM3 += mortarSand;
      continue;
    }

    // --- Steel items ---
    if (item.category === "Steel" && item.unit === "kg") {
      totalSteelKg += round2(qtyWithWastage);
      materials.push({
        id: nextId(), material: desc, category: "steel",
        quantity: round2(qtyWithWastage), unit: "kg", derivedFrom: desc,
        formula: `${item.quantity} kg × (1 + ${item.wastagePercent}%) = ${round2(qtyWithWastage)} kg`,
        icon: "🔩",
      });
    }
  }

  return {
    materials,
    totalCementBags,
    totalSandM3: round2(totalSandM3),
    totalAggregateM3: round2(totalAggregateM3),
    totalBricks,
    totalSteelKg: round2(totalSteelKg),
    totalWaterLiters,
  };
}

/**
 * Generate material consumption timeline data based on project duration.
 * Distributes materials across weeks/months based on typical construction phases.
 */
export interface TimelineDataPoint {
  period: string;
  periodIndex: number;
  cement: number;
  sand: number;
  aggregate: number;
  bricks: number;
  steel: number;
  water: number;
}

export function generateConsumptionTimeline(
  matReq: MaterialRequirementResult,
  totalMonths: number,
  completionPercent: number
): TimelineDataPoint[] {
  const periods = Math.max(3, totalMonths);
  const data: TimelineDataPoint[] = [];

  // Construction phase distribution (typical S-curve):
  // Foundation (20%), Structure (40%), Finishing (40%)
  const phaseWeights = generateSCurve(periods);

  for (let i = 0; i < periods; i++) {
    const w = phaseWeights[i];
    const monthLabel = `Month ${i + 1}`;

    data.push({
      period: monthLabel,
      periodIndex: i,
      cement: Math.round(matReq.totalCementBags * w),
      sand: round2(matReq.totalSandM3 * w),
      aggregate: round2(matReq.totalAggregateM3 * w),
      bricks: Math.round(matReq.totalBricks * w * (i >= periods * 0.3 ? 1.5 : 0.5)),
      steel: round2(matReq.totalSteelKg * w * (i < periods * 0.6 ? 1.3 : 0.7)),
      water: Math.round(matReq.totalWaterLiters * w),
    });
  }

  return data;
}

/**
 * Generate AI-optimized procurement timeline with price predictions.
 */
export interface ProcurementDataPoint {
  period: string;
  periodIndex: number;
  material: string;
  demandQty: number;
  recommendedQty: number;
  unit: string;
  priceChangePercent: number;
  reason: string;
  estimatedSavings: number;
  storageRequired: number;
  riskLevel: "low" | "medium" | "high";
}

export interface ProcurementInsight {
  period: string;
  material: string;
  demandQty: number;
  recommendedQty: number;
  unit: string;
  priceChange: number;
  reason: string;
  savings: number;
  storageNeeded: number;
  riskLevel: "low" | "medium" | "high";
}

function generateSCurve(periods: number): number[] {
  const weights: number[] = [];
  let sum = 0;
  for (let i = 0; i < periods; i++) {
    const t = (i + 0.5) / periods;
    // S-curve: heavier in the middle phases
    const w = Math.exp(-Math.pow((t - 0.45) * 3, 2));
    weights.push(w);
    sum += w;
  }
  return weights.map(w => w / sum);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
