import * as XLSX from "xlsx";
import type { EnlerGridDraft } from "./enler-unified";

export type GramajMatrixDraft = {
  fein: number;
  denyeColumn: number;
  rowLabel: string;
  gsm: number;
};

type Row = (string | number | null | undefined)[];

function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v).replace(/[$€\s]/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function feinFromSheetName(name: string): number | undefined {
  const m = name.match(/(\d+)\s*FAYN/i);
  return m ? Number(m[1]) : undefined;
}

/**
 * İNTERLOK / KAŞKORSE / SÜPREM “FAYN | 100 | 80 | …” + satır “45 cm” ızgara gramajı.
 */
export function parseGramajMatrixSheet(
  sheet: XLSX.WorkSheet,
  sheetName = ""
): GramajMatrixDraft[] {
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { header: 1, defval: null });
  function isDenyeHeaderRow(row: Row | undefined): boolean {
    if (!row?.length) return false;
    const c0 = String(row[0] ?? "");
    if (/\d+\s*cm/i.test(c0)) return false;
    let n = 0;
    for (let c = 1; c < Math.min(row.length, 45); c++) {
      const v = num(row[c]);
      if (v != null && v >= 15 && v <= 200) n++;
    }
    return n >= 8;
  }

  let faynRow = -1;
  for (let r = 0; r < Math.min(rows.length, 60); r++) {
    const c0 = String(rows[r]?.[0] ?? "").trim();
    if (/^FAYN$/i.test(c0)) {
      faynRow = r;
      break;
    }
  }
  if (faynRow < 0) {
    for (let r = 1; r < Math.min(rows.length, 45); r++) {
      if (!isDenyeHeaderRow(rows[r])) continue;
      const prev = [rows[r - 1]?.[0], rows[r - 1]?.[1]].map((x) => String(x ?? "")).join(" ");
      if (/İPLİK|NUMARA|DENYE|FAYN|GRA|LAC|LAKOS/i.test(prev) || r <= 5) {
        faynRow = r;
        break;
      }
    }
  }
  if (faynRow < 0) return [];

  let fein = feinFromSheetName(sheetName) ?? 28;
  for (let r = 0; r < faynRow; r++) {
    const a = num(rows[r]?.[0]);
    const b = String(rows[r]?.[1] ?? "");
    if (a != null && a >= 10 && a <= 45 && /İPLİK|iplik|NUMARA/i.test(b)) {
      fein = Math.round(a);
      break;
    }
    const c0 = String(rows[r]?.[0] ?? "").trim();
    const m = c0.match(/^(\d{2})$/);
    if (m && num(rows[r]?.[2]) == null) {
      const n = Number(m[1]);
      if (n >= 15 && n <= 32) fein = n;
    }
  }

  const header = rows[faynRow]!;
  const denyeCols: { c: number; v: number }[] = [];
  for (let c = 1; c < header.length; c++) {
    const v = num(header[c]);
    if (v != null && v >= 15 && v <= 200) denyeCols.push({ c, v: Math.round(v) });
  }
  if (denyeCols.length === 0) return [];

  const out: GramajMatrixDraft[] = [];
  for (let r = faynRow + 1; r < rows.length; r++) {
    const row = rows[r]!;
    const label = String(row[0] ?? "").trim();
    if (!label || /^FAYN/i.test(label)) continue;
    if (!/\d/.test(label)) continue;

    for (const { c, v } of denyeCols) {
      const gsm = num(row[c]);
      if (gsm == null || gsm <= 0 || gsm > 650) continue;
      out.push({
        fein,
        denyeColumn: v,
        rowLabel: label,
        gsm: Math.round(gsm * 10) / 10,
      });
    }
  }
  return out;
}

/** ENLER + FAYN×denye gramaj ızgarası: fein + ilk Ne ile eşleşen hücrelerin medyan GSM */
export function enrichEnlerWithMatrix(
  enler: EnlerGridDraft[],
  matrices: GramajMatrixDraft[]
): EnlerGridDraft[] {
  return enler.map((d) => {
    const m = d.yarnTypeSummary.match(/(\d+)/);
    const neHint = m ? Number(m[1]) : undefined;
    const gsms = matrices
      .filter(
        (g) => g.fein === d.pusFein && (neHint == null || g.denyeColumn === neHint)
      )
      .map((g) => g.gsm);
    if (gsms.length === 0) return { ...d, weightGsmEstimate: d.weightGsmEstimate ?? 200 };
    const s = [...gsms].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    const med = s.length % 2 === 1 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
    return { ...d, weightGsmEstimate: Math.round(med * 10) / 10 };
  });
}
