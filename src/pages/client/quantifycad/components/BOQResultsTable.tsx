import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, AlertCircle, ChevronDown, Calculator, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { BOQItem, StructuralElement, CalculationBreakdown, GridDetectionResult } from "../lib/mock-data";
import { StructuralGridOverlay } from "./StructuralGridOverlay";

const elementTypeColors: Record<string, string> = {
  wall: "bg-info/10 text-info",
  column: "bg-accent/10 text-accent",
  beam: "bg-success/10 text-success",
  slab: "bg-primary/10 text-primary",
  footing: "bg-warning/10 text-warning",
  rebar: "bg-destructive/10 text-destructive",
};

interface BOQResultsTableProps {
  boqItems: BOQItem[];
  elements: StructuralElement[];
  processedAt: Date;
  sourceFiles: string[];
  gridResult?: GridDetectionResult;
}

function BreakdownPanel({ breakdown, wastagePercent }: { breakdown: CalculationBreakdown; wastagePercent: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="px-4 pb-4 pt-1 space-y-3 bg-muted/5 border-t border-dashed border-border">
        {/* Warning */}
        {breakdown.warning && (
          <div className="flex items-start gap-2 text-xs text-warning bg-warning/10 rounded-md p-2">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{breakdown.warning}</span>
          </div>
        )}

        {/* Formula */}
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Formula</p>
          <div className="bg-muted/20 rounded-md p-2.5 border border-border">
            <code className="text-sm font-mono font-bold text-accent">{breakdown.formula}</code>
            <p className="text-xs text-muted-foreground mt-1">{breakdown.formulaDescription}</p>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Inputs from Drawing</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {breakdown.inputs.map((inp, i) => (
              <div key={i} className="bg-muted/15 rounded px-2.5 py-1.5 border border-border">
                <p className="text-[10px] text-muted-foreground">{inp.name}</p>
                <p className="text-sm font-mono font-medium">{inp.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Source Elements */}
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Source Elements ({breakdown.elements.length})</p>
          <div className="max-h-32 overflow-y-auto rounded border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/20">
                  <th className="px-2 py-1 text-left font-medium text-muted-foreground">ID</th>
                  <th className="px-2 py-1 text-left font-medium text-muted-foreground">Label</th>
                  <th className="px-2 py-1 text-right font-medium text-muted-foreground">Dimensions</th>
                  <th className="px-2 py-1 text-right font-medium text-muted-foreground">Qty</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.elements.map((el, i) => (
                  <tr key={i} className="border-t border-border/50 hover:bg-muted/10">
                    <td className="px-2 py-1 font-mono text-muted-foreground">{el.id}</td>
                    <td className="px-2 py-1">{el.label}</td>
                    <td className="px-2 py-1 text-right font-mono">{el.dims}</td>
                    <td className="px-2 py-1 text-right font-mono font-medium">{el.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Step-by-step calculation */}
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Step-by-Step Calculation</p>
          <div className="space-y-1">
            {breakdown.steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs bg-muted/10 rounded px-2.5 py-1.5 border border-border/50">
                <span className="text-muted-foreground shrink-0 w-28 truncate" title={step.label}>{step.label}</span>
                <code className="font-mono text-foreground flex-1">{step.expression}</code>
                <span className="font-mono font-bold text-accent shrink-0">= {step.result} {step.unit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Final result */}
        <div className="bg-accent/5 border border-accent/20 rounded-md p-2.5 flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Net Quantity</p>
            <p className="font-mono font-bold text-sm">{breakdown.finalQty.toLocaleString()} {""}</p>
          </div>
          <div className="text-right space-y-0.5">
            <p className="text-xs text-muted-foreground">With {wastagePercent}% Wastage</p>
            <p className="font-mono font-bold text-sm text-accent">{breakdown.wastageQty.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function BOQResultsTable({ boqItems, elements, processedAt, sourceFiles, gridResult }: BOQResultsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const categories = [...new Set(boqItems.map(b => b.category))];
  const grandTotal = boqItems.reduce((sum, b) => sum + b.amount * (1 + b.wastagePercent / 100), 0);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (boqItems.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Extraction Failed</AlertTitle>
        <AlertDescription>
          No quantities could be computed from the uploaded drawings. Please verify the files contain valid structural drawings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Computed Bill of Quantities</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generated {processedAt.toLocaleTimeString()} from {sourceFiles.length} file{sourceFiles.length !== 1 ? "s" : ""} •{" "}
            {elements.length} elements detected •{" "}
            <button
              className="underline underline-offset-2 hover:text-foreground transition-colors"
              onClick={() => {
                const allIds = boqItems.filter(b => b.breakdown).map(b => b.id);
                setExpandedRows(prev => prev.size === allIds.length ? new Set() : new Set(allIds));
              }}
            >
              {expandedRows.size > 0 ? "Collapse all breakdowns" : "Expand all breakdowns"}
            </button>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.info("Excel export will be available when backend is connected")}
          className="gap-2"
        >
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      <Tabs defaultValue="grid">
        <TabsList>
          <TabsTrigger value="grid">Grid Detection</TabsTrigger>
          <TabsTrigger value="boq">BOQ Table</TabsTrigger>
          <TabsTrigger value="elements">Detected Elements ({elements.length})</TabsTrigger>
        </TabsList>

        {gridResult && (
          <TabsContent value="grid" className="mt-3">
            <StructuralGridOverlay gridResult={gridResult} elements={elements} />
          </TabsContent>
        )}

        <TabsContent value="boq" className="mt-3">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-8"></th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Qty</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Unit</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Rate (₹)</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount (₹)</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Wastage</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <>{/* Fragment key on category row */}
                      <tr key={`cat-${cat}`} className="bg-muted/10">
                        <td colSpan={7} className="px-4 py-2 font-semibold text-xs uppercase tracking-wider text-accent">{cat}</td>
                      </tr>
                      {boqItems.filter(b => b.category === cat).map((item, i) => (
                        <>
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className={`border-b last:border-0 transition-colors ${item.breakdown ? "cursor-pointer hover:bg-muted/15" : "hover:bg-muted/10"} ${expandedRows.has(item.id) ? "bg-muted/10" : ""}`}
                            onClick={() => item.breakdown && toggleRow(item.id)}
                          >
                            <td className="px-4 py-3">
                              {item.breakdown && (
                                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedRows.has(item.id) ? "rotate-180" : ""}`} />
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {item.description}
                                {item.breakdown && (
                                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-0.5 shrink-0">
                                    <Calculator className="h-2.5 w-2.5" />
                                    Verified
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono">{item.quantity.toFixed(2)}</td>
                            <td className="px-4 py-3 text-center text-muted-foreground">{item.unit}</td>
                            <td className="px-4 py-3 text-right font-mono">{item.rate.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-mono font-medium">{item.amount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground">{item.wastagePercent}%</td>
                          </motion.tr>
                          <AnimatePresence>
                            {expandedRows.has(item.id) && item.breakdown && (
                              <tr key={`bd-${item.id}`}>
                                <td colSpan={7} className="p-0">
                                  <BreakdownPanel breakdown={item.breakdown} wastagePercent={item.wastagePercent} />
                                </td>
                              </tr>
                            )}
                          </AnimatePresence>
                        </>
                      ))}
                    </>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/20">
                    <td colSpan={5} className="px-4 py-3 font-bold text-right">Grand Total (incl. wastage)</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-accent text-lg">₹{Math.round(grandTotal).toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="elements" className="mt-3">
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Label</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">L (m)</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">W (m)</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">H (m)</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Qty</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Layer</th>
                  </tr>
                </thead>
                <tbody>
                  {elements.map((el, i) => (
                    <motion.tr
                      key={el.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b last:border-0 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${elementTypeColors[el.type] || ""}`}>
                          {el.type}{el.rebarDiameter ? ` Ø${el.rebarDiameter}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{el.label}</td>
                      <td className="px-4 py-3 text-right font-mono">{el.length}</td>
                      <td className="px-4 py-3 text-right font-mono">{el.width || "—"}</td>
                      <td className="px-4 py-3 text-right font-mono">{el.height || "—"}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium">{el.quantity}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{el.layer}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
