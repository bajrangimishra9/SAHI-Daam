export interface Project {
  id: string;
  name: string;
  client: string;
  status: "processing" | "completed" | "failed" | "draft";
  uploadedAt: string;
  fileType: "dwg" | "dxf" | "ifc" | "pdf";
  fileName: string;
  totalCost: number;
  elementsDetected: number;
}

export interface StructuralElement {
  id: string;
  type: "wall" | "column" | "beam" | "slab" | "footing" | "rebar";
  label: string;
  length: number;
  width: number;
  height: number;
  thickness?: number;
  unit: "mm" | "m";
  layer: string;
  quantity: number;
  rebarDiameter?: number;
}

export interface CalculationStep {
  label: string;
  expression: string;
  result: number;
  unit?: string;
}

export interface CalculationBreakdown {
  formula: string;
  formulaDescription: string;
  inputs: { name: string; value: string }[];
  steps: CalculationStep[];
  elements: { id: string; label: string; dims: string; qty: number }[];
  finalQty: number;
  wastageQty: number;
  warning?: string;
}

export interface BOQItem {
  id: string;
  category: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  wastagePercent: number;
  breakdown?: CalculationBreakdown;
}

export interface GridLine {
  label: string;
  axis: "x" | "y";
  position: number; // in meters from origin
}

export interface GridDetectionResult {
  gridLines: GridLine[];
  xLabels: string[];
  yLabels: string[];
  /** Real-world spacings between adjacent X grid lines (in meters) */
  xSpacings: number[];
  /** Real-world spacings between adjacent Y grid lines (in meters) */
  ySpacings: number[];
  intersections: number;
  columnsDetected: number;
  beamSegmentsDetected: number;
  slabBaysDetected: number;
  totalGridBays: number;
  completeness: number; // 0-100%
  /** Percentage of grid intersections that align with detected column nodes */
  columnAlignmentPercent: number;
  /** Set of intersection keys "xi,yi" that are active (have a column) — supports irregular footprints */
  activeIntersections: string[];
  warnings: string[];
}

export interface MaterialSummary {
  material: string;
  totalQuantity: number;
  unit: string;
  unitRate: number;
  totalCost: number;
  breakdown?: { label: string; qty: number }[];
}

export const mockProjects: Project[] = [
  { id: "P001", name: "Riverside Apartments - Block A", client: "Greenfield Developers", status: "completed", uploadedAt: "2026-02-28", fileType: "dwg", fileName: "riverside_block_a.dwg", totalCost: 2450000, elementsDetected: 342 },
  { id: "P002", name: "Metro Office Complex", client: "Urban Infra Ltd", status: "processing", uploadedAt: "2026-03-01", fileType: "dxf", fileName: "metro_office_structural.dxf", totalCost: 0, elementsDetected: 0 },
  { id: "P003", name: "Highway Overpass - Section 3", client: "National Highways Authority", status: "completed", uploadedAt: "2026-02-25", fileType: "dwg", fileName: "overpass_sec3.dwg", totalCost: 8920000, elementsDetected: 189 },
  { id: "P004", name: "Community Health Center", client: "State Health Dept", status: "failed", uploadedAt: "2026-02-27", fileType: "dxf", fileName: "health_center_v2.dxf", totalCost: 0, elementsDetected: 0 },
  { id: "P005", name: "Industrial Warehouse Unit 7", client: "Apex Logistics", status: "draft", uploadedAt: "2026-03-02", fileType: "dwg", fileName: "warehouse_u7.dwg", totalCost: 0, elementsDetected: 0 },
];

