import * as XLSX from "xlsx";
import type { TechnicalImportFieldKey } from "@/types";

export type SheetPreview = {
  name: string;
  rowCount: number;
  headers: string[];
  rows: Record<string, string | number | null>[];
};

export function listSheetNames(file: ArrayBuffer): string[] {
  const wb = XLSX.read(file, { type: "array" });
  return wb.SheetNames;
}

export function previewSheet(
  file: ArrayBuffer,
  sheetName: string,
  maxRows = 25
): SheetPreview {
  const wb = XLSX.read(file, { type: "array" });
  const sheet = wb.Sheets[sheetName];
  if (!sheet) {
    throw new Error("Sayfa bulunamadı");
  }
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false,
  });
  const rows = json.slice(0, maxRows).map((row) => {
    const out: Record<string, string | number | null> = {};
    for (const [k, v] of Object.entries(row)) {
      if (v === null || v === undefined) out[k] = null;
      else if (typeof v === "number") out[k] = v;
      else out[k] = String(v);
    }
    return out;
  });
  const headers =
    json.length > 0 ? Object.keys(json[0] as object) : [];
  return {
    name: sheetName,
    rowCount: json.length,
    headers,
    rows,
  };
}

export function parseSheetToObjects(
  file: ArrayBuffer,
  sheetName: string
): Record<string, unknown>[] {
  const wb = XLSX.read(file, { type: "array" });
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error("Sayfa bulunamadı");
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false,
  });
}

function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

export function rowToTechnicalDraft(
  row: Record<string, unknown>,
  mapping: Record<string, TechnicalImportFieldKey>,
  defaults: { fabricTypeId: string; fabricTypeName: string; machineId: string; machineName: string },
  /** `singleWidth` kolonu için: açık mı tüp mü */
  singleWidthKind: "open" | "tube" = "open"
): {
  fabricRecipeCode?: string;
  pusFein?: number;
  needleCount?: number;
  tubeWidth?: number;
  openWidth?: number;
  weightGsm?: number;
  yarnLength?: number;
  machineType?: string;
  machineDiameter?: number;
  cottonRatio?: number;
  polyesterRatio?: number;
  lycraRatio?: number;
  viscoseRatio?: number;
  notes?: string;
} {
  const out: ReturnType<typeof rowToTechnicalDraft> = {};
  for (const [col, field] of Object.entries(mapping)) {
    if (field === "skip" || field === "fabricType") continue;
    const raw = row[col];
    switch (field) {
      case "fabricRecipeCode":
        if (raw != null && String(raw).trim() !== "") {
          out.fabricRecipeCode = String(raw).trim();
        }
        break;
      case "pusFein":
        out.pusFein = num(raw);
        break;
      case "needleCount":
        out.needleCount = num(raw);
        break;
      case "tubeWidth":
        out.tubeWidth = num(raw);
        break;
      case "openWidth":
        out.openWidth = num(raw);
        break;
      case "singleWidth": {
        const v = num(raw);
        if (v != null) {
          if (singleWidthKind === "open") out.openWidth = v;
          else out.tubeWidth = v;
        }
        break;
      }
      case "weightGsm":
        out.weightGsm = num(raw);
        break;
      case "yarnLength":
        out.yarnLength = num(raw);
        break;
      case "machineType":
        out.machineType = raw != null ? String(raw) : undefined;
        break;
      case "machineDiameter":
        out.machineDiameter = num(raw);
        break;
      case "cottonRatio":
        out.cottonRatio = num(raw);
        break;
      case "polyesterRatio":
        out.polyesterRatio = num(raw);
        break;
      case "lycraRatio":
        out.lycraRatio = num(raw);
        break;
      case "viscoseRatio":
        out.viscoseRatio = num(raw);
        break;
      case "notes":
        out.notes = raw != null ? String(raw) : undefined;
        break;
      default:
        break;
    }
  }
  return out;
}
