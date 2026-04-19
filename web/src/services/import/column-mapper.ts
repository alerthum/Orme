import type { TechnicalImportFieldKey } from "@/types";

const ALIASES: Record<string, TechnicalImportFieldKey> = {
  kumas: "fabricType",
  "kumaş": "fabricType",
  "kumaş türü": "fabricType",
  fabric: "fabricType",
  recete: "fabricRecipeCode",
  reçete: "fabricRecipeCode",
  "reçete kodu": "fabricRecipeCode",
  "recete kodu": "fabricRecipeCode",
  "recipe code": "fabricRecipeCode",
  "fabric recipe": "fabricRecipeCode",
  pus: "pusFein",
  fein: "pusFein",
  "pus/fein": "pusFein",
  "pus fein": "pusFein",
  i̇ğne: "needleCount",
  igne: "needleCount",
  "iğne": "needleCount",
  "iğne sayısı": "needleCount",
  needle: "needleCount",
  "tüp en": "tubeWidth",
  "tup en": "tubeWidth",
  "açık en": "openWidth",
  "acik en": "openWidth",
  /** Tek “en” kolonu — önce uzun eşleşmeler (açık/tüp en) denenir */
  en: "singleWidth",
  gramaj: "weightGsm",
  gsm: "weightGsm",
  "gr/m2": "weightGsm",
  "iplik uzunluğu": "yarnLength",
  "iplik uzunlugu": "yarnLength",
  "yarn length": "yarnLength",
  "makina tipi": "machineType",
  "makina çapı": "machineDiameter",
  "makina capi": "machineDiameter",
  pamuk: "cottonRatio",
  polyester: "polyesterRatio",
  likra: "lycraRatio",
  viskon: "viscoseRatio",
  not: "notes",
  notes: "notes",
};

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function suggestColumnMapping(
  headers: string[]
): Record<string, TechnicalImportFieldKey | undefined> {
  const out: Record<string, TechnicalImportFieldKey | undefined> = {};
  for (const h of headers) {
    const key = normalizeHeader(h);
    let best: TechnicalImportFieldKey | undefined;
    const sorted = Object.entries(ALIASES).sort(
      (a, b) => normalizeHeader(b[0]).length - normalizeHeader(a[0]).length
    );
    for (const [alias, field] of sorted) {
      const ak = normalizeHeader(alias);
      if (key === ak || key.includes(ak) || ak.includes(key)) {
        best = field;
        break;
      }
    }
    out[h] = best;
  }
  return out;
}

export function mappingConfidence(
  mapping: Record<string, TechnicalImportFieldKey | undefined>
): number {
  const vals = Object.values(mapping).filter(Boolean);
  if (!vals.length) return 0;
  const uniq = new Set(vals);
  return Math.min(1, 0.35 + uniq.size * 0.1 + vals.length * 0.04);
}
