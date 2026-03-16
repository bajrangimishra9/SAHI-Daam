import { useMemo } from "react";
import { motion } from "framer-motion";
import { Package, Droplets, Factory, Blocks, Wrench, FlaskConical } from "lucide-react";
import type { BOQItem } from "../lib/mock-data";
import { computeMaterialRequirements } from "../lib/material-calculations";

const categoryIcons: Record<string, React.ReactNode> = {
  cement: <Factory className="h-5 w-5" />,
  sand: <FlaskConical className="h-5 w-5" />,
  aggregate: <Blocks className="h-5 w-5" />,
  bricks: <Package className="h-5 w-5" />,
  steel: <Wrench className="h-5 w-5" />,
  water: <Droplets className="h-5 w-5" />,
};

const categoryColors: Record<string, string> = {
  cement: "bg-accent/10 text-accent border-accent/20",
  sand: "bg-warning/10 text-warning border-warning/20",
  aggregate: "bg-info/10 text-info border-info/20",
  bricks: "bg-destructive/10 text-destructive border-destructive/20",
  steel: "bg-primary/10 text-primary border-primary/20",
  water: "bg-success/10 text-success border-success/20",
};

interface Props {
  boqItems: BOQItem[];
}

export function MaterialRequirementSummary({ boqItems }: Props) {
  const matReq = useMemo(() => computeMaterialRequirements(boqItems), [boqItems]);

  const summaryCards = [
    { label: "Cement", value: matReq.totalCementBags.toLocaleString(), unit: "bags", cat: "cement" },
    { label: "Sand", value: matReq.totalSandM3.toLocaleString(), unit: "m³", cat: "sand" },
    { label: "Aggregate", value: matReq.totalAggregateM3.toLocaleString(), unit: "m³", cat: "aggregate" },
    { label: "Bricks", value: matReq.totalBricks.toLocaleString(), unit: "nos", cat: "bricks" },
    { label: "Steel", value: matReq.totalSteelKg.toLocaleString(), unit: "kg", cat: "steel" },
    { label: "Water", value: matReq.totalWaterLiters.toLocaleString(), unit: "L", cat: "water" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Material Requirement Summary</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Raw materials derived from BOQ volumes using standard mix ratios
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl border p-4 ${categoryColors[card.cat]}`}
          >
            <div className="flex items-center gap-2 mb-2">
              {categoryIcons[card.cat]}
              <span className="text-xs font-semibold uppercase tracking-wider">{card.label}</span>
            </div>
            <p className="text-xl font-bold font-mono">{card.value}</p>
            <p className="text-[10px] opacity-70">{card.unit}</p>
          </motion.div>
        ))}
      </div>

      {/* Detailed breakdown */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Material</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Quantity</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Unit</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Derived From</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Formula</th>
              </tr>
            </thead>
            <tbody>
              {matReq.materials.map((m, i) => (
                <motion.tr
                  key={m.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b last:border-0 hover:bg-muted/10 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span>{m.icon}</span>
                      <span className="font-medium">{m.material}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold">{m.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{m.unit}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[200px]" title={m.derivedFrom}>{m.derivedFrom}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{m.formula}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
