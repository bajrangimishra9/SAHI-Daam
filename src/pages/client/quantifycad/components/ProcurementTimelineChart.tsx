import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, Shield, X, Lightbulb } from "lucide-react";
import type { BOQItem } from "../lib/mock-data";
import type { ProjectConfig } from "./ProcurementWizard";
import { computeMaterialRequirements, generateConsumptionTimeline } from "../lib/material-calculations";
import type { ProcurementInsight } from "../lib/material-calculations";

interface Props {
  boqItems: BOQItem[];
  config: ProjectConfig;
  aiInsights: ProcurementInsight[] | null;
  isLoadingInsights: boolean;
}

export function ProcurementTimelineChart({ boqItems, config, aiInsights, isLoadingInsights }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);

  const totalMonths = Math.max(3, Math.round(
    (new Date(config.endDate).getTime() - new Date(config.startDate).getTime()) / (30.44 * 24 * 60 * 60 * 1000)
  ));

  const matReq = useMemo(() => computeMaterialRequirements(boqItems), [boqItems]);
  const consumption = useMemo(() => generateConsumptionTimeline(matReq, totalMonths, config.completionPercent), [matReq, totalMonths, config.completionPercent]);

  // Build chart data combining demand vs recommended
  const chartData = useMemo(() => {
    return consumption.map((c, i) => {
      const periodInsights = aiInsights?.filter(ins => ins.period === c.period) || [];
      const totalDemand = c.cement + c.steel + c.bricks / 100; // Normalized
      const totalRecommended = periodInsights.reduce((s, ins) => {
        if (ins.material === "Cement") return s + ins.recommendedQty;
        if (ins.material === "Steel") return s + ins.recommendedQty;
        return s + ins.recommendedQty / 100;
      }, 0) || totalDemand;
      const avgPriceChange = periodInsights.length > 0
        ? periodInsights.reduce((s, ins) => s + ins.priceChange, 0) / periodInsights.length
        : 0;

      return {
        period: c.period,
        periodIndex: i,
        demand: Math.round(totalDemand),
        recommended: Math.round(totalRecommended),
        priceChange: avgPriceChange,
        savings: periodInsights.reduce((s, ins) => s + ins.savings, 0),
      };
    });
  }, [consumption, aiInsights]);

  const periodInsights = selectedPeriod !== null
    ? aiInsights?.filter(ins => ins.period === `Month ${selectedPeriod + 1}`) || []
    : [];

  const totalSavings = aiInsights?.reduce((s, ins) => s + ins.savings, 0) || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-accent" />
            AI Optimized Procurement Timeline
          </h3>
          <p className="text-xs text-muted-foreground">
            Purchase recommendations based on price predictions — click any bar for details
          </p>
        </div>
        {totalSavings > 0 && (
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Estimated Savings</p>
            <p className="text-lg font-bold font-mono text-success">₹{Math.round(totalSavings).toLocaleString()}</p>
          </div>
        )}
      </div>

      {isLoadingInsights ? (
        <div className="flex items-center justify-center h-64 gap-3">
          <div className="h-5 w-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">AI is analyzing market trends and generating recommendations...</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} onClick={(e) => {
            if (e?.activeTooltipIndex !== undefined) setSelectedPeriod(e.activeTooltipIndex);
          }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" strokeOpacity={0.4} />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: "hsl(220, 10%, 45%)" }} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 45%)" }} />
            <Tooltip
              contentStyle={{
                background: "hsl(220, 25%, 12%)", border: "none", borderRadius: 8,
                color: "#fff", fontSize: 12,
              }}
              formatter={(value: number, name: string) => [value, name === "demand" ? "Demand" : "AI Recommended"]}
            />
            <Legend />
            <ReferenceLine y={0} stroke="hsl(220, 15%, 88%)" />
            <Bar dataKey="demand" name="Demand" fill="hsl(210, 80%, 52%)" fillOpacity={0.5} radius={[4, 4, 0, 0]} cursor="pointer" />
            <Bar dataKey="recommended" name="AI Recommended" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} cursor="pointer" />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Insight panel */}
      <AnimatePresence>
        {selectedPeriod !== null && periodInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border border-accent/20 rounded-xl p-4 space-y-3 bg-accent/5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm">Month {selectedPeriod + 1} — AI Insights</h4>
                <button onClick={() => setSelectedPeriod(null)} className="p-1 hover:bg-muted rounded">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                {periodInsights.map((ins, i) => (
                  <div key={i} className="bg-background/80 rounded-lg p-3 space-y-1.5 border border-border/50">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{ins.material}</span>
                      <div className="flex items-center gap-2">
                        {ins.priceChange > 0 ? (
                          <span className="text-xs text-destructive flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> +{ins.priceChange.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs text-success flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" /> {ins.priceChange.toFixed(1)}%
                          </span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          ins.riskLevel === "high" ? "bg-destructive/10 text-destructive"
                            : ins.riskLevel === "medium" ? "bg-warning/10 text-warning"
                            : "bg-success/10 text-success"
                        }`}>
                          {ins.riskLevel === "high" && <AlertTriangle className="h-2.5 w-2.5 inline mr-0.5" />}
                          {ins.riskLevel === "low" && <Shield className="h-2.5 w-2.5 inline mr-0.5" />}
                          {ins.riskLevel}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div><span className="text-muted-foreground">Demand:</span> <span className="font-mono">{ins.demandQty} {ins.unit}</span></div>
                      <div><span className="text-muted-foreground">Buy:</span> <span className="font-mono font-bold text-accent">{ins.recommendedQty} {ins.unit}</span></div>
                      <div><span className="text-muted-foreground">Storage:</span> <span className="font-mono">{ins.storageNeeded} sq.m</span></div>
                      <div><span className="text-muted-foreground">Savings:</span> <span className="font-mono text-success">₹{Math.round(ins.savings).toLocaleString()}</span></div>
                    </div>
                    <p className="text-[11px] text-muted-foreground italic">{ins.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
