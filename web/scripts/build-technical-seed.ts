import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { collectTechnicalRowsFromKaynakDir } from "../src/services/excel-sources/bulk-import-kaynak";
import {
  cloneSeedFabricRecipes,
  demoFabricTypes,
  demoMachines,
} from "../src/lib/mock-db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..", "..");
const kaynakDir = path.join(repoRoot, "data", "excel-kaynak");
const target = path.join(__dirname, "..", "src", "data", "seed", "technical-records.json");

const recipes = cloneSeedFabricRecipes();
const { rows, errors, byFile } = collectTechnicalRowsFromKaynakDir(kaynakDir, {
  fabricTypes: demoFabricTypes,
  recipes,
  machines: demoMachines,
});

const nowIso = new Date().toISOString();
const technicalRecords = rows.map((r, i) => ({
  ...r,
  id: `ts-${String(i + 1).padStart(6, "0")}`,
  isActive: r.isActive !== false,
  createdAt: nowIso,
  updatedAt: nowIso,
}));

const out = {
  version: 1,
  generatedAt: nowIso,
  sourceDir: "data/excel-kaynak",
  rowCount: technicalRecords.length,
  byFile,
  parseErrors: errors,
  technicalRecords,
};

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(out, null, 2), "utf8");

console.log("Yazıldı:", target);
console.log("Satır:", technicalRecords.length);
console.log("Dosya özeti:", JSON.stringify(byFile, null, 2));
if (errors.length) {
  console.warn("Parse uyarıları:", errors.length);
  errors.slice(0, 20).forEach((e) => console.warn(" —", e));
}
