import jsPDF from "jspdf";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - jspdf-autotable augments jsPDF instance at runtime
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

export function exportProcurementCsv(params: {
  projectName: string;
  vendorPincode: string;
  radiusKm: number;
  items: ProcurementLine[];
  prefs: { price: PreferenceLevel; speed: PreferenceLevel; risk: PreferenceLevel };
  suppliers: ProcurementSupplierRow[];
  summary: string;
}) {
  const { projectName, vendorPincode, radiusKm, items, prefs, suppliers, summary } = params;
  const lines: string[] = [];
  lines.push(["project", projectName].map(csvEscape).join(","));
  lines.push(["delivery_pincode", vendorPincode].map(csvEscape).join(","));
  lines.push(["radius_km", radiusKm].map(csvEscape).join(","));
  lines.push(["preference_price", prefs.price].map(csvEscape).join(","));
  lines.push(["preference_speed", prefs.speed].map(csvEscape).join(","));
  lines.push(["preference_low_risk", prefs.risk].map(csvEscape).join(","));
  lines.push("");
  lines.push("selected_items");
  lines.push(["material_query", "qty"].map(csvEscape).join(","));
  for (const it of items) lines.push([it.materialQuery, it.qty].map(csvEscape).join(","));
  lines.push("");
  lines.push("supplier_ranking");
  lines.push(
    [
      "rank",
      "supplier_name",
      "supplier_pincode",
      "verification",
      "rating",
      "past_clients",
      "docs_count",
      "distance_km",
      "eta",
      "risk_score",
      "total_landed_cost",
      "score",
    ]
      .map(csvEscape)
      .join(","),
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
        s.distanceKm,
        s.eta,
        Math.round(s.riskScore),
        Math.round(s.totalLandedCost),
        Math.round(s.score),
      ]
        .map(csvEscape)
        .join(","),
    );
  });
  lines.push("");
  lines.push("ai_summary");
  lines.push(csvEscape(summary));

  const safeName = projectName.replace(/\s+/g, "_");
  downloadBlob(`${safeName}_procurement_${vendorPincode}.csv`, new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
}

export function exportProcurementPdf(params: {
  projectName: string;
  vendorPincode: string;
  radiusKm: number;
  items: ProcurementLine[];
  prefs: { price: PreferenceLevel; speed: PreferenceLevel; risk: PreferenceLevel };
  suppliers: ProcurementSupplierRow[];
  summary: string;
}) {
  const { projectName, vendorPincode, radiusKm, items, prefs, suppliers, summary } = params;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(16);
  doc.text(`${projectName} — Procurement Analysis`, 40, 48);
  doc.setFontSize(10);
  doc.text(`Delivery: ${vendorPincode} • Radius: ${radiusKm} km`, 40, 68);
  doc.text(`Preferences: Price ${prefs.price}, Speed ${prefs.speed}, Low Risk ${prefs.risk}`, 40, 84);

  autoTable(doc, {
    startY: 105,
    head: [["Material", "Qty"]],
    body: items.map((i) => [i.materialQuery, String(i.qty)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [20, 90, 95] },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 14,
    head: [["#", "Supplier", "Verif", "Km", "ETA", "Risk", "Total", "Score"]],
    body: suppliers.map((s, idx) => [
      String(idx + 1),
      s.supplierName,
      s.verification,
      String(s.distanceKm),
      s.eta,
      String(Math.round(s.riskScore)),
      `₹ ${Math.round(s.totalLandedCost).toLocaleString()}`,
      String(Math.round(s.score)),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [20, 90, 95] },
    columnStyles: { 0: { cellWidth: 18 }, 3: { cellWidth: 32 }, 5: { cellWidth: 34 }, 7: { cellWidth: 34 } },
  });

  const nextY = (doc as any).lastAutoTable.finalY + 14;
  doc.setFontSize(11);
  doc.text("AI summary", 40, nextY);
  doc.setFontSize(9);
  const wrapped = doc.splitTextToSize(summary, 520);
  doc.text(wrapped, 40, nextY + 14);

  const safeName = projectName.replace(/\s+/g, "_");
  doc.save(`${safeName}_procurement_${vendorPincode}.pdf`);
}
