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

function parseWidthCm(v: unknown): number | undefined {
  const s = String(v ?? "");
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*cm/i);
  if (m) return Number(m[1]!.replace(",", "."));
  return undefined;
}

function parseGrStr(v: unknown): number | undefined {
  const s = String(v ?? "");
  const m = s.match(/(\d+)\s*gr/i);
  if (m) return Number(m[1]);
  return num(v);
}

/** “Gr. | Pam. | Pol. | Lyc.” tekrarlayan ORANLARI sayfaları */
export function parseOranlariSheet(
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
  },
  titleNote: string
): Omit<TechnicalRecord, "id" | "createdAt" | "updatedAt">[] {
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { header: 1, defval: null });
  let headerRow = -1;
  let stride = 5;

  const isGrHeader = (cell: unknown) => {
    const t = String(cell ?? "").trim().toLowerCase();
    return t === "gr." || t === "gramaj";
  };

  for (let r = 0; r < Math.min(rows.length, 25); r++) {
    const row = rows[r]!;
    let grCol = -1;
    for (let c = 0; c < Math.min(row.length, 80); c++) {
      if (isGrHeader(row[c])) {
        grCol = c;
        break;
      }
    }
    if (grCol < 0) continue;
    let nextGr = -1;
    for (let c = grCol + 1; c < Math.min(row.length, 120); c++) {
      if (isGrHeader(row[c])) {
        nextGr = c;
        break;
      }
    }
    if (nextGr > 0) stride = nextGr - grCol;
    headerRow = r;
    break;
  }

  if (headerRow < 0) return [];

  const hdr = rows[headerRow]!;
  const grCol = (() => {
    for (let c = 0; c < Math.min(hdr.length, 80); c++) {
      const t = String(hdr[c] ?? "").trim().toLowerCase();
      if (t === "gr." || t === "gramaj") return c;
    }
    return -1;
  })();
  const hasPamCol =
    grCol >= 0 &&
    String(hdr[grCol + 1] ?? "")
      .toLowerCase()
      .includes("pam");
  const useLycOnlyStride3 = grCol >= 0 && !hasPamCol;

  const out: Omit<TechnicalRecord, "id" | "createdAt" | "updatedAt">[] = [];
  let seq = 0;

  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r]!;
    const w = parseWidthCm(row[0]);
    if (w == null) continue;

    if (useLycOnlyStride3) {
      for (let c = 1; c < row.length; c += 3) {
        const gsm = parseGrStr(row[c]);
        const lyc = num(row[c + 1]);
        if (gsm == null || gsm <= 0) continue;
        if (lyc == null) continue;
        seq += 1;
        out.push({
          fabricTypeId: base.fabricTypeId,
          fabricTypeName: base.fabricTypeName,
          machineId: base.machineId,
          machineName: base.machineName,
          machineType: base.machineType,
          machineDiameter: base.machineDiameter,
          pusFein: base.pusFein,
          needleCount: base.needleCount,
          yarnTypeSummary: "ORAN tablo (Lyc%)",
          yarnComponents: yarnComponentsFromPercent(undefined, undefined, lyc),
          openWidth: Math.round(w * 10) / 10,
          tubeWidth: Math.round((w / 2) * 10) / 10,
          weightGsm: Math.round(gsm),
          lycraRatio: Math.round(lyc * 10) / 10,
          isApproved: false,
          isActive: true,
          sourceFileName: base.sourceFileName,
          sourceSheetName: base.sourceSheetName,
          sourceRowNumber: seq,
          confidenceScore: 0.7,
          notes: `${titleNote} — ${base.sourceSheetName} satır ${r + 1}`,
        });
      }
      continue;
    }

    for (let c = 1; c < row.length; c += stride) {
      const gsm = parseGrStr(row[c]);
      const pam = num(row[c + 1]);
      const pol = num(row[c + 2]);
      const lyc = num(row[c + 3]);
      if (gsm == null || gsm <= 0) continue;
      if (pam == null && pol == null && lyc == null) continue;

      seq += 1;
      out.push({
        fabricTypeId: base.fabricTypeId,
        fabricTypeName: base.fabricTypeName,
        machineId: base.machineId,
        machineName: base.machineName,
        machineType: base.machineType,
        machineDiameter: base.machineDiameter,
        pusFein: base.pusFein,
        needleCount: base.needleCount,
        yarnTypeSummary: "ORAN tablo",
        yarnComponents: yarnComponentsFromPercent(pam, pol, lyc),
        openWidth: Math.round(w * 10) / 10,
        tubeWidth: Math.round((w / 2) * 10) / 10,
        weightGsm: Math.round(gsm),
        cottonRatio: pam != null ? Math.round(pam * 10) / 10 : undefined,
        polyesterRatio: pol != null ? Math.round(pol * 10) / 10 : undefined,
        lycraRatio: lyc != null ? Math.round(lyc * 10) / 10 : undefined,
        isApproved: false,
        isActive: true,
        sourceFileName: base.sourceFileName,
        sourceSheetName: base.sourceSheetName,
        sourceRowNumber: seq,
        confidenceScore: 0.75,
        notes: `${titleNote} — ${base.sourceSheetName} satır ${r + 1}`,
      });
    }
  }

  return out;
}
