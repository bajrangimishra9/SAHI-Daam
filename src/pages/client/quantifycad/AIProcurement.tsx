import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Upload, BarChart3 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useProject } from "./context/ProjectContext";
import { MaterialRequirementSummary } from "./components/MaterialRequirementSummary";
import { ProcurementWizard, type ProjectConfig } from "./components/ProcurementWizard";
import { ConsumptionTimelineChart } from "./components/ConsumptionTimelineChart";
import { ProcurementTimelineChart } from "./components/ProcurementTimelineChart";
import { AIProcurementChat } from "./components/AIProcurementChat";
import { computeMaterialRequirements } from "./lib/material-calculations";
import type { ProcurementInsight } from "./lib/material-calculations";
import { toast } from "sonner";

export default function ProcurementPage() {
  const { result } = useProject();
  const navigate = useNavigate();
  const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(null);
  const [aiInsights, setAiInsights] = useState<ProcurementInsight[] | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);

  const matReq = useMemo(
    () => (result ? computeMaterialRequirements(result.boqItems) : null),
    [result]
  );

  const totalMonths = projectConfig
    ? Math.max(3, Math.round(
        (new Date(projectConfig.endDate).getTime() - new Date(projectConfig.startDate).getTime()) /
          (30.44 * 24 * 60 * 60 * 1000)
      ))
    : 0;

  const fetchAIInsights = useCallback(async (config: ProjectConfig) => {
    if (!matReq || !result) return;

    setIsLoadingInsights(true);
    try {
      const systemContext = `You are a construction procurement advisor analyzing an Indian construction project.

Project Area: ${config.totalArea} ${config.areaUnit}
Completion: ${config.completionPercent}%
Storage: ${config.hasStorage ? `${config.storageCapacity} sq.m (${config.storageType})` : "None"}
Timeline: ${config.startDate} to ${config.endDate} (~${totalMonths} months)

Material Requirements:
- Cement: ${matReq.totalCementBags} bags
- Sand: ${matReq.totalSandM3} m³
- Aggregate: ${matReq.totalAggregateM3} m³
- Bricks: ${matReq.totalBricks} nos
- Steel: ${matReq.totalSteelKg} kg

Generate insights for each month for the key materials: Cement, Steel, Bricks, Sand, Aggregate.
Consider: monsoon season (Jun-Sep) increases transport costs 10-15%; festival demand (Oct-Nov) raises brick/cement prices; steel prices follow global commodity trends; pre-monsoon stocking is advisable. Storage constraint: max ${config.hasStorage ? config.storageCapacity : 0} sq.m.`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/procurement-advisor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            mode: "insights",
            systemContext,
            messages: [],
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again shortly.");
        } else if (response.status === 402) {
          toast.error("AI credits exhausted. Please add credits.");
        } else {
          toast.error("Failed to generate AI insights.");
        }
        return;
      }

      const data = await response.json();
      setAiInsights(data.insights || []);
      toast.success(`AI generated ${data.insights?.length || 0} procurement insights`);
    } catch (e) {
      console.error("AI insights error:", e);
      toast.error("Could not generate AI insights. Try again.");
    } finally {
      setIsLoadingInsights(false);
    }
  }, [matReq, result, totalMonths]);

  const handleWizardComplete = useCallback((config: ProjectConfig) => {
    setProjectConfig(config);
    fetchAIInsights(config);
    toast.success("Procurement plan generated! AI is analyzing market trends...");
  }, [fetchAIInsights]);

  if (!result) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Procurement Planner</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Intelligent material procurement planning powered by AI
          </p>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No BOQ Data Available</AlertTitle>
            <AlertDescription>
              Upload and process drawings first to generate a BOQ, then return here for AI-powered procurement planning.
            </AlertDescription>
          </Alert>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate("/client/upload-drawing")}>
            <Upload className="h-4 w-4" /> Go to Upload
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-accent" />
          AI Procurement Planner
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Material requirements, consumption timelines, and AI-optimized purchasing
        </p>
      </div>

      {/* Step 1: Material Requirement Summary — always visible */}
      <MaterialRequirementSummary boqItems={result.boqItems} />

      {/* Step 2: Project config wizard */}
      {!projectConfig && (
        <ProcurementWizard onComplete={handleWizardComplete} />
      )}

      {/* Step 3: Charts + AI Chat — after config */}
      {projectConfig && (
        <div className="space-y-6">
          {/* Consumption Timeline */}
          <ConsumptionTimelineChart
            boqItems={result.boqItems}
            config={projectConfig}
            onPeriodClick={setSelectedPeriod}
          />

          {/* AI Optimized Procurement Timeline */}
          <ProcurementTimelineChart
            boqItems={result.boqItems}
            config={projectConfig}
            aiInsights={aiInsights}
            isLoadingInsights={isLoadingInsights}
          />

          {/* AI Chat */}
          <AIProcurementChat boqItems={result.boqItems} config={projectConfig} />
        </div>
      )}
    </div>
  );
}
