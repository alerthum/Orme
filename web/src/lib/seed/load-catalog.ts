import type { FabricRecipe } from "@/types";
import seedCatalog from "@/data/seed/catalog.json";

type CatalogFile = {
  version?: number;
  fabricRecipes?: FabricRecipe[];
};

export function hydrateFabricRecipesFromCatalog(): FabricRecipe[] {
  const data = seedCatalog as CatalogFile;
  const rows = data.fabricRecipes ?? [];
  return rows.map((r) => ({
    ...r,
    createdAt: new Date(String(r.createdAt)),
    updatedAt: new Date(String(r.updatedAt)),
  }));
}
