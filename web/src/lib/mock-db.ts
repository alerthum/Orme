import type {
  AppSettings,
  FabricRecipe,
  FabricType,
  ImportJob,
  Machine,
  Order,
  TechnicalRecord,
  YarnType,
} from "@/types";
import { hydrateFabricRecipesFromCatalog } from "@/lib/seed/load-catalog";
import { hydrateExcelSeedTechnicalRecords } from "@/lib/seed/load-technical-seed";

const now = () => new Date();

function id(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(3, "0")}`;
}

export const demoFabricTypes: FabricType[] = [
  {
    id: id("ft", 1),
    code: "FL2",
    name: "Full Lycralı 2 İplik",
    category: "İki İplik",
    subCategory: "Fleece",
    description: "90D polyester + likra; mamül açık en tabloları",
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: id("ft", 2),
    code: "D2",
    name: "Düz 2 İplik",
    category: "İki İplik",
    subCategory: "Düz",
    description: "Ortalama tüp enleri — şardon notu",
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: id("ft", 3),
    code: "INT",
    name: "İnterlok 30/1",
    category: "İnterlok",
    description: "Demo interlok",
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: id("ft", 4),
    code: "KSK",
    name: "Kaşkorse",
    category: "Kaşkorse",
    subCategory: "2×1 / %5 Lyc",
    description: "KAŞKORSE.xlsx kaynak",
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: id("ft", 5),
    code: "LAC",
    name: "Lakost",
    category: "Lakost",
    description: "LACOSTLAR.xlsx kaynak",
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: id("ft", 6),
    code: "RIB",
    name: "Ribana",
    category: "Ribana",
    description: "RİBANA.xlsx kaynak",
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: id("ft", 7),
    code: "SUP",
    name: "Süprem",
    category: "Süprem",
    description: "SÜPREM.xlsx kaynak",
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: id("ft", 8),
    code: "U3P",
    name: "Üç iplik",
    category: "Üç iplik",
    description: "ÜÇİPLİKLER.xlsx kaynak",
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
];

/** Kumaş reçeteleri — `src/data/seed/catalog.json` (npm run seed:catalog) */
export function cloneSeedFabricRecipes(): FabricRecipe[] {
  return hydrateFabricRecipesFromCatalog().map((x) => ({ ...x }));
}

export const demoMachines: Machine[] = [
  {
    id: id("mc", 1),
    code: "MK-36-28",
    name: "Mayer 36\" 28 Fine",
    type: "Yuvarlak",
    diameter: 36,
    pusFeinMin: 24,
    pusFeinMax: 32,
    needleMin: 2400,
    needleMax: 3800,
    suitableFabricTypeIds: [demoFabricTypes[0]!.id, demoFabricTypes[1]!.id],
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: id("mc", 2),
    code: "MK-34-28",
    name: "Mayer 34\" 28 Fine",
    type: "Yuvarlak",
    diameter: 34,
    pusFeinMin: 24,
    pusFeinMax: 30,
    needleMin: 2200,
    needleMax: 3400,
    suitableFabricTypeIds: [demoFabricTypes[0]!.id, demoFabricTypes[1]!.id],
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: id("mc", 3),
    code: "MK-30-24",
    name: "Terrot 30\" 24 Fine",
    type: "Yuvarlak",
    diameter: 30,
    pusFeinMin: 20,
    pusFeinMax: 28,
    needleMin: 2000,
    needleMax: 2800,
    suitableFabricTypeIds: [
      demoFabricTypes[1]!.id,
      demoFabricTypes[2]!.id,
      demoFabricTypes[3]!.id,
      demoFabricTypes[4]!.id,
      demoFabricTypes[5]!.id,
      demoFabricTypes[6]!.id,
      demoFabricTypes[7]!.id,
    ],
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: id("mc", 4),
    code: "MK-26-32",
    name: "Compact 26\" 32 Fine",
    type: "Yuvarlak",
    diameter: 26,
    pusFeinMin: 26,
    pusFeinMax: 32,
    needleMin: 2500,
    needleMax: 3000,
    suitableFabricTypeIds: [demoFabricTypes[0]!.id],
    isActive: true,
    createdAt: now(),
    updatedAt: now(),
  },
];

/** Temsilî teknik kayıtlar — görsel tablolardan örneklenmiş */
export function buildDemoTechnicalRecords(): TechnicalRecord[] {
  const ftFl = demoFabricTypes[0]!;
  const ftD2 = demoFabricTypes[1]!;
  const seedRecipes = hydrateFabricRecipesFromCatalog();
  const rec2010 =
    seedRecipes.find((r) => r.code === "D2-20/10") ?? seedRecipes[0]!;
  const m36 = demoMachines[0]!;
  const m34 = demoMachines[1]!;
  const m30 = demoMachines[2]!;
  const m26 = demoMachines[3]!;

  const rows: TechnicalRecord[] = [];

  const add = (r: Omit<TechnicalRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
    rows.push({
      ...r,
      id: r.id ?? `tr-${rows.length + 1}`,
      createdAt: now(),
      updatedAt: now(),
    });
  };

  // Full Lycra — 36 puss 32 fein 3600 iğne, 60/60, 20D likra → açık en örnek 136
  add({
    fabricTypeId: ftFl.id,
    fabricTypeName: ftFl.name,
    machineId: m36.id,
    machineName: m36.name,
    machineType: m36.type,
    machineDiameter: 36,
    pusFein: 32,
    needleCount: 3600,
    yarnTypeSummary: "60/60",
    cottonRatio: 72,
    polyesterRatio: 22,
    lycraRatio: 6,
    openWidth: 136,
    tubeWidth: 68,
    weightGsm: 210,
    lycraKgPerKgFabric: 0.055,
    polyesterKgPerKgFabric: 0.2,
    mainYarnKgPerKgFabric: 0.72,
    confidenceScore: 0.92,
    isApproved: true,
    isActive: true,
    notes: "Full Lycra 2 iplik — 20D",
  });

  add({
    fabricTypeId: ftFl.id,
    fabricTypeName: ftFl.name,
    machineId: m36.id,
    machineName: m36.name,
    machineType: m36.type,
    machineDiameter: 36,
    pusFein: 28,
    needleCount: 3168,
    yarnTypeSummary: "32/32",
    cottonRatio: 78,
    polyesterRatio: 17,
    lycraRatio: 5,
    openWidth: 152,
    tubeWidth: 76,
    weightGsm: 185,
    lycraKgPerKgFabric: 0.048,
    polyesterKgPerKgFabric: 0.17,
    mainYarnKgPerKgFabric: 0.75,
    confidenceScore: 0.88,
    isApproved: true,
    isActive: true,
  });

  add({
    fabricTypeId: ftFl.id,
    fabricTypeName: ftFl.name,
    machineId: m34.id,
    machineName: m34.name,
    machineType: m34.type,
    machineDiameter: 34,
    pusFein: 28,
    needleCount: 2976,
    yarnTypeSummary: "40/40",
    cottonRatio: 75,
    polyesterRatio: 20,
    lycraRatio: 5,
    openWidth: 128,
    tubeWidth: 64,
    weightGsm: 195,
    lycraKgPerKgFabric: 0.05,
    polyesterKgPerKgFabric: 0.19,
    mainYarnKgPerKgFabric: 0.73,
    confidenceScore: 0.9,
    isApproved: true,
    isActive: true,
  });

  add({
    fabricTypeId: ftFl.id,
    fabricTypeName: ftFl.name,
    machineId: m26.id,
    machineName: m26.name,
    machineType: m26.type,
    machineDiameter: 26,
    pusFein: 32,
    needleCount: 2604,
    yarnTypeSummary: "30/30",
    cottonRatio: 80,
    polyesterRatio: 15,
    lycraRatio: 5,
    openWidth: 118,
    tubeWidth: 59,
    weightGsm: 205,
    lycraKgPerKgFabric: 0.052,
    polyesterKgPerKgFabric: 0.16,
    mainYarnKgPerKgFabric: 0.78,
    confidenceScore: 0.85,
    isApproved: true,
    isActive: true,
  });

  // Düz 2 iplik — tüp en örnekleri
  add({
    fabricTypeId: ftD2.id,
    fabricTypeName: ftD2.name,
    machineId: m36.id,
    machineName: m36.name,
    machineType: m36.type,
    machineDiameter: 36,
    pusFein: 30,
    needleCount: 3384,
    yarnTypeSummary: "60/60",
    cottonRatio: 100,
    openWidth: 130,
    tubeWidth: 65,
    weightGsm: 180,
    mainYarnKgPerKgFabric: 0.95,
    confidenceScore: 0.9,
    isApproved: true,
    isActive: true,
  });

  add({
    fabricTypeId: ftD2.id,
    fabricTypeName: ftD2.name,
    machineId: m36.id,
    machineName: m36.name,
    machineType: m36.type,
    machineDiameter: 36,
    pusFein: 30,
    needleCount: 3384,
    yarnTypeSummary: "32/32",
    cottonRatio: 100,
    openWidth: 244,
    tubeWidth: 122,
    weightGsm: 165,
    mainYarnKgPerKgFabric: 0.94,
    confidenceScore: 0.88,
    isApproved: true,
    isActive: true,
  });

  add({
    fabricTypeId: ftD2.id,
    fabricTypeName: ftD2.name,
    machineId: m34.id,
    machineName: m34.name,
    machineType: m34.type,
    machineDiameter: 34,
    pusFein: 28,
    needleCount: 2976,
    yarnTypeSummary: "40/40",
    cottonRatio: 100,
    openWidth: 160,
    tubeWidth: 80,
    weightGsm: 175,
    mainYarnKgPerKgFabric: 0.96,
    confidenceScore: 0.87,
    isApproved: true,
    isActive: true,
  });

  add({
    fabricTypeId: ftD2.id,
    fabricTypeName: ftD2.name,
    machineId: m30.id,
    machineName: m30.name,
    machineType: m30.type,
    machineDiameter: 30,
    pusFein: 24,
    needleCount: 2268,
    yarnTypeSummary: "34/34",
    cottonRatio: 100,
    openWidth: 122,
    tubeWidth: 61,
    weightGsm: 190,
    mainYarnKgPerKgFabric: 0.93,
    confidenceScore: 0.86,
    isApproved: true,
    isActive: true,
  });

  add({
    fabricTypeId: ftD2.id,
    fabricTypeName: ftD2.name,
    machineId: m30.id,
    machineName: m30.name,
    machineType: m30.type,
    machineDiameter: 30,
    pusFein: 24,
    needleCount: 2268,
    yarnTypeSummary: "20/8",
    cottonRatio: 100,
    openWidth: 216,
    tubeWidth: 108,
    weightGsm: 155,
    mainYarnKgPerKgFabric: 0.92,
    confidenceScore: 0.82,
    isApproved: true,
    isActive: true,
    notes: "Şardonlu siparişlerde arka iplik uzun alınmalı (iş kuralı)",
  });

  // D2-20/10 reçetesi — iki iplik tüketim katsayıları demo
  add({
    fabricRecipeId: rec2010.id,
    fabricTypeId: ftD2.id,
    fabricTypeName: ftD2.name,
    machineId: m36.id,
    machineName: m36.name,
    machineType: m36.type,
    machineDiameter: 36,
    pusFein: 28,
    needleCount: 3168,
    yarnTypeSummary: "20/10",
    yarnLength: 3.85,
    cottonRatio: 100,
    openWidth: 168,
    tubeWidth: 84,
    weightGsm: 185,
    frontYarnKgPerKgFabric: 0.58,
    backYarnKgPerKgFabric: 0.4,
    mainYarnKgPerKgFabric: 0.98,
    confidenceScore: 0.91,
    isApproved: true,
    isActive: true,
    notes: "20/10 düz iki iplik — Mayer 36\" demo satırı",
  });

  add({
    fabricRecipeId: rec2010.id,
    fabricTypeId: ftD2.id,
    fabricTypeName: ftD2.name,
    machineId: m34.id,
    machineName: m34.name,
    machineType: m34.type,
    machineDiameter: 34,
    pusFein: 28,
    needleCount: 2976,
    yarnTypeSummary: "20/10",
    yarnLength: 3.72,
    cottonRatio: 100,
    openWidth: 155,
    tubeWidth: 77.5,
    weightGsm: 178,
    frontYarnKgPerKgFabric: 0.57,
    backYarnKgPerKgFabric: 0.41,
    mainYarnKgPerKgFabric: 0.98,
    confidenceScore: 0.89,
    isApproved: true,
    isActive: true,
    notes: "20/10 — 34\" alternatif",
  });

  add({
    fabricRecipeId: rec2010.id,
    fabricTypeId: ftD2.id,
    fabricTypeName: ftD2.name,
    machineId: m30.id,
    machineName: m30.name,
    machineType: m30.type,
    machineDiameter: 30,
    pusFein: 24,
    needleCount: 2268,
    yarnTypeSummary: "20/10",
    yarnLength: 3.95,
    cottonRatio: 100,
    openWidth: 142,
    tubeWidth: 71,
    weightGsm: 192,
    frontYarnKgPerKgFabric: 0.59,
    backYarnKgPerKgFabric: 0.39,
    mainYarnKgPerKgFabric: 0.98,
    confidenceScore: 0.87,
    isApproved: true,
    isActive: true,
    notes: "20/10 — 30\" daha sıkı yapı",
  });

  // Gramaj grid benzeri — 28 fein 30/1
  add({
    fabricTypeId: ftFl.id,
    fabricTypeName: ftFl.name,
    machineId: m34.id,
    machineName: m34.name,
    machineType: m34.type,
    machineDiameter: 34,
    pusFein: 28,
    needleCount: 2976,
    yarnTypeSummary: "30/30 x 20D",
    yarnLength: 16,
    cottonRatio: 76,
    polyesterRatio: 19,
    lycraRatio: 5,
    openWidth: 180,
    tubeWidth: 90,
    weightGsm: 190,
    mainYarnKgPerKgFabric: 0.74,
    lycraKgPerKgFabric: 0.049,
    polyesterKgPerKgFabric: 0.18,
    confidenceScore: 0.84,
    isApproved: true,
    isActive: true,
    sourceFileName: "gramaj_tablo_demo.xlsx",
  });

  add({
    fabricTypeId: ftFl.id,
    fabricTypeName: ftFl.name,
    machineId: m34.id,
    machineName: m34.name,
    machineType: m34.type,
    machineDiameter: 34,
    pusFein: 28,
    needleCount: 2976,
    yarnTypeSummary: "30/30 x 20D",
    yarnLength: 18,
    cottonRatio: 76,
    polyesterRatio: 19,
    lycraRatio: 5,
    openWidth: 180,
    tubeWidth: 90,
    weightGsm: 205,
    mainYarnKgPerKgFabric: 0.73,
    lycraKgPerKgFabric: 0.05,
    polyesterKgPerKgFabric: 0.19,
    confidenceScore: 0.83,
    isApproved: true,
    isActive: true,
  });

  return rows;
}

export const demoYarnTypes: YarnType[] = [
  {
    id: "yt-1",
    name: "Ne 30/1 Penye",
    kind: "Pamuk",
    unit: "kg",
    isActive: true,
  },
  {
    id: "yt-2",
    name: "90D Polyester",
    kind: "Polyester",
    unit: "kg",
    isActive: true,
  },
  {
    id: "yt-3",
    name: "20D Likra",
    kind: "Likra",
    unit: "kg",
    isActive: true,
  },
];

export const demoSettings: AppSettings = {
  id: "app",
  defaultWastePercent: 5,
  scoringWeights: {
    fabricMatch: 0.3,
    gsmProximity: 0.2,
    openWidthProximity: 0.15,
    tubeWidthProximity: 0.1,
    compositionSimilarity: 0.15,
    machinePreference: 0.1,
  },
  importDuplicateSensitivity: 0.85,
  updatedAt: now(),
};

export const demoImportJobs: ImportJob[] = [
  {
    id: "ij-1",
    fileName: "full_lycra_acik_en.xlsx",
    status: "completed",
    sheetNames: ["Sayfa1", "Özet"],
    selectedSheet: "Sayfa1",
    columnMapping: {
      A: "pusFein",
      B: "needleCount",
    },
    stats: {
      rowsRead: 240,
      rowsImported: 232,
      rowsError: 8,
      duplicateCount: 3,
      autoMappedColumns: 5,
      userMappedColumns: 2,
      confidenceScore: 0.81,
    },
    createdAt: now(),
    createdBy: "demo@yokus.local",
  },
];

export const demoOrders: Order[] = [
  {
    id: "ord-1",
    orderTitle: "FW26 Ribana",
    customerName: "Demo Tekstil A.Ş.",
    orderCode: "SO-24001",
    form: {
      customerName: "Demo Tekstil A.Ş.",
      orderCode: "SO-24001",
      orderTitle: "FW26 Ribana",
      fabricTypeId: demoFabricTypes[0]!.id,
      targetGsm: 195,
      targetWidth: 140,
      widthKind: "open",
      quantity: 1500,
      quantityUnit: "kg",
      tolerancePercent: 3,
    },
    recommendedAlternatives: [],
    createdAt: now(),
    updatedAt: now(),
    createdBy: "demo@yokus.local",
  },
];

type Store = {
  fabricTypes: FabricType[];
  fabricRecipes: FabricRecipe[];
  machines: Machine[];
  technicalRecords: TechnicalRecord[];
  yarnTypes: YarnType[];
  settings: AppSettings;
  importJobs: ImportJob[];
  orders: Order[];
};

function cloneStore(): Store {
  return {
    fabricTypes: demoFabricTypes.map((x) => ({ ...x })),
    fabricRecipes: cloneSeedFabricRecipes(),
    machines: demoMachines.map((x) => ({ ...x })),
    technicalRecords: [
      ...hydrateExcelSeedTechnicalRecords().map((x) => ({ ...x })),
      ...buildDemoTechnicalRecords().map((x) => ({ ...x })),
    ],
    yarnTypes: demoYarnTypes.map((x) => ({ ...x })),
    settings: { ...demoSettings, scoringWeights: { ...demoSettings.scoringWeights } },
    importJobs: demoImportJobs.map((x) => ({
      ...x,
      columnMapping: { ...x.columnMapping },
      stats: x.stats ? { ...x.stats } : undefined,
    })),
    orders: demoOrders.map((x) => ({
      ...x,
      form: { ...x.form },
      recommendedAlternatives: x.recommendedAlternatives.map((a) => ({
        ...a,
        materials: a.materials.map((m) => ({ ...m })),
      })),
    })),
  };
}

let store: Store = cloneStore();

export function resetMockDb() {
  store = cloneStore();
}

export function getMockStore() {
  return store;
}
