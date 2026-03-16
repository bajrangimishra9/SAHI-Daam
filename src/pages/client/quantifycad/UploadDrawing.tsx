import { useState, useCallback, useRef } from "react";
import { Upload as UploadIcon, FileArchive, FileText, CheckCircle, AlertCircle, X, Layers, ShieldCheck, ShieldAlert, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useProject } from "./context/ProjectContext";
import { BOQResultsTable } from "./components/BOQResultsTable";
import { StructuralGridOverlay } from "./components/StructuralGridOverlay";

type FileType = "cad" | "pdf";
type FileEntry = {
  name: string;
  size: string;
  type: FileType;
  status: "ready" | "processing" | "done" | "error";
  sheetLabel?: string;
};

const PDF_SHEET_LABELS = [
  "Architectural Plan",
  "Column Layout",
  "Beam Layout",
  "Slab Reinforcement",
  "Footing Detail",
  "Structural Notes",
];

function detectSheetLabel(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("arch") || lower.includes("plan")) return "Architectural Plan";
  if (lower.includes("col")) return "Column Layout";
  if (lower.includes("beam")) return "Beam Layout";
  if (lower.includes("slab") || lower.includes("rein")) return "Slab Reinforcement";
  if (lower.includes("foot") || lower.includes("fndn")) return "Footing Detail";
  if (lower.includes("note") || lower.includes("spec")) return "Structural Notes";
  return "Drawing Sheet";
}

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<FileType>("cad");
  const [cadFiles, setCadFiles] = useState<FileEntry[]>([]);
  const [pdfFiles, setPdfFiles] = useState<FileEntry[]>([]);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const detectionRef = useRef<HTMLDivElement>(null);
  const boqRef = useRef<HTMLDivElement>(null);

  const { detection, result, isProcessing, processFiles, confirmDetection, rejectDetection, clearResults } = useProject();

  const files = activeTab === "cad" ? cadFiles : pdfFiles;
  const setFiles = activeTab === "cad" ? setCadFiles : setPdfFiles;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  }, [activeTab]);

  const addFiles = (fileList: File[]) => {
    clearResults();
    setProcessingError(null);

    if (activeTab === "cad") {
      const valid = fileList.filter(f => /\.(dwg|dxf)$/i.test(f.name));
      if (valid.length < fileList.length) toast.error("Only .dwg and .dxf files are supported in CAD mode");
      setCadFiles(prev => [...prev, ...valid.map(f => ({
        name: f.name, size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`, type: "cad" as const, status: "ready" as const,
      }))]);
    } else {
      const valid = fileList.filter(f => /\.pdf$/i.test(f.name));
      if (valid.length < fileList.length) toast.error("Only .pdf files are supported in PDF mode");
      setPdfFiles(prev => [...prev, ...valid.map(f => ({
        name: f.name, size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`, type: "pdf" as const, status: "ready" as const,
        sheetLabel: detectSheetLabel(f.name),
      }))]);
    }
  };

  const removeFile = (index: number) => {
    clearResults();
    setProcessingError(null);
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    const setter = activeTab === "cad" ? setCadFiles : setPdfFiles;
    const currentFiles = activeTab === "cad" ? cadFiles : pdfFiles;
    setProcessingError(null);
    setter(prev => prev.map(f => ({ ...f, status: "processing" })));

    if (activeTab === "pdf") {
      ["Extracting geometry from vector PDFs...", "Running OCR on raster sheets...", "Correlating cross-sheet references...", "Building structural graph..."]
        .forEach((msg, i) => setTimeout(() => toast.info(msg), 800 * (i + 1)));
    }

    try {
      await processFiles(currentFiles.map(f => ({ name: f.name, type: f.type, sheetLabel: f.sheetLabel })));
      setter(prev => prev.map(f => ({ ...f, status: "done" })));
      toast.success("Detection complete — review the structural grid overlay below before generating BOQ.");
      setTimeout(() => detectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    } catch (err) {
      setter(prev => prev.map(f => ({ ...f, status: "error" })));
      const message = err instanceof Error ? err.message : "Processing failed. Please try again.";
      setProcessingError(message);
      toast.error(message);
    }
  };

  const handleConfirm = () => {
    confirmDetection();
    toast.success("Detection confirmed. BOQ generated from verified structural graph.");
    setTimeout(() => boqRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
  };

  const handleReject = () => {
    rejectDetection();
    const setter = activeTab === "cad" ? setCadFiles : setPdfFiles;
    setter(prev => prev.map(f => ({ ...f, status: "ready" })));
    toast.info("Detection rejected. Re-upload or modify drawings and try again.");
  };

  const acceptStr = activeTab === "cad" ? ".dwg,.dxf" : ".pdf";
  const inputId = `file-input-${activeTab}`;
  const isLowCompleteness = detection && detection.gridResult.completeness < 80;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Drawings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Geometry-first detection: columns at grid nodes, beams as edges — no label dependency
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FileType)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cad" className="gap-2"><FileArchive className="h-4 w-4" />CAD Files (.dwg / .dxf)</TabsTrigger>
          <TabsTrigger value="pdf" className="gap-2"><FileText className="h-4 w-4" />PDF Drawings</TabsTrigger>
        </TabsList>
        <TabsContent value="cad" className="mt-4 space-y-4">
          <DropZone dragActive={dragActive} setDragActive={setDragActive} handleDrop={handleDrop} inputId={inputId} accept={acceptStr} addFiles={addFiles}
            icon={<UploadIcon className="mx-auto h-12 w-12 text-muted-foreground/40" />} title="Drag & drop CAD files here" subtitle="Supports .dwg and .dxf formats • Max 100MB per file" />
        </TabsContent>
        <TabsContent value="pdf" className="mt-4 space-y-4">
          <DropZone dragActive={dragActive} setDragActive={setDragActive} handleDrop={handleDrop} inputId={inputId} accept={acceptStr} addFiles={addFiles}
            icon={<Layers className="mx-auto h-12 w-12 text-muted-foreground/40" />} title="Drag & drop PDF drawing sheets" subtitle="Upload multiple sheets per project • Max 50MB per file" />
          {pdfFiles.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-lg p-4">
              <p className="text-xs text-muted-foreground font-medium mb-2">Typical sheet types:</p>
              <div className="flex flex-wrap gap-1.5">
                {PDF_SHEET_LABELS.map(label => <Badge key={label} variant="secondary" className="text-xs font-normal">{label}</Badge>)}
              </div>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      {/* File list & process button */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {activeTab === "pdf" && pdfFiles.length > 1 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Layers className="h-3.5 w-3.5" /><span>{pdfFiles.length} sheets will be correlated for cross-reference matching</span>
              </div>
            )}
            {files.map((f, i) => (
              <motion.div key={f.name + i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                transition={{ delay: i * 0.05 }} className="glass-card rounded-lg p-4 flex items-center gap-4">
                {f.type === "pdf" ? <FileText className="h-8 w-8 text-accent shrink-0" /> : <FileArchive className="h-8 w-8 text-accent shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{f.name}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{f.size}</p>
                    {f.sheetLabel && <Badge variant="outline" className="text-[10px] h-4 px-1.5">{f.sheetLabel}</Badge>}
                  </div>
                </div>
                {f.status === "done" ? <CheckCircle className="h-5 w-5 text-success shrink-0" />
                  : f.status === "processing" ? <div className="h-5 w-5 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
                  : f.status === "error" ? <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                  : <button onClick={() => removeFile(i)} className="p-1 rounded hover:bg-muted transition-colors"><X className="h-4 w-4 text-muted-foreground" /></button>}
              </motion.div>
            ))}
            <Button onClick={handleProcess} disabled={files.every(f => f.status !== "ready") || isProcessing}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
              {isProcessing ? "Detecting structural elements..." : "Detect & Analyze"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {processingError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" /><AlertTitle>Processing Failed</AlertTitle>
          <AlertDescription>{processingError}</AlertDescription>
        </Alert>
      )}

      {/* Phase 1: Detection confirmation */}
      {detection && !result && (
        <div ref={detectionRef} className="pt-4 border-t border-border space-y-4">
          <StructuralGridOverlay gridResult={detection.gridResult} elements={detection.elements} />

          {/* Confirmation controls */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              {isLowCompleteness ? <ShieldAlert className="h-5 w-5 text-destructive" /> : <ShieldCheck className="h-5 w-5 text-success" />}
              <h3 className="font-bold text-sm">{isLowCompleteness ? "Incomplete Detection — BOQ Blocked" : "Detection Ready for Confirmation"}</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {isLowCompleteness
                ? "Completeness is below 80%. The BOQ cannot be generated from partial data. Please re-upload higher quality drawings or ensure all grid elements are visible."
                : "Review the overlay above. If the detected columns, beams, and slabs match the drawing, confirm to generate the BOQ. Otherwise reject and re-upload."}
            </p>
            <div className="flex gap-3">
              <Button onClick={handleConfirm} disabled={!!isLowCompleteness} className="bg-success text-success-foreground hover:bg-success/90 gap-2">
                <ShieldCheck className="h-4 w-4" /> Confirm & Generate BOQ
              </Button>
              <Button onClick={handleReject} variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" /> Reject & Re-upload
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Phase 2: Confirmed BOQ */}
      {result && (
        <div ref={boqRef} className="pt-4 border-t border-border">
          <BOQResultsTable
            boqItems={result.boqItems}
            elements={result.elements}
            processedAt={result.processedAt}
            sourceFiles={result.sourceFiles}
            gridResult={result.gridResult}
          />
        </div>
      )}
    </div>
  );
}

function DropZone({ dragActive, setDragActive, handleDrop, inputId, accept, addFiles, icon, title, subtitle }: {
  dragActive: boolean; setDragActive: (v: boolean) => void; handleDrop: (e: React.DragEvent) => void;
  inputId: string; accept: string; addFiles: (files: File[]) => void; icon: React.ReactNode; title: string; subtitle: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={handleDrop}
      className={`glass-card rounded-xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${dragActive ? "border-accent bg-accent/5" : "border-border"}`}
      onClick={() => document.getElementById(inputId)?.click()}>
      <input id={inputId} type="file" accept={accept} multiple className="hidden" onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))} />
      {icon}
      <p className="mt-4 font-medium">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
    </motion.div>
  );
}
