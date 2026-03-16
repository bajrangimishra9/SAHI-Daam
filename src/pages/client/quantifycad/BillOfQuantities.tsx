import { useProject } from "./context/ProjectContext";
import { motion } from "framer-motion";
import { AlertCircle, Upload, BarChart3 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BOQResultsTable } from "./components/BOQResultsTable";
import { MaterialRequirementSummary } from "./components/MaterialRequirementSummary";

export default function BOQPage() {
  const { result } = useProject();
  const navigate = useNavigate();

  if (!result) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bill of Quantities</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload and process drawings to generate a project-specific BOQ
          </p>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No BOQ Data Available</AlertTitle>
            <AlertDescription>
              No drawings have been processed yet. Upload CAD files (.dwg, .dxf) or PDF drawing sheets
              and click "Process" to generate a Bill of Quantities from the extracted structural data.
            </AlertDescription>
          </Alert>

          <Button
            variant="outline"
            className="mt-4 gap-2"
            onClick={() => navigate("/client/upload-drawing")}
          >
            <Upload className="h-4 w-4" /> Go to Upload
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bill of Quantities</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Computed from {result.sourceFiles.length} uploaded file{result.sourceFiles.length !== 1 ? "s" : ""}
        </p>
      </div>

      <BOQResultsTable
        boqItems={result.boqItems}
        elements={result.elements}
        processedAt={result.processedAt}
        sourceFiles={result.sourceFiles}
        gridResult={result.gridResult}
      />

      {/* Material Requirement Summary below BOQ */}
      <MaterialRequirementSummary boqItems={result.boqItems} />

      {/* CTA to Procurement */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" />
            Ready for Procurement Planning?
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Use AI to optimize your material purchasing schedule and reduce costs
          </p>
        </div>
        <Button onClick={() => navigate("/client/ai-procurement")} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
          <BarChart3 className="h-4 w-4" /> Launch AI Planner
        </Button>
      </motion.div>
    </div>
  );
}