/**
 * data/excel-kaynak — her xlsx için sheet listesi + küçük önizleme (ilk 8 satır, 20 sütun).
 * Çalıştır: node scripts/analyze-excel-kaynak.mjs > ../../data/excel-kaynak/_analiz-ozet.txt
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "data", "excel-kaynak");

function clip(s, n = 60) {
  if (s == null) return "";
  const t = String(s).replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

function previewGrid(sheet, maxR = 8, maxC = 20) {
  const ref = sheet["!ref"];
  const range = ref ? XLSX.utils.decode_range(ref) : null;
  if (!range) return { rows: [], note: "boş" };
  const rows = [];
  for (let r = range.s.r; r <= Math.min(range.e.r, range.s.r + maxR - 1); r++) {
    const line = [];
    for (let c = range.s.c; c <= Math.min(range.e.c, range.s.c + maxC - 1); c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      const v = cell?.w ?? cell?.v ?? null;
      line.push(clip(v, 28));
    }
    rows.push(line);
  }
  return { rows };
}

function analyzeFile(filePath) {
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
  const base = path.basename(filePath);
  const sheets = [];

  for (const sheetName of wb.SheetNames) {
    const sh = wb.Sheets[sheetName];
    if (!sh) continue;
    const ref = sh["!ref"];
    const range = ref ? XLSX.utils.decode_range(ref) : null;
    const rowCount = range ? range.e.r - range.s.r + 1 : 0;
    const colCount = range ? range.e.c - range.s.c + 1 : 0;
    const { rows } = previewGrid(sh);
    sheets.push({ name: sheetName, rowCount, colCount, ref: ref ?? "-", preview: rows });
  }

  return { file: base, sheets };
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.error("Klasör yok:", ROOT);
    process.exit(1);
  }
  const files = fs
    .readdirSync(ROOT)
    .filter((f) => /\.xlsx$/i.test(f) && !f.startsWith("~"))
    .sort((a, b) => a.localeCompare(b, "tr"));

  console.log("# Excel kaynak özeti\n");
  console.log(`Kök: \`${ROOT}\`\n`);
  console.log(`Dosya sayısı: ${files.length}\n`);

  for (const f of files) {
    const a = analyzeFile(path.join(ROOT, f));
    console.log(`\n## 📁 ${a.file}\n`);
    for (const s of a.sheets) {
      console.log(`### Sheet: «${s.name}»`);
      console.log(`- Boyut: **${s.rowCount}** satır × **${s.colCount}** sütun (${s.ref})`);
      console.log("- İlk hücreler (max 8×20):\n");
      console.log("```");
      for (const row of s.preview) {
        console.log(row.map((x) => (x === "" ? "·" : x)).join(" | "));
      }
      console.log("```\n");
    }
  }
}

main();
