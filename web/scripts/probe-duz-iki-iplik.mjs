import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(__dirname, "..", "..", "data", "excel-kaynak", "İKİ İPLİK.xlsx");
const buf = fs.readFileSync(file);
const wb = XLSX.read(buf, { type: "buffer", raw: false });

for (const name of ["DÜZ İKİ İPLİK GRAMAJ", "DÜZ İKİ İPLİK ENLERİ"]) {
  const sh = wb.Sheets[name];
  if (!sh) {
    console.log("MISSING", name);
    continue;
  }
  const ref = sh["!ref"];
  console.log("\n===", name, ref, "===");
  const range = XLSX.utils.decode_range(ref);
  const maxR = Math.min(range.e.r, range.s.r + 25);
  const maxC = Math.min(range.e.c, range.s.c + 35);
  for (let r = range.s.r; r <= maxR; r++) {
    const row = [];
    for (let c = range.s.c; c <= maxC; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sh[addr];
      const v = cell?.w ?? cell?.v;
      row.push(v == null ? "" : String(v).slice(0, 22));
    }
    console.log(String(r + 1).padStart(3), row.join(" | "));
  }
}
