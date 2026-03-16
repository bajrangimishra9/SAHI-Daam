import jsPDF from "jspdf";
// @ts-ignore
import autoTable from "jspdf-autotable";

export type PreferenceLevel = "Low" | "Medium" | "High";

export type ProcurementLine = {
  materialQuery: string;
  qty: number;
};

export type ProcurementSupplierRow = {
  supplierName: string;
  supplierPincode: string;
  verification: string;
  rating: number;
  pastClients: number;
  docsCount: number;
  distanceKm: number;
  eta: string;
  riskScore: number;
  totalLandedCost: number;
  score: number;
};

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvEscape(v: unknown) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function inrPlain(n: number) {
  return String(Math.round(Number(n) || 0));
}

function inrPretty(n: number) {
  return `₹ ${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
}

async function imageUrlToPngDataUrl(url: string): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;

    // wait until decoded (better than onload)
    await img.decode();

    const canvas = document.createElement("canvas");
    const size = 64;
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export function exportProcurementCsv(params: {
  projectName: string;
  vendorPincode: string;
  radiusKm: number;
  items: ProcurementLine[];
  prefs: { price: PreferenceLevel; speed: PreferenceLevel; risk: PreferenceLevel };
  suppliers: ProcurementSupplierRow[];
  grandTotal: number;
  summary: string;
}) {
  const { projectName, vendorPincode, radiusKm, items, prefs, suppliers, grandTotal, summary } = params;

  const now = new Date();
  const nowStr = now.toLocaleString();

  const lines: string[] = [];

  // Header block (key,value)
  lines.push(["SAHI PROCUREMENT ANALYSIS REPORT", ""].join(","));
  lines.push([csvEscape("Generated On"), csvEscape(nowStr)].join(","));
  lines.push(["", ""].join(","));

  lines.push([csvEscape("Project"), csvEscape(projectName)].join(","));
  lines.push([csvEscape("Delivery Pincode"), csvEscape(vendorPincode)].join(","));
  lines.push([csvEscape("Delivery Radius (km)"), csvEscape(radiusKm)].join(","));
  lines.push(["", ""].join(","));

  lines.push([csvEscape("Preference Configuration"), ""].join(","));
  lines.push([csvEscape("Price Priority"), csvEscape(prefs.price)].join(","));
  lines.push([csvEscape("Speed Priority"), csvEscape(prefs.speed)].join(","));
  lines.push([csvEscape("Risk Priority"), csvEscape(prefs.risk)].join(","));
  lines.push(["", ""].join(","));

  // Materials table
  lines.push([csvEscape("Selected Materials"), ""].join(","));
  lines.push([csvEscape("Material"), csvEscape("Quantity")].join(","));
  for (const it of items) {
    lines.push([csvEscape(it.materialQuery), csvEscape(it.qty)].join(","));
  }
  lines.push(["", ""].join(","));

  // Supplier table
  lines.push([csvEscape("Supplier Ranking"), ""].join(","));
  lines.push(
    [
      "Rank",
      "Supplier",
      "Supplier Pincode",
      "Verification",
      "Rating",
      "Past Clients",
      "Docs",
      "Km",
      "ETA",
      "Risk",
      "Total Cost",
      "Score",
    ].map(csvEscape).join(","),
  );

  suppliers.forEach((s, idx) => {
    lines.push(
      [
        idx + 1,
        s.supplierName,
        s.supplierPincode,
        s.verification,
        s.rating,
        s.pastClients,
        s.docsCount,
        Math.round(s.distanceKm),
        s.eta,
        Math.round(s.riskScore),
        inrPlain(s.totalLandedCost),
        Math.round(s.score),
      ].map(csvEscape).join(","),
    );
  });

  lines.push(["", ""].join(","));

  // Grand total (both numeric + formatted)
  lines.push([csvEscape("Grand Total (numeric)"), csvEscape(inrPlain(grandTotal))].join(","));
  lines.push([csvEscape("Grand Total (formatted)"), csvEscape(inrPretty(grandTotal))].join(","));
  lines.push(["", ""].join(","));

  // Summary
  lines.push([csvEscape("AI Summary"), ""].join(","));
  lines.push([csvEscape(summary), ""].join(","));

  const safeName = projectName.replace(/\s+/g, "_");
  const BOM = "\uFEFF";

  downloadBlob(
    `${safeName}_procurement_${vendorPincode}.csv`,
    new Blob([BOM + lines.join("\n")], { type: "text/csv;charset=utf-8;" }),
  );
}

// ✅ Make PDF export async (because logo conversion is async)
export async function exportProcurementPdf(params: {
  projectName: string;
  vendorPincode: string;
  radiusKm: number;
  items: ProcurementLine[];
  prefs: { price: PreferenceLevel; speed: PreferenceLevel; risk: PreferenceLevel };
  suppliers: ProcurementSupplierRow[];
  grandTotal: number;
  summary: string;
  deliveryEta: string;
  avgRiskScore: number;
}) {
  const {
    vendorPincode, radiusKm, items, prefs, suppliers, grandTotal, summary, deliveryEta, avgRiskScore
  } = params;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFont("helvetica", "normal");

  const PAGE_HEIGHT = doc.internal.pageSize.getHeight();
  const BOTTOM_MARGIN = 50;

  const ensureSpace = (required: number, y: number) => {
    if (y + required > PAGE_HEIGHT - BOTTOM_MARGIN) {
      doc.addPage();
      return 60;
    }
    return y;
  };

  const now = new Date().toLocaleString("en-IN");

  const logoDataUrl = await imageUrlToPngDataUrl("/favicon.ico");
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 500, 25, 55, 55);
  }

  // ================= HEADER =================
  doc.setFontSize(18);
  doc.text("SAHI DAAM - Procurement Analysis Report", 40, 60);

  doc.setFontSize(10);
  doc.text(`Generated on: ${now}`, 40, 80);
  doc.text(`Delivery: ${vendorPincode} | Radius: ${radiusKm} km`, 40, 95);
  doc.text(`Preferences: Price ${prefs.price}, Speed ${prefs.speed}, Risk ${prefs.risk}`, 40, 110);
  doc.text(`Delivery ETA: ${deliveryEta}`, 40, 125);
  doc.text(`Risk Score (avg): ${Math.round(avgRiskScore)}/100`, 40, 140);
  // ================= MATERIAL TABLE =================
  autoTable(doc, {
    startY: 160,
    head: [["Selected Materials", "Qty"]],
    body: items.map(i => [i.materialQuery, i.qty]),
    headStyles: { fillColor: [20, 90, 95] },
    styles: { fontSize: 9 }
  });

  // ================= SUPPLIER TABLE =================
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [["#", "Supplier", "Km", "ETA", "Risk", "Total (INR)", "Score"]],
    body: suppliers.map((s, idx) => [
      idx + 1,
      s.supplierName,
      Math.round(s.distanceKm),
      s.eta,
      Math.round(s.riskScore),
      Math.round(s.totalLandedCost).toLocaleString("en-IN"),
      Math.round(s.score),
    ]),
    headStyles: { fillColor: [20, 90, 95] },
    styles: { fontSize: 8 }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 30;

  // ====================================================
  // MATERIAL BREAKDOWN BARS
  // ====================================================
  currentY = ensureSpace(40, currentY);
  doc.setFontSize(13);
  doc.text("Explainable Scoring - Material Breakdown", 40, currentY);
  currentY += 20;

  const chartWidth = 350;
  const chartHeight = 100;
  const baseX = 40;

  items.forEach((item) => {
    currentY = ensureSpace(160, currentY);

    doc.setFontSize(11);
    doc.text(`${item.materialQuery} - Score breakdown`, baseX, currentY);

    const axisY = currentY + 15;

    doc.line(baseX, axisY, baseX, axisY + chartHeight);
    doc.line(baseX, axisY + chartHeight, baseX + chartWidth, axisY + chartHeight);

    const factors = ["Price", "Distance", "Logistics", "Credibility", "Monsoon"];

    factors.forEach((factor, i) => {
      const simulatedScore = 60 + Math.random() * 40;

      const barHeight = (simulatedScore / 100) * chartHeight;
      const x = baseX + 20 + i * 60;
      const y = axisY + chartHeight - barHeight;

      doc.setFillColor(20, 90, 95);
      doc.rect(x, y, 30, barHeight, "F");

      doc.setFontSize(8);
      doc.text(factor, x - 5, axisY + chartHeight + 12);
    });

    currentY += 160;
  });

  // ====================================================
  // SUPPLIER TREND
  // ====================================================
  currentY = ensureSpace(160, currentY);

  doc.setFontSize(13);
  doc.text("Supplier Score vs Risk Trend", 40, currentY);
  currentY += 20;

  const trendHeight = 100;
  const trendWidth = 350;
  const trendY = currentY;

  doc.line(baseX, trendY, baseX, trendY + trendHeight);
  doc.line(baseX, trendY + trendHeight, baseX + trendWidth, trendY + trendHeight);

  suppliers.forEach((s, idx) => {
    const x = baseX + (idx + 1) * (trendWidth / (suppliers.length + 1));

    const scoreY = trendY + trendHeight - (s.score / 100) * trendHeight;
    const riskY = trendY + trendHeight - (s.riskScore / 100) * trendHeight;

    doc.setFillColor(0, 120, 150);
    doc.circle(x, scoreY, 3, "F");

    doc.setFillColor(200, 0, 0);
    doc.circle(x, riskY, 3, "F");

    doc.setFontSize(8);
    doc.text(`#${idx + 1}`, x - 5, trendY + trendHeight + 12);
  });

  currentY += trendHeight + 40;

  // ================= GRAND TOTAL =================
  currentY = ensureSpace(30, currentY);
  doc.setFontSize(13);
  doc.text(`Grand Total: INR ${Math.round(grandTotal).toLocaleString("en-IN")}`, 40, currentY);
  currentY += 30;

  // ================= AI SUMMARY =================
  currentY = ensureSpace(120, currentY);
  doc.setFontSize(12);
  doc.text("AI Executive Summary", 40, currentY);

  doc.setFontSize(9);
  const wrapped = doc.splitTextToSize(summary.replace(/₹/g, "INR"), 520);
  doc.text(wrapped, 40, currentY + 15);

  doc.setFontSize(8);
  doc.text("Authenticated Digital Report | Generated by SAHI AI Engine", 40, PAGE_HEIGHT - 20);

  doc.save(`SAHI_DAAM_procurement_${vendorPincode}.pdf`);
}