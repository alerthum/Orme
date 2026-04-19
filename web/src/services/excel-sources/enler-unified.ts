import * as XLSX from "xlsx";

function yarnSummaryFromFabricLabel(label: string): string | undefined {
  const m = label.trim().match(/^(\d+\/\d+)/);
  return m ? m[1] : undefined;
}

export type EnlerGridDraft = {
  machineDiameterInch: number;
  fabricTypeFullName: string;
  yarnTypeSummary: string;
  needleCount: number;
  mayWidth: number;
  openWidthCm: number;
  pusFein: number;
  weightGsmEstimate?: number;
};

function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const s = String(v).replace(/[$€\s]/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

type Row = (string | number | null | undefined)[];

function nextMkCol(header: Row, fromCol: number): number {
  for (let c = fromCol + 1; c < header.length; c++) {
    if (header[c] === "Mk.") return c;
  }
  return header.length;
}

/** Blok: Mk | May | (N Dny)+ | M Fayn */
function parseTypeBBlock(header: Row, c: number, blockEnd: number) {
  let feinCol = -1;
  let pusFein = 28;
  for (let k = c + 2; k < blockEnd; k++) {
    const m = String(header[k] ?? "").match(/(\d+)\s*Fayn/i);
    if (m) {
      feinCol = k;
      pusFein = Number(m[1]);
    }
  }
  if (feinCol < 0) return null;
  const dnyLabels: number[] = [];
  for (let k = c + 2; k < feinCol; k++) {
    const m = String(header[k] ?? "").match(/(\d+)\s*Dny/i);
    if (m) dnyLabels.push(Number(m[1]));
  }
  if (dnyLabels.length === 0) return null;
  return { c, feinCol, pusFein, dnyLabels };
}

/**
 * ENLER sayfaları (İKİ İPLİK, İNTERLOK, KAŞKORSE, RİBANA, …).
 * Tip A: Mk | May | N Fayn/Fany → tek açık en.
 * Tip B: Mk | May | N Dny… | M Fayn → denye başına açık en.
 */
export function parseEnlerSheet(sheet: XLSX.WorkSheet): EnlerGridDraft[] {
  const rows = XLSX.utils.sheet_to_json<Row>(sheet, { header: 1, defval: null });

  const headerRowIdx = rows.findIndex(
    (row) => row[1] === "Mk." && row[2] === "May"
  );
  if (headerRowIdx < 0) return [];

  const header = rows[headerRowIdx]!;
  const typeABlocks: { col: number; pusFein: number }[] = [];
  const typeBBlocks: NonNullable<ReturnType<typeof parseTypeBBlock>>[] = [];

  for (let c = 1; c < header.length; c++) {
    if (header[c] !== "Mk." || header[c + 1] !== "May") continue;
    const lab = String(header[c + 2] ?? "");
    const blockEnd = nextMkCol(header, c);
    if (/(\d+)\s*Dny/i.test(lab)) {
      const b = parseTypeBBlock(header, c, blockEnd);
      if (b) typeBBlocks.push(b);
    } else if (/(\d+)\s*(Fayn|Fany)/i.test(lab)) {
      const fm = lab.match(/(\d+)\s*(Fayn|Fany)/i);
      if (fm) typeABlocks.push({ col: c, pusFein: Number(fm[1]) });
    }
  }

  const out: EnlerGridDraft[] = [];
  let machineDiameterInch = 36;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]!;
    const c0 = String(row[0] ?? "").trim();

    const pussM = c0.match(/^(\d+(?:[.,]\d+)?)\s*PUSS$/i);
    if (pussM) {
      machineDiameterInch = Number(String(pussM[1]).replace(",", "."));
      continue;
    }

    if (c0 === "KUMAŞ CİNSİ" || c0 === "Mk." || c0 === "") continue;
    if (row[1] === "İğne" || row[1] === "Sayısı") continue;

    const yarnBase = yarnSummaryFromFabricLabel(c0);
    if (!yarnBase) continue;

    for (const { col, pusFein } of typeABlocks) {
      const needle = num(row[col]);
      const may = num(row[col + 1]);
      const open = num(row[col + 2]);
      if (needle == null || may == null || open == null) continue;
      if (open <= 0) continue;

      out.push({
        machineDiameterInch,
        fabricTypeFullName: c0,
        yarnTypeSummary: yarnBase,
        needleCount: Math.round(needle),
        mayWidth: may,
        openWidthCm: Math.round(open * 10) / 10,
        pusFein,
      });
    }

    for (const b of typeBBlocks) {
      const needle = num(row[b.c]);
      if (needle == null) continue;
      const nD = b.dnyLabels.length;
      for (let j = 0; j < nD; j++) {
        const may = num(row[b.c + 1 + j]);
        const open = num(row[b.c + 1 + nD + j]);
        if (open == null || open <= 0) continue;
        const dny = b.dnyLabels[j]!;
        out.push({
          machineDiameterInch,
          fabricTypeFullName: c0,
          yarnTypeSummary: `${yarnBase} @${dny}Dny`,
          needleCount: Math.round(needle),
          mayWidth: may ?? 0,
          openWidthCm: Math.round(open * 10) / 10,
          pusFein: b.pusFein,
        });
      }
    }
  }

  return out;
}
