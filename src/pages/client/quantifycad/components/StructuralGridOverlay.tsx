import { motion } from "framer-motion";
import type { GridDetectionResult, StructuralElement } from "../lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Grid3X3, Ruler } from "lucide-react";

interface StructuralGridOverlayProps {
  gridResult: GridDetectionResult;
  elements: StructuralElement[];
}

export function StructuralGridOverlay({ gridResult, elements }: StructuralGridOverlayProps) {
  const { xLabels, yLabels, gridLines, xSpacings, ySpacings, activeIntersections } = gridResult;
  const activeSet = new Set(activeIntersections);

  const xLines = gridLines.filter(g => g.axis === "x");
  const yLines = gridLines.filter(g => g.axis === "y");

  const maxX = Math.max(...xLines.map(g => g.position));
  const maxY = Math.max(...yLines.map(g => g.position));

  const padding = 80;
  const svgW = 900;
  const svgH = Math.max(450, Math.round((maxY / (maxX || 1)) * (svgW - padding * 2)) + padding * 2);
  const scaleX = (svgW - padding * 2) / (maxX || 1);
  const scaleY = (svgH - padding * 2) / (maxY || 1);

  const toSvgX = (v: number) => padding + v * scaleX;
  const toSvgY = (v: number) => padding + v * scaleY;

  const columns = elements.filter(e => e.type === "column");
  const beams = elements.filter(e => e.type === "beam");
  const slabs = elements.filter(e => e.type === "slab");

  const getColGridPos = (label: string) => {
    const match = label.match(/Col ([A-Z])(\d+)/);
    if (!match) return null;
    const xi = xLabels.indexOf(match[1]);
    const yi = yLabels.indexOf(match[2]);
    if (xi < 0 || yi < 0) return null;
    return { x: xLines[xi].position, y: yLines[yi].position };
  };

  const getBeamEndpoints = (label: string) => {
    const hMatch = label.match(/Beam ([A-Z])-([A-Z])\/(\d+)/);
    if (hMatch) {
      const xi1 = xLabels.indexOf(hMatch[1]);
      const xi2 = xLabels.indexOf(hMatch[2]);
      const yi = yLabels.indexOf(hMatch[3]);
      if (xi1 >= 0 && xi2 >= 0 && yi >= 0)
        return { x1: xLines[xi1].position, y1: yLines[yi].position, x2: xLines[xi2].position, y2: yLines[yi].position };
    }
    const vMatch = label.match(/Beam ([A-Z])\/(\d+)-(\d+)/);
    if (vMatch) {
      const xi = xLabels.indexOf(vMatch[1]);
      const yi1 = yLabels.indexOf(vMatch[2]);
      const yi2 = yLabels.indexOf(vMatch[3]);
      if (xi >= 0 && yi1 >= 0 && yi2 >= 0)
        return { x1: xLines[xi].position, y1: yLines[yi1].position, x2: xLines[xi].position, y2: yLines[yi2].position };
    }
    return null;
  };

  const getSlabBay = (label: string) => {
    const match = label.match(/Slab ([A-Z])(\d+)-([A-Z])(\d+)/);
    if (!match) return null;
    const xi1 = xLabels.indexOf(match[1]);
    const yi1 = yLabels.indexOf(match[2]);
    const xi2 = xLabels.indexOf(match[3]);
    const yi2 = yLabels.indexOf(match[4]);
    if (xi1 >= 0 && yi1 >= 0 && xi2 >= 0 && yi2 >= 0) {
      return {
        x: xLines[xi1].position, y: yLines[yi1].position,
        w: xLines[xi2].position - xLines[xi1].position,
        h: yLines[yi2].position - yLines[yi1].position,
      };
    }
    return null;
  };

  // Separate info-level warnings from real warnings
  const realWarnings = gridResult.warnings.filter(w => !w.includes("not errors"));
  const infoNotes = gridResult.warnings.filter(w => w.includes("not errors"));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Structural Summary */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5 text-accent" />
          <h3 className="font-bold text-sm">Structural Grid Detection Summary</h3>
          <Badge
            variant={gridResult.completeness >= 95 ? "default" : gridResult.completeness >= 80 ? "secondary" : "destructive"}
            className="ml-auto text-xs"
          >
            {gridResult.completeness}% Complete
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryStat label="Grid Intersections" value={gridResult.intersections} />
          <SummaryStat label="Columns Detected" value={gridResult.columnsDetected} expected={gridResult.intersections} />
          <SummaryStat label="Beam Segments" value={gridResult.beamSegmentsDetected} />
          <SummaryStat label="Slab Bays" value={gridResult.slabBaysDetected} expected={gridResult.totalGridBays} />
        </div>

        {/* Grid Accuracy Validation */}
        <div className="glass-card rounded-lg p-3 space-y-2 border border-border">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-accent" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grid Accuracy Validation</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div><span className="text-muted-foreground">Vertical (X) axes:</span> <span className="font-mono font-semibold">{xLabels.length}</span></div>
            <div><span className="text-muted-foreground">Horizontal (Y) axes:</span> <span className="font-mono font-semibold">{yLabels.length}</span></div>
            <div><span className="text-muted-foreground">Column alignment:</span> <span className="font-mono font-semibold">{gridResult.columnAlignmentPercent}%</span></div>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-muted-foreground">X-axis spacings (m):</p>
            <div className="flex flex-wrap gap-1">
              {xSpacings.map((s, i) => (
                <Badge key={`xs-${i}`} variant="outline" className="font-mono text-[10px] h-5 px-1.5">
                  {xLabels[i]}→{xLabels[i + 1]}: {(s * 1000).toFixed(0)}mm
                </Badge>
              ))}
            </div>
            <p className="text-muted-foreground mt-1">Y-axis spacings (m):</p>
            <div className="flex flex-wrap gap-1">
              {ySpacings.map((s, i) => (
                <Badge key={`ys-${i}`} variant="outline" className="font-mono text-[10px] h-5 px-1.5">
                  {yLabels[i]}→{yLabels[i + 1]}: {(s * 1000).toFixed(0)}mm
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-muted-foreground">Grid: {xLabels.length}×{yLabels.length}</span>
          <span className="text-muted-foreground">X-axes: {xLabels.join(", ")}</span>
          <span className="text-muted-foreground">Y-axes: {yLabels.join(", ")}</span>
          <span className="text-muted-foreground">
            Footprint: {((xLines[xLines.length - 1]?.position ?? 0) * 1000).toFixed(0)}mm × {((yLines[yLines.length - 1]?.position ?? 0) * 1000).toFixed(0)}mm
          </span>
        </div>

        {realWarnings.length > 0 && (
          <div className="space-y-1.5">
            {realWarnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-warning bg-warning/10 rounded-md p-2">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {infoNotes.length > 0 && (
          <div className="space-y-1.5">
            {infoNotes.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/20 rounded-md p-2">
                <Grid3X3 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {realWarnings.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-success bg-success/10 rounded-md p-2">
            <CheckCircle className="h-3.5 w-3.5 shrink-0" />
            <span>All structural elements detected successfully. Grid extraction is dimensionally accurate.</span>
          </div>
        )}
      </div>

      {/* SVG Overlay */}
      <div className="glass-card rounded-xl p-4 overflow-x-auto">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Visual Grid Overlay — Non-Uniform Spacing</p>
        <svg width={svgW} height={svgH} className="mx-auto" viewBox={`0 0 ${svgW} ${svgH}`}>
          {/* Slab bays */}
          {slabs.map((s, i) => {
            const bay = getSlabBay(s.label);
            if (!bay) return null;
            return (
              <rect key={`slab-${i}`}
                x={toSvgX(bay.x)} y={toSvgY(bay.y)}
                width={bay.w * scaleX} height={bay.h * scaleY}
                className="fill-primary/10 stroke-primary/30" strokeWidth={1} rx={2}
              />
            );
          })}

          {/* Inactive intersections (greyed out) */}
          {xLabels.map((_, xi) =>
            yLabels.map((_, yi) => {
              if (activeSet.has(`${xi},${yi}`)) return null;
              return (
                <circle key={`inactive-${xi}-${yi}`}
                  cx={toSvgX(xLines[xi].position)} cy={toSvgY(yLines[yi].position)}
                  r={4} className="fill-muted-foreground/20 stroke-muted-foreground/30" strokeWidth={1} strokeDasharray="2,2"
                />
              );
            })
          )}

          {/* Grid lines */}
          {xLines.map((g, i) => (
            <g key={`xg-${i}`}>
              <line x1={toSvgX(g.position)} y1={padding - 20} x2={toSvgX(g.position)} y2={svgH - padding + 20}
                className="stroke-border" strokeWidth={1} strokeDasharray="4,4" />
              <text x={toSvgX(g.position)} y={padding - 35} textAnchor="middle"
                className="fill-muted-foreground text-[11px] font-mono font-bold">{g.label}</text>
              {/* Spacing dimension between this and next grid line */}
              {i < xLines.length - 1 && (
                <g>
                  <line x1={toSvgX(g.position) + 2} y1={svgH - padding + 35}
                    x2={toSvgX(xLines[i + 1].position) - 2} y2={svgH - padding + 35}
                    className="stroke-accent" strokeWidth={1} markerEnd="url(#arrowhead)" markerStart="url(#arrowhead-rev)" />
                  <text x={(toSvgX(g.position) + toSvgX(xLines[i + 1].position)) / 2} y={svgH - padding + 50}
                    textAnchor="middle" className="fill-accent text-[9px] font-mono font-semibold">
                    {((xLines[i + 1].position - g.position) * 1000).toFixed(0)}
                  </text>
                </g>
              )}
            </g>
          ))}
          {yLines.map((g, i) => (
            <g key={`yg-${i}`}>
              <line x1={padding - 20} y1={toSvgY(g.position)} x2={svgW - padding + 20} y2={toSvgY(g.position)}
                className="stroke-border" strokeWidth={1} strokeDasharray="4,4" />
              <text x={padding - 35} y={toSvgY(g.position) + 4} textAnchor="middle"
                className="fill-muted-foreground text-[11px] font-mono font-bold">{g.label}</text>
              {/* Spacing dimension between this and next grid line */}
              {i < yLines.length - 1 && (
                <g>
                  <line x1={svgW - padding + 35} y1={toSvgY(g.position) + 2}
                    x2={svgW - padding + 35} y2={toSvgY(yLines[i + 1].position) - 2}
                    className="stroke-accent" strokeWidth={1} />
                  <text x={svgW - padding + 50} y={(toSvgY(g.position) + toSvgY(yLines[i + 1].position)) / 2 + 3}
                    textAnchor="middle" className="fill-accent text-[9px] font-mono font-semibold"
                    transform={`rotate(-90, ${svgW - padding + 50}, ${(toSvgY(g.position) + toSvgY(yLines[i + 1].position)) / 2 + 3})`}>
                    {((yLines[i + 1].position - g.position) * 1000).toFixed(0)}
                  </text>
                </g>
              )}
            </g>
          ))}

          {/* Arrow markers */}
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" className="fill-accent" />
            </marker>
            <marker id="arrowhead-rev" markerWidth="6" markerHeight="4" refX="1" refY="2" orient="auto-start-reverse">
              <polygon points="6 0, 0 2, 6 4" className="fill-accent" />
            </marker>
          </defs>

          {/* Beams */}
          {beams.map((b, i) => {
            const ep = getBeamEndpoints(b.label);
            if (!ep) return null;
            return (
              <line key={`beam-${i}`}
                x1={toSvgX(ep.x1)} y1={toSvgY(ep.y1)} x2={toSvgX(ep.x2)} y2={toSvgY(ep.y2)}
                className="stroke-success" strokeWidth={3} strokeLinecap="round" />
            );
          })}

          {/* Columns */}
          {columns.map((c, i) => {
            const pos = getColGridPos(c.label);
            if (!pos) return null;
            const size = 10;
            return (
              <rect key={`col-${i}`}
                x={toSvgX(pos.x) - size / 2} y={toSvgY(pos.y) - size / 2}
                width={size} height={size}
                className="fill-accent stroke-accent/80" strokeWidth={1.5} rx={1} />
            );
          })}

          {/* Legend */}
          <g transform={`translate(${svgW - 180}, ${svgH - 90})`}>
            <rect x={0} y={0} width={170} height={80} rx={6} className="fill-background/90 stroke-border" strokeWidth={1} />
            <rect x={10} y={12} width={10} height={10} className="fill-accent" rx={1} />
            <text x={26} y={21} className="fill-foreground text-[10px]">Column ({columns.length})</text>
            <line x1={10} y1={32} x2={20} y2={32} className="stroke-success" strokeWidth={3} />
            <text x={26} y={35} className="fill-foreground text-[10px]">Beam ({beams.length})</text>
            <rect x={10} y={42} width={10} height={10} className="fill-primary/20 stroke-primary/40" rx={1} />
            <text x={26} y={51} className="fill-foreground text-[10px]">Slab ({slabs.length})</text>
            <circle cx={15} cy={67} r={4} className="fill-muted-foreground/20 stroke-muted-foreground/30" strokeWidth={1} strokeDasharray="2,2" />
            <text x={26} y={70} className="fill-foreground text-[10px]">Inactive node</text>
          </g>
        </svg>
      </div>
    </motion.div>
  );
}

function SummaryStat({ label, value, expected }: { label: string; value: number; expected?: number }) {
  const isComplete = expected === undefined || value >= expected;
  return (
    <div className="bg-muted/15 rounded-lg px-3 py-2 border border-border">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold font-mono mt-0.5">
        {value}
        {expected !== undefined && (
          <span className={`text-xs font-normal ml-1 ${isComplete ? "text-success" : "text-warning"}`}>
            / {expected}
          </span>
        )}
      </p>
    </div>
  );
}
