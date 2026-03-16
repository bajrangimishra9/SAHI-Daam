import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, MapPin, Calendar, Warehouse, BarChart3, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ProjectConfig {
  totalArea: number;
  areaUnit: "sqft" | "sqm";
  completionPercent: number;
  hasStorage: boolean;
  storageCapacity: number;
  storageType: "open" | "covered" | "warehouse";
  startDate: string;
  endDate: string;
  planningInterval: "weekly" | "monthly" | "custom";
}

interface Props {
  onComplete: (config: ProjectConfig) => void;
}

export function ProcurementWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<ProjectConfig>({
    totalArea: 5000,
    areaUnit: "sqft",
    completionPercent: 50,
    hasStorage: true,
    storageCapacity: 200,
    storageType: "open",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    planningInterval: "monthly",
  });

  const steps = [
    { title: "Project Area", icon: MapPin, description: "Total built-up area and completion status" },
    { title: "Storage", icon: Warehouse, description: "On-site storage capacity for materials" },
    { title: "Timeline", icon: Calendar, description: "Project schedule and planning interval" },
    { title: "Confirm", icon: CheckCircle, description: "Review and launch AI procurement planner" },
  ];

  const update = (partial: Partial<ProjectConfig>) => setConfig(prev => ({ ...prev, ...partial }));

  const totalMonths = Math.max(1, Math.round(
    (new Date(config.endDate).getTime() - new Date(config.startDate).getTime()) / (30.44 * 24 * 60 * 60 * 1000)
  ));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-accent" />
          AI Procurement Planner
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure project parameters to generate optimized procurement recommendations
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold shrink-0 transition-colors ${
              i <= step ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && <div className={`h-0.5 flex-1 transition-colors ${i < step ? "bg-accent" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              {(() => { const Icon = steps[step].icon; return <Icon className="h-4 w-4 text-accent" />; })()}
              {steps[step].title}
            </h3>
            <p className="text-xs text-muted-foreground">{steps[step].description}</p>
          </div>

          {step === 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Total Project Area</Label>
                <Input type="number" value={config.totalArea} onChange={e => update({ totalArea: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Unit</Label>
                <Select value={config.areaUnit} onValueChange={(v: "sqft" | "sqm") => update({ areaUnit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sqft">sq.ft</SelectItem>
                    <SelectItem value="sqm">sq.m</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-xs">Coverage Area (%)</Label>
                <Input type="number" min={0} max={100} value={config.completionPercent} onChange={e => update({ completionPercent: Number(e.target.value) })} />
                <p className="text-[10px] text-muted-foreground">{config.completionPercent}% of the project is already completed</p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="text-xs">Is storage available on-site?</Label>
                <div className="flex gap-2">
                  <Button variant={config.hasStorage ? "default" : "outline"} size="sm" onClick={() => update({ hasStorage: true })}>Yes</Button>
                  <Button variant={!config.hasStorage ? "default" : "outline"} size="sm" onClick={() => update({ hasStorage: false })}>No</Button>
                </div>
              </div>
              {config.hasStorage && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Storage Capacity (sq.m)</Label>
                    <Input type="number" value={config.storageCapacity} onChange={e => update({ storageCapacity: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Storage Type</Label>
                    <Select value={config.storageType} onValueChange={(v: "open" | "covered" | "warehouse") => update({ storageType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open Yard</SelectItem>
                        <SelectItem value="covered">Covered Shed</SelectItem>
                        <SelectItem value="warehouse">Warehouse</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Project Start Date</Label>
                <Input type="date" value={config.startDate} onChange={e => update({ startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Expected Completion Date</Label>
                <Input type="date" value={config.endDate} onChange={e => update({ endDate: e.target.value })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-xs">Planning Interval</Label>
                <Select value={config.planningInterval} onValueChange={(v: "weekly" | "monthly" | "custom") => update({ planningInterval: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">Duration: ~{totalMonths} months</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 bg-muted/20 rounded-lg p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Configuration Summary</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Area:</span>
                <span className="font-mono">{config.totalArea.toLocaleString()} {config.areaUnit}</span>
                <span className="text-muted-foreground">Progress:</span>
                <span className="font-mono">{config.completionPercent}%</span>
                <span className="text-muted-foreground">Storage:</span>
                <span className="font-mono">{config.hasStorage ? `${config.storageCapacity} sq.m (${config.storageType})` : "None"}</span>
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-mono">{totalMonths} months</span>
                <span className="text-muted-foreground">Interval:</span>
                <span className="font-mono capitalize">{config.planningInterval}</span>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)} disabled={step === 0} className="gap-1">
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>
        {step < steps.length - 1 ? (
          <Button size="sm" onClick={() => setStep(s => s + 1)} className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" onClick={() => onComplete(config)} className="gap-1 bg-success text-success-foreground hover:bg-success/90">
            <BarChart3 className="h-4 w-4" /> Generate Procurement Plan
          </Button>
        )}
      </div>
    </motion.div>
  );
}
