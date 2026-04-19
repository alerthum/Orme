import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildFabricRecipesCatalog } from "../src/lib/seed/fabric-recipe-builder";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const recipes = buildFabricRecipesCatalog();
const fabricRecipes = recipes.map((r) => ({
  ...r,
  createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
}));
const out = {
  version: 1,
  generatedAt: new Date().toISOString(),
  fabricRecipes,
};
const target = path.join(__dirname, "..", "src", "data", "seed", "catalog.json");
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(out, null, 2), "utf8");
console.log("Yazıldı:", target, "—", fabricRecipes.length, "reçete");
