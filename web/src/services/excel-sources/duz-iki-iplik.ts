import * as XLSX from "xlsx";
import type { FabricRecipe, Machine } from "@/types";
import type { EnlerGridDraft } from "./enler-unified";
import { parseEnlerSheet } from "./enler-unified";

const BOOK = "İKİ İPLİK.xlsx";
const SHEET_ENLER = "DÜZ İKİ İPLİK ENLERİ";
const SHEET_GRAMAJ = "DÜZ İKİ İPLİK GRAMAJ";

export type DuzIkiIplikEnlerDraft = EnlerGridDraft;

export type DuzIkiIplikGramajDraft = {
  fein: number;
  outerNe: number;
  innerNe: number;
  outerCm: number;
  innerCm: number;
  gsm: number;
};

function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function parseCmLabel(v: unknown): number | undefined {
  if (v == null) return undefined;
  const s = String(v).replace(",", ".").trim();
  const m = s.match(/^([\d.]+)\s*cm/i);
  if (m) return Number(m[1]);
  return num(v);
}

/** "60/60 DÜZ 2İPLİK" → 60/60 */
export function yarnSummaryFromFabricLabel(label: string): string | undefined {
  const m = label.trim().match(/^(\d+\/\d+)/);
  return m ? m[1] : undefined;
}

function trUp(s: string) {
  return s.toLocaleUpperCase("tr-TR");
}

function sheetMatchesDuzEnler(name: string): boolean {
  const u = trUp(name);
  return u.includes("DÜZ") && u.includes("İPLİK") && u.includes("ENLER");
}

function sheetMatchesDuzGramaj(name: string): boolean {
  const u = trUp(name);
  return u.includes("DÜZ") && u.includes("İPLİK") && u.includes("GRAMAJ");
}

export function isDuzIkiIplikWorkbook(sheetNames: string[]): boolean {
  const s = new Set(sheetNames);
  if (s.has(SHEET_ENLER) && s.has(SHEET_GRAMAJ)) return true;
  const hasEn = sheetNames.some(sheetMatchesDuzEnler);
  const hasGr = sheetNames.some(sheetMatchesDuzGramaj);
  return hasEn && hasGr;
}

function pickSheet(
  wb: XLSX.WorkBook,
  exact: string,
  fuzzy: (name: string) => boolean
): XLSX.WorkSheet | undefined {
  const byExact = wb.Sheets[exact];
  if (byExact) return byExact;
  const alt = wb.SheetNames.find(fuzzy);
  return alt ? wb.Sheets[alt] : undefined;
}

/** GRAMAJ tablosundan aynı fein + ön/arka Ne için medyan GSM */
export function enrichEnlerDraftsWithGramajMedian(
  enler: EnlerGridDraft[],
  gramaj: DuzIkiIplikGramajDraft[]
): EnlerGridDraft[] {
  return enler.map((d) => {
    const m = d.yarnTypeSummary.match(/^(\d+)\/(\d+)/);
    if (!m) return { ...d, weightGsmEstimate: 200 };
    const outerNe = Number(m[1]);
    const innerNe = Number(m[2]);
    const gsms = gramaj
      .filter(
        (g) =>
          g.fein === d.pusFein &&
          g.outerNe === outerNe &&
          g.innerNe === innerNe
      )
      .map((g) => g.gsm);
    if (gsms.length === 0) return { ...d, weightGsmEstimate: 200 };
    const sorted = [...gsms].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const med =
      sorted.length % 2 === 1
        ? sorted[mid]!
        : (sorted[mid - 1]! + sorted[mid]!) / 2;
    return {
      ...d,
      weightGsmEstimate: Math.round(med * 10) / 10,
    };
  });
}

export function pickMachineForDuzIkiIplik(
  machines: Machine[],
  diameterInch: number,
  pusFein: number,
  needle: number
): Pick<Machine, "id" | "name" | "type"> {
  const active = machines.filter((m) => m.isActive);
  const byDiam = active.filter((m) => Math.abs(m.diameter - diameterInch) < 0.01);
  const pool = byDiam.length ? byDiam : active;
  const scored = pool.map((m) => {
    let s = 0;
    if (pusFein >= m.pusFeinMin && pusFein <= m.pusFeinMax) s += 4;
    if (needle >= m.needleMin && needle <= m.needleMax) s += 2;
    s -= Math.abs(m.diameter - diameterInch) * 0.05;
    return { m, s };
  });
  scored.sort((a, b) => b.s - a.s);
  const m = scored[0]!.m;
  return { id: m.id, name: m.name, type: m.type };
}

