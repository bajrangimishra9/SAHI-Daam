import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { BOQItem } from "../lib/mock-data";
import type { ProjectConfig } from "./ProcurementWizard";
import { computeMaterialRequirements, generateConsumptionTimeline } from "../lib/material-calculations";

const MATERIAL_COLORS: Record<string, string> = {
  cement: "hsl(38, 92%, 50%)",
  sand: "hsl(38, 60%, 65%)",
  aggregate: "hsl(210, 80%, 52%)",
  bricks: "hsl(0, 72%, 51%)",
  steel: "hsl(152, 60%, 40%)",
  water: "hsl(210, 60%, 70%)",
};

interface Props {
  boqItems: BOQItem[];
  config: ProjectConfig;
  onPeriodClick: (periodIndex: number) => void;
}

export function ConsumptionTimelineChart({ boqItems, config, onPeriodClick }: Props) {
  const [activeMaterial, setActiveMaterial] = useState<string | null>(null);

  const totalMonths = Math.max(3, Math.round(
    (new Date(config.endDate).getTime() - new Date(config.startDate).getTime()) / (30.44 * 24 * 60 * 60 * 1000)
  ));

  const matReq = useMemo(() => computeMaterialRequirements(boqItems), [boqItems]);
  const data = useMemo(() => generateConsumptionTimeline(matReq, totalMonths, config.completionPercent), [matReq, totalMonths, config.completionPercent]);

  const materials = [
    { key: "cement", label: "Cement (bags)", color: MATERIAL_COLORS.cement },
    { key: "sand", label: "Sand (m³)", color: MATERIAL_COLORS.sand },
    { key: "aggregate", label: "Aggregate (m³)", color: MATERIAL_COLORS.aggregate },
    { key: "bricks", label: "Bricks (nos)", color: MATERIAL_COLORS.bricks },
    { key: "steel", label: "Steel (kg)", color: MATERIAL_COLORS.steel },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5 space-y-4">
      <div>
        <h3 className="font-bold text-sm">Material Consumption Timeline</h3>
        <p className="text-xs text-muted-foreground">Expected material demand over {totalMonths} months — click any point for details</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {materials.map(m => (
          <button
            key={m.key}
            onClick={() => setActiveMaterial(prev => prev === m.key ? null : m.key)}
            className={`text-[10px] px-2.5 py-1 rounded-full border transition-all font-medium ${
              activeMaterial === null || activeMaterial === m.key
                ? "opacity-100 border-border"
                : "opacity-40 border-transparent"
            }`}
            style={{ borderColor: activeMaterial === m.key ? m.color : undefined }}
          >
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: m.color }} />
            {m.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} onClick={(e) => {
          if (e?.activeTooltipIndex !== undefined) onPeriodClick(e.activeTooltipIndex);
        }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" strokeOpacity={0.4} />
          <XAxis dataKey="period" tick={{ fontSize: 11, fill: "hsl(220, 10%, 45%)" }} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 45%)" }} />
          <Tooltip
            contentStyle={{
              background: "hsl(220, 25%, 12%)", border: "none", borderRadius: 8,
              color: "#fff", fontSize: 12,
            }}
          />
          <Legend />
          {materials.map(m => (
            <Line
              key={m.key}
              type="monotone"
              dataKey={m.key}
              name={m.label}
              stroke={m.color}
              strokeWidth={activeMaterial === null || activeMaterial === m.key ? 2.5 : 1}
              strokeOpacity={activeMaterial === null || activeMaterial === m.key ? 1 : 0.2}
              dot={{ r: 4, cursor: "pointer" }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