export const mockElements: StructuralElement[] = [
  { id: "E001", type: "wall", label: "External Wall - Ground Floor", length: 42.5, width: 0.23, height: 3.2, unit: "m", layer: "A-WALL-EXT", quantity: 12 },
  { id: "E002", type: "wall", label: "Internal Wall - Ground Floor", length: 28.3, width: 0.115, height: 3.0, unit: "m", layer: "A-WALL-INT", quantity: 18 },
  { id: "E003", type: "column", label: "RCC Column C1 (300x450)", length: 0.3, width: 0.45, height: 3.2, unit: "m", layer: "S-COL", quantity: 24 },
  { id: "E004", type: "column", label: "RCC Column C2 (300x300)", length: 0.3, width: 0.3, height: 3.2, unit: "m", layer: "S-COL", quantity: 16 },
  { id: "E005", type: "beam", label: "Main Beam B1 (230x450)", length: 6.0, width: 0.23, height: 0.45, unit: "m", layer: "S-BEAM", quantity: 20 },
  { id: "E006", type: "beam", label: "Secondary Beam B2 (230x350)", length: 4.5, width: 0.23, height: 0.35, unit: "m", layer: "S-BEAM", quantity: 28 },
  { id: "E007", type: "slab", label: "Floor Slab - Ground", length: 18.0, width: 12.0, height: 0.15, unit: "m", layer: "S-SLAB", quantity: 1 },
  { id: "E008", type: "slab", label: "Floor Slab - First", length: 18.0, width: 12.0, height: 0.15, unit: "m", layer: "S-SLAB", quantity: 1 },
  { id: "E009", type: "footing", label: "Isolated Footing F1", length: 1.5, width: 1.5, height: 0.45, unit: "m", layer: "S-FNDN", quantity: 24 },
  { id: "E010", type: "rebar", label: "Main Rebar - Columns", length: 3.2, width: 0, height: 0, unit: "m", layer: "S-REBAR", quantity: 192, rebarDiameter: 16 },
  { id: "E011", type: "rebar", label: "Stirrups - Columns", length: 1.4, width: 0, height: 0, unit: "m", layer: "S-REBAR", quantity: 960, rebarDiameter: 8 },
  { id: "E012", type: "rebar", label: "Main Rebar - Beams", length: 6.0, width: 0, height: 0, unit: "m", layer: "S-REBAR", quantity: 240, rebarDiameter: 12 },
];

export const mockBOQ: BOQItem[] = [
  { id: "B001", category: "Concrete", description: "M25 Grade RCC for Columns", unit: "m³", quantity: 17.28, rate: 6500, amount: 112320, wastagePercent: 3 },
  { id: "B002", category: "Concrete", description: "M25 Grade RCC for Beams", unit: "m³", quantity: 22.36, rate: 6500, amount: 145340, wastagePercent: 3 },
  { id: "B003", category: "Concrete", description: "M20 Grade RCC for Slabs", unit: "m³", quantity: 64.8, rate: 5800, amount: 375840, wastagePercent: 2 },
  { id: "B004", category: "Concrete", description: "M15 Grade PCC for Footings", unit: "m³", quantity: 24.3, rate: 4500, amount: 109350, wastagePercent: 5 },
  { id: "B005", category: "Steel", description: "Fe500 TMT - 16mm dia", unit: "kg", quantity: 1520, rate: 72, amount: 109440, wastagePercent: 5 },
  { id: "B006", category: "Steel", description: "Fe500 TMT - 12mm dia", unit: "kg", quantity: 1280, rate: 72, amount: 92160, wastagePercent: 5 },
  { id: "B007", category: "Steel", description: "Fe500 TMT - 8mm dia", unit: "kg", quantity: 420, rate: 74, amount: 31080, wastagePercent: 5 },
  { id: "B008", category: "Masonry", description: "230mm Brick Wall with CM 1:6", unit: "m²", quantity: 136, rate: 1850, amount: 251600, wastagePercent: 8 },
  { id: "B009", category: "Masonry", description: "115mm Brick Wall with CM 1:4", unit: "m²", quantity: 84.9, rate: 1200, amount: 101880, wastagePercent: 8 },
  { id: "B010", category: "Formwork", description: "Steel Formwork for Columns", unit: "m²", quantity: 115.2, rate: 450, amount: 51840, wastagePercent: 0 },
  { id: "B011", category: "Formwork", description: "Plywood Formwork for Slabs", unit: "m²", quantity: 432, rate: 380, amount: 164160, wastagePercent: 0 },
];

export const mockMaterialSummary: MaterialSummary[] = [
  { material: "Concrete (all grades)", totalQuantity: 128.74, unit: "m³", unitRate: 5900, totalCost: 742850, breakdown: [{ label: "M25", qty: 39.64 }, { label: "M20", qty: 64.8 }, { label: "M15", qty: 24.3 }] },
  { material: "Steel (Fe500 TMT)", totalQuantity: 3220, unit: "kg", unitRate: 72.5, totalCost: 232680, breakdown: [{ label: "16mm", qty: 1520 }, { label: "12mm", qty: 1280 }, { label: "8mm", qty: 420 }] },
  { material: "Bricks (Standard)", totalQuantity: 28500, unit: "nos", unitRate: 8.5, totalCost: 242250 },
  { material: "Cement (OPC 53)", totalQuantity: 485, unit: "bags", unitRate: 380, totalCost: 184300 },
  { material: "Sand (River)", totalQuantity: 62, unit: "m³", unitRate: 1800, totalCost: 111600 },
  { material: "Aggregate (20mm)", totalQuantity: 98, unit: "m³", unitRate: 2200, totalCost: 215600 },
];

export const statusColors: Record<Project["status"], string> = {
  completed: "bg-success text-success-foreground",
  processing: "bg-info text-info-foreground",
  failed: "bg-destructive text-destructive-foreground",
  draft: "bg-muted text-muted-foreground",
};