/** Excel satırındaki "60/60 @20Dny" gibi ekleri kaldırıp reçete etiketiyle eşler */
function normalizeYarnConstructionToken(s: string): string {
  return s
    .replace(/\s*@\s*\d+\s*Dny\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function resolveRecipeId(
  yarnSummary: string | undefined,
  recipes: FabricRecipe[]
): string | undefined {
  if (!yarnSummary) return undefined;
  const needle = normalizeYarnConstructionToken(yarnSummary);
  const r = recipes.find(
    (x) => normalizeYarnConstructionToken(x.yarnConstructionLabel) === needle
  );
  return r?.id;
}

/** @deprecated doğrudan `parseEnlerSheet` kullanın */
export function parseDuzIkiIplikEnler(sheet: XLSX.WorkSheet): DuzIkiIplikEnlerDraft[] {
  return parseEnlerSheet(sheet);
}

/**
 * GRAMAJ: "X faynda" bölümleri; her blokta 9 iç iplik Ne sütunu.
 */
export function parseDuzIkiIplikGramaj(sheet: XLSX.WorkSheet): DuzIkiIplikGramajDraft[] {
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: null,
  });

  const out: DuzIkiIplikGramajDraft[] = [];

  for (let hr = 0; hr < rows.length; hr++) {
    const cell = rows[hr]?.[2];
    const fm = String(cell ?? "").match(/^(\d+)\s*fayn?da/i);
    if (!fm) continue;

    const fein = Number(fm[1]);
    const innerHeaderRow = hr + 3;
    const innerRow = rows[innerHeaderRow];
    if (!innerRow || String(innerRow[0] ?? "").trim() !== "Dış ip.") continue;

    let dataEnd = rows.length;
    for (let k = hr + 4; k < rows.length; k++) {
      const c2 = rows[k]?.[2];
      if (String(c2 ?? "").match(/^\d+\s*fayn?da/i)) {
        dataEnd = k;
        break;
      }
    }

    const yarnRow = rows[hr + 1] ?? [];
    const blockAnchors: number[] = [];
    for (let c = 2; c < yarnRow.length; c++) {
      const y = String(yarnRow[c] ?? "");
      if (/\d+\/\d+/.test(y)) blockAnchors.push(c);
    }

    for (const ac of blockAnchors) {
      const outerM = String(yarnRow[ac] ?? "").match(/^(\d+)\/(\d+)/);
      if (!outerM) continue;
      const outerNe = Number(outerM[1]);

      const innerNs: number[] = [];
      for (let k = 0; k < 9; k++) {
        const v = num(innerRow[ac + k]);
        if (v != null) innerNs.push(Math.round(v));
      }
      if (innerNs.length === 0) continue;

      for (let dr = innerHeaderRow + 1; dr < dataEnd; dr++) {
        const dRow = rows[dr];
        if (!dRow) continue;
        const outerCm = parseCmLabel(dRow[0]);
        const innerCm = parseCmLabel(dRow[1]);
        if (outerCm == null || innerCm == null) continue;

        innerNs.forEach((innerNe, idx) => {
          const gsm = num(dRow[ac + idx]);
          if (gsm == null || gsm <= 0) return;
          out.push({
            fein,
            outerNe,
            innerNe,
            outerCm,
            innerCm,
            gsm: Math.round(gsm * 10) / 10,
          });
        });
      }
    }
  }

  return out;
}

function isNodeBuffer(x: unknown): x is Buffer {
  return typeof Buffer !== "undefined" && Buffer.isBuffer(x);
}

export function parseIkiIplikWorkbook(buf: ArrayBuffer | Buffer): {
  workbook: string;
  enler: DuzIkiIplikEnlerDraft[];
  gramaj: DuzIkiIplikGramajDraft[];
} {
  const wb = isNodeBuffer(buf)
    ? XLSX.read(buf, { type: "buffer", raw: false })
    : XLSX.read(buf, { type: "array", raw: false });
  const shEn = pickSheet(wb, SHEET_ENLER, sheetMatchesDuzEnler);
  const shGr = pickSheet(wb, SHEET_GRAMAJ, sheetMatchesDuzGramaj);
  if (!shEn || !shGr) {
    throw new Error(`Sayfalar bulunamadı: ${SHEET_ENLER}, ${SHEET_GRAMAJ}`);
  }
  return {
    workbook: BOOK,
    enler: parseDuzIkiIplikEnler(shEn),
    gramaj: parseDuzIkiIplikGramaj(shGr),
  };
}

export function enlerDraftsToTechnicalArgs(
  drafts: EnlerGridDraft[],
  ctx: {
    fabricTypeId: string;
    fabricTypeName: string;
    recipes: FabricRecipe[];
    /** Yükleilen dosya adı (tekrar içe aktarmada silmek için) */
    sourceWorkbookName?: string;
    /** Kaynak sayfa (örn. birden fazla ENLER sayfası) */
    sourceSheetName?: string;
    pickMachine: (diameter: number, pusFein: number, needle: number) => {
      id: string;
      name: string;
      type: string;
    };
  }
) {
  const book = ctx.sourceWorkbookName ?? BOOK;
  const sh = ctx.sourceSheetName ?? SHEET_ENLER;
  return drafts.map((d, i) => {
    const mach = ctx.pickMachine(d.machineDiameterInch, d.pusFein, d.needleCount);
    const recipeId = resolveRecipeId(d.yarnTypeSummary, ctx.recipes);
    const tube = Math.round((d.openWidthCm / 2) * 10) / 10;

    return {
      fabricRecipeId: recipeId,
      fabricTypeId: ctx.fabricTypeId,
      fabricTypeName: ctx.fabricTypeName,
      machineId: mach.id,
      machineName: mach.name,
      machineType: mach.type,
      machineDiameter: d.machineDiameterInch,
      pusFein: d.pusFein,
      needleCount: d.needleCount,
      yarnTypeSummary: d.yarnTypeSummary,
      openWidth: d.openWidthCm,
      tubeWidth: tube,
      weightGsm: d.weightGsmEstimate ?? 200,
      isApproved: true,
      isActive: true,
      sourceFileName: book,
      sourceSheetName: sh,
      sourceRowNumber: i + 1,
      confidenceScore: 0.95,
      notes: `Excel ${sh} — ${d.fabricTypeFullName}; may ${d.mayWidth}. GSM gramaj tablolarıyla fein+Ne eşlemesinden.`,
    };
  });
}

export { BOOK, SHEET_ENLER, SHEET_GRAMAJ };
