import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";
import type { FabricRecipe, FabricType, Machine } from "@/types";
import { replaceTechnicalRecordsFromSource } from "@/repositories/technical-records";
import {
  enrichEnlerDraftsWithGramajMedian,
  enlerDraftsToTechnicalArgs,
  parseDuzIkiIplikGramaj,
  pickMachineForDuzIkiIplik,
} from "./duz-iki-iplik";
import { enrichEnlerWithMatrix, parseGramajMatrixSheet } from "./gramaj-matrix";
import { parseEnlerSheet } from "./enler-unified";
import { parseOranlariSheet } from "./oranlari-sheet";
import { parseUcIplikSheet } from "./uc-iplik-sheet";

export type BulkKaynakResult = {
  totalRecords: number;
  byFile: { file: string; sheets: { sheet: string; count: number }[] }[];
  errors: string[];
};

type SheetRole = "enler" | "gramaj" | "oran" | "uc_iplik" | "skip";

function classifySheet(sheetName: string): SheetRole {
  const n = sheetName.normalize("NFC");
  const u = n.toLocaleUpperCase("tr-TR");
  if (/İP\.?\s*UZN|IP\.?\s*UZN/i.test(n)) return "skip";
  if (u.includes("ÜÇ") && (u.includes("PLK") || u.includes("İPLİK"))) return "uc_iplik";
  if (/ORANLARI/i.test(u) || /ORTL.*ORA/i.test(u)) return "oran";
  if (/ENLER|ENLERİ/i.test(n) || /\bEN\s*$/i.test(n.trim())) return "enler";
  if (u.includes("GRAM") || u.includes("GRMAJ")) return "gramaj";
  return "skip";
}

function fabricForSheet(
  workbookBase: string,
  sheetName: string,
  types: FabricType[]
): FabricType {
  const wb = workbookBase.normalize("NFC").toLocaleUpperCase("tr-TR");
  const sh = sheetName.toLocaleUpperCase("tr-TR");
  const by = (code: string) => types.find((t) => t.code === code) ?? types[0]!;

  if ((wb.includes("İKİ") || wb.includes("IKI")) && wb.includes("PLK")) {
    if (sh.includes("ÜÇ")) return by("U3P");
    if (sh.includes("FULL") && sh.includes("LYC")) return by("FL2");
    return by("D2");
  }
  if (wb.includes("NTERLOK") || wb.includes("İNTERLOK")) return by("INT");
  if (wb.includes("KAŞ") || wb.includes("KASKORSE")) return by("KSK");
  if (wb.includes("LACOST") || wb.includes("LAKOS")) return by("LAC");
  if (wb.includes("RİB") || wb.includes("RIB")) return by("RIB");
  if (wb.includes("SÜP") || wb.includes("SUPREM")) return by("SUP");
  if (wb.includes("ÜÇ") || wb.includes("UCIPLIK") || wb.includes("UÇ")) return by("U3P");

  return by("D2");
}

function isIkiIplikWorkbook(base: string): boolean {
  const b = base.normalize("NFC").toLocaleUpperCase("tr-TR");
  return (b.includes("İKİ") || b.includes("IKI")) && b.includes("PLK");
}

function defaultMachineBase(machines: Machine[], fabric: FabricType) {
  const m =
    machines.find((x) => x.isActive && x.suitableFabricTypeIds.includes(fabric.id)) ??
    machines.find((x) => x.isActive) ??
    machines[0]!;
  return {
    machineId: m.id,
    machineName: m.name,
    machineType: m.type,
    machineDiameter: m.diameter,
    pusFein: Math.round((m.pusFeinMin + m.pusFeinMax) / 2),
    needleCount: Math.round((m.needleMin + m.needleMax) / 2),
  };
}

/**
 * `data/excel-kaynak` içindeki tüm .xlsx dosyalarını okuyup teknik kayıtları yazar.
 * Aynı dosya+sayfa kaynağı tekrar çalıştırılırsa önce silinir (`replaceTechnicalRecordsFromSource`).
 */
