import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { StructuralElement, BOQItem, GridDetectionResult } from "../lib/mock-data";
import { computeBOQ, simulateElementExtraction } from "../lib/quantity-engine"

interface DetectionResult {
  elements: StructuralElement[];
  gridResult: GridDetectionResult;
  sourceFiles: string[];
  detectedAt: Date;
}

interface ProcessedResult {
  elements: StructuralElement[];
  boqItems: BOQItem[];
  processedAt: Date;
  sourceFiles: string[];
  gridResult: GridDetectionResult;
}

interface ProjectContextValue {
  /** Phase 1: detection only (user must confirm before BOQ) */
  detection: DetectionResult | null;
  /** Phase 2: confirmed + BOQ generated */
  result: ProcessedResult | null;
  isProcessing: boolean;
  /** Run extraction — produces detection result awaiting confirmation */
  processFiles: (files: { name: string; type: "cad" | "pdf"; sheetLabel?: string }[]) => Promise<void>;
  /** Confirm detection and generate BOQ */
  confirmDetection: () => void;
  /** Reject detection and clear */
  rejectDetection: () => void;
  clearResults: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const clearResults = useCallback(() => {
    setDetection(null);
    setResult(null);
  }, []);

  const processFiles = useCallback(async (files: { name: string; type: "cad" | "pdf"; sheetLabel?: string }[]) => {
    setDetection(null);
    setResult(null);
    setIsProcessing(true);

    const delay = files.some(f => f.type === "pdf") ? 4000 : 2500;
    await new Promise(resolve => setTimeout(resolve, delay));

    const { elements, gridResult } = simulateElementExtraction(files);

    if (elements.length === 0) {
      setIsProcessing(false);
      throw new Error("No structural elements could be extracted from the uploaded drawings.");
    }

    setDetection({
      elements,
      gridResult,
      sourceFiles: files.map(f => f.name),
      detectedAt: new Date(),
    });
    setIsProcessing(false);
  }, []);

  const confirmDetection = useCallback(() => {
    if (!detection) return;

    // Block BOQ if completeness < 80%
    if (detection.gridResult.completeness < 80) {
      return; // UI should prevent this
    }

    const boqItems = computeBOQ(detection.elements);
    setResult({
      elements: detection.elements,
      boqItems,
      processedAt: new Date(),
      sourceFiles: detection.sourceFiles,
      gridResult: detection.gridResult,
    });
  }, [detection]);

  const rejectDetection = useCallback(() => {
    setDetection(null);
    setResult(null);
  }, []);

  return (
    <ProjectContext.Provider value={{ detection, result, isProcessing, processFiles, confirmDetection, rejectDetection, clearResults }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}
