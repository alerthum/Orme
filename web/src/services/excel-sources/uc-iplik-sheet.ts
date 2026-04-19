import * as XLSX from "xlsx";
import type { TechnicalRecord, YarnComponentRatio } from "@/types";

function yarnComponentsFromPercent(
  pam?: number,
  pol?: number,
  lyc?: number
): YarnComponentRatio[] | undefined {
  const out: YarnComponentRatio[] = [];
  if (pam != null && pam > 0) out.push({ component: "Pamuk", ratio: pam });
  if (pol != null && pol > 0) out.push({ component: "Polyester", ratio: pol });
  if (lyc != null && lyc > 0) out.push({ component: "Likra", ratio: lyc });
  return out.length ? out : undefined;
}

type Row = (string | number | null | undefined)[];

function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v).replace(/[$€\s]/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function parseCmCell(v: unknown): number | undefined {
  const s = String(v ?? "").replace(",", ".");
  const m = s.match(/([\d.]+)\s*cm/i);
  if (m) return Number(m[1]);
  const n = num(v);
  return n != null && n > 0 && n < 200 ? n : undefined;
}

/** “280 Gr/m2” blokları: KUMAŞ CİNSİ + Pam/Pol/Lyc + cm + mamül gramaj */
export function parseUcIplikSheet(
  sheet: XLSX.WorkSheet,
  base: {
    sourceFileName: string;
    sourceSheetName: string;
    fabricTypeId: string;
    fabricTypeName: string;
    machineId: string;
    machineName: string;
    machineType: string;
    machineDiameter: number;
    pusFein: number;
    needleCount: number;
  }
): Omit<TechnicalRecord, "id" | "createdAt" | "updatedAt">[] {
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { header: 1, defval: null });
  const titleRow = rows.findIndex((row) =>
    row.some((cell) => /\d+\s*Gr\/m2/i.test(String(cell ?? "")))
  );
  if (titleRow < 0) return [];

  const blockStarts: number[] = [];
  const tr = rows[titleRow]!;
  for (let c = 0; c < tr.length; c++) {
    if (/\d+\s*Gr\/m2/i.test(String(tr[c] ?? ""))) blockStarts.push(c);
  }

  const out: Omit<TechnicalRecord, "id" | "createdAt" | "updatedAt">[] = [];
  let seq = 0;

  for (const bc of blockStarts) {
    const targetGsmM = String(rows[titleRow]?.[bc] ?? "").match(/(\d+)\s*Gr\/m2/i);
    const targetGsm = targetGsmM ? Number(targetGsmM[1]) : undefined;
    if (targetGsm == null) continue;

    const headerRow = rows[titleRow + 2];
    if (!headerRow) continue;
    const cinsRow = rows[titleRow + 3];
    if (!cinsRow) continue;

    for (let r = titleRow + 4; r < rows.length; r++) {
      const row = rows[r]!;
      const code = String(row[bc] ?? "").trim();
      if (!code || !/\d+\/\d+\/\d+/.test(code)) continue;

      const pam = num(row[bc + 1]);
      const pol = num(row[bc + 2]);
      const lyc = num(row[bc + 3]);
      const d1 = parseCmCell(row[bc + 4]);
      const d2 = parseCmCell(row[bc + 5]);
      const d3 = parseCmCell(row[bc + 6]);
      const mamul = num(row[bc + 7]);

      if (pam == null && pol == null && lyc == null) continue;

      seq += 1;
      const tubeGuess =
        d1 != null && d2 != null ? Math.round(((d1 + d2) / 2) * 10) / 10 : d1 ?? 40;

      out.push({
        fabricTypeId: base.fabricTypeId,
        fabricTypeName: base.fabricTypeName,
        machineId: base.machineId,
        machineName: base.machineName,
        machineType: base.machineType,
        machineDiameter: base.machineDiameter,
        pusFein: base.pusFein,
        needleCount: base.needleCount,
        yarnTypeSummary: code,
        yarnComponents: yarnComponentsFromPercent(pam, pol, lyc),
        tubeWidth: tubeGuess,
        openWidth: tubeGuess * 2,
        weightGsm: mamul != null && mamul > 0 ? Math.round(mamul) : targetGsm,
        cottonRatio: pam != null ? Math.round(pam * 10) / 10 : undefined,
        polyesterRatio: pol != null ? Math.round(pol * 10) / 10 : undefined,
        lycraRatio: lyc != null ? Math.round(lyc * 10) / 10 : undefined,
        isApproved: false,
        isActive: true,
        sourceFileName: base.sourceFileName,
        sourceSheetName: base.sourceSheetName,
        sourceRowNumber: seq,
        confidenceScore: 0.72,
        notes: `Üç iplik — hedef tablo ${targetGsm} g/m²; dış/ara/arka cm: ${d1 ?? "?"}/${d2 ?? "?"}/${d3 ?? "?"}`,
      });
    }
  }

  return out;
}
