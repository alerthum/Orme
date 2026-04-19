import type { FabricRecipe } from "@/types";
import seedCatalog from "@/data/seed/catalog.json";

/** JSON’da tarihler ISO string; çalışma zamanında Date’e çevrilir */
type CatalogRecipeRow = Omit<FabricRecipe, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type CatalogFile = {
  version?: number;
  fabricRecipes?: CatalogRecipeRow[];
};

export function hydrateFabricRecipesFromCatalog(): FabricRecipe[] {
  const data = seedCatalog as unknown as CatalogFile;
  const rows = data.fabricRecipes ?? [];
  return rows.map((r) => ({
    ...r,
    createdAt: new Date(String(r.createdAt)),
    updatedAt: new Date(String(r.updatedAt)),
  }));
}