export async function bulkImportExcelKaynakDir(
  dirAbsolute: string,
  ctx: {
    fabricTypes: FabricType[];
    recipes: FabricRecipe[];
    machines: Machine[];
  }
): Promise<BulkKaynakResult> {
  const errors: string[] = [];
  const byFile: BulkKaynakResult["byFile"] = [];
  let totalRecords = 0;

  if (!fs.existsSync(dirAbsolute)) {
    errors.push(`Klasör yok: ${dirAbsolute}`);
    return { totalRecords: 0, byFile: [], errors };
  }

  const files = fs
    .readdirSync(dirAbsolute)
    .filter((f) => /\.xlsx$/i.test(f) && !f.startsWith("~"))
    .sort((a, b) => a.localeCompare(b, "tr"));

  for (const file of files) {
    const abs = path.join(dirAbsolute, file);
    const fileSheets: { sheet: string; count: number }[] = [];
    let buf: Buffer;
    try {
      buf = fs.readFileSync(abs);
    } catch (e) {
      errors.push(`${file}: okunamadı — ${e}`);
      continue;
    }

    const wb = XLSX.read(buf, { type: "buffer", raw: false });
    const matrices: import("./gramaj-matrix").GramajMatrixDraft[] = [];
    let duzGramajPool: import("./duz-iki-iplik").DuzIkiIplikGramajDraft[] = [];

    for (const sheetName of wb.SheetNames) {
      const sh = wb.Sheets[sheetName];
      if (!sh) continue;
      const role = classifySheet(sheetName);
      if (role !== "gramaj") continue;

      const duz = parseDuzIkiIplikGramaj(sh);
      if (duz.length > 0) duzGramajPool = duzGramajPool.concat(duz);

      const mat = parseGramajMatrixSheet(sh, sheetName);
      matrices.push(...mat);
    }

    for (const sheetName of wb.SheetNames) {
      const sh = wb.Sheets[sheetName];
      if (!sh) continue;
      const role = classifySheet(sheetName);
      const fabric = fabricForSheet(file, sheetName, ctx.fabricTypes);

      try {
        if (role === "enler") {
          const enlerRaw = parseEnlerSheet(sh);
          if (enlerRaw.length === 0) continue;

          let enriched = enlerRaw;
          const iki = isIkiIplikWorkbook(file);
          const isDuzEn =
            /DÜZ\s*İKİ\s*İPLİK/i.test(sheetName.normalize("NFC")) ||
            /DÜZ\s*IKI\s*IPLIK/i.test(sheetName.toUpperCase());

          if (iki && isDuzEn && duzGramajPool.length > 0) {
            enriched = enrichEnlerDraftsWithGramajMedian(enlerRaw, duzGramajPool);
          } else if (matrices.length > 0) {
            enriched = enrichEnlerWithMatrix(enlerRaw, matrices);
          }

          const rows = enlerDraftsToTechnicalArgs(enriched, {
            fabricTypeId: fabric.id,
            fabricTypeName: fabric.name,
            recipes: ctx.recipes,
            sourceWorkbookName: file,
            sourceSheetName: sheetName,
            pickMachine: (d, pus, needle) =>
              pickMachineForDuzIkiIplik(ctx.machines, d, pus, needle),
          });
          if (rows.length === 0) continue;
          const n = await replaceTechnicalRecordsFromSource(file, sheetName, rows);
          totalRecords += n;
          fileSheets.push({ sheet: sheetName, count: n });
        } else if (role === "oran") {
          const base = defaultMachineBase(ctx.machines, fabric);
          const rows = parseOranlariSheet(
            sh,
            {
              ...base,
              fabricTypeId: fabric.id,
              fabricTypeName: fabric.name,
              sourceFileName: file,
              sourceSheetName: sheetName,
            },
            file
          );
          if (rows.length === 0) continue;
          const n = await replaceTechnicalRecordsFromSource(file, sheetName, rows);
          totalRecords += n;
          fileSheets.push({ sheet: sheetName, count: n });
        } else if (role === "uc_iplik") {
          const base = defaultMachineBase(ctx.machines, fabric);
          const rows = parseUcIplikSheet(sh, {
            ...base,
            fabricTypeId: fabric.id,
            fabricTypeName: fabric.name,
            sourceFileName: file,
            sourceSheetName: sheetName,
          });
          if (rows.length === 0) continue;
          const n = await replaceTechnicalRecordsFromSource(file, sheetName, rows);
          totalRecords += n;
          fileSheets.push({ sheet: sheetName, count: n });
        }
      } catch (e) {
        errors.push(`${file} / ${sheetName}: ${e instanceof Error ? e.message : e}`);
      }
    }

    if (fileSheets.length > 0) byFile.push({ file, sheets: fileSheets });
  }

  return { totalRecords, byFile, errors };
}

export function defaultKaynakDirFromWebRoot(webRoot: string): string {
  return path.resolve(webRoot, "..", "data", "excel-kaynak");
}
