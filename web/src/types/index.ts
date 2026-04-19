import type { Timestamp } from "firebase/firestore";

export type UserRole = "admin" | "planning" | "sales" | "manager";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt?: Timestamp | Date;
}

export interface FabricType {
  id: string;
  code: string;
  name: string;
  category: string;
  subCategory?: string;
  description?: string;
  isActive: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/** Kumaş reçetesi / yapı varyantı (örn. D2-20/10 düz iki iplik) */
export interface FabricRecipe {
  id: string;
  code: string;
  name: string;
  fabricTypeId: string;
  structureCategory: string;
  /** Ön (yüz) veya dış iplik Ne */
  frontYarnNe: number;
  /** Arka / ikinci sistem Ne (tek iplik görünümünde 1 olabilir) */
  backYarnNe: number;
  /** Üç iplik: ara (göbek) Ne — `yarnConstructionLabel` örn. 40/70/10 */
  middleYarnNe?: number;
  /** Üç iplik: üçüncü Ne (genelde ince likra / bağlayıcı) */
  thirdYarnNe?: number;
  yarnStructure?: "2-ply" | "3-ply";
  /** Excel / gösterim: likralı, 150DN PES vb. */
  compositionHint?: string;
  /** `TechnicalRecord.yarnTypeSummary` ile eşleşen kısa etiket */
  yarnConstructionLabel: string;
  colorOrVariantNote?: string;
  isActive: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface Machine {
  id: string;
  code: string;
  name: string;
  type: string;
  diameter: number;
  pusFeinMin: number;
  pusFeinMax: number;
  needleMin: number;
  needleMax: number;
  suitableFabricTypeIds: string[];
  description?: string;
  isActive: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface MachineCapability {
  id: string;
  machineId: string;
  fabricTypeId: string;
  notes?: string;
  pusFeinMin?: number;
  pusFeinMax?: number;
  needleMin?: number;
  needleMax?: number;
}

export interface YarnType {
  id: string;
  name: string;
  kind: string;
  description?: string;
  unit: string;
  isActive: boolean;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface YarnComponentRatio {
  component: string;
  ratio: number;
}

export interface TechnicalRecord {
  id: string;
  /** Varsa sipariş motoru bu reçeteye göre kayıtları daraltır */
  fabricRecipeId?: string;
  fabricTypeId: string;
  fabricTypeName: string;
  machineId: string;
  machineName: string;
  machineType: string;
  machineDiameter: number;
  pusFein: number;
  needleCount: number;
  yarnTypeSummary?: string;
  yarnComponents?: YarnComponentRatio[];
  cottonRatio?: number;
  polyesterRatio?: number;
  lycraRatio?: number;
  viscoseRatio?: number;
  otherRatio?: number;
  tubeWidth?: number;
  openWidth?: number;
  weightGsm: number;
  yarnLength?: number;
  gramajTolerance?: number;
  widthTolerance?: number;
  sourceFileName?: string;
  sourceSheetName?: string;
  sourceRowNumber?: number;
  sourceVersion?: string;
  confidenceScore?: number;
  isApproved: boolean;
  isActive: boolean;
  rawImportReference?: string;
  notes?: string;
  /** kg ana iplik / kg mamül — demo tahmin katsayısı */
  mainYarnKgPerKgFabric?: number;
  /** İki iplik yapıda ön iplik kg / kg mamül (demo) */
  frontYarnKgPerKgFabric?: number;
  /** İki iplik yapıda arka iplik kg / kg mamül (demo) */
  backYarnKgPerKgFabric?: number;
  /** Üç iplik: ara iplik kg / kg mamül (demo) */
  middleYarnKgPerKgFabric?: number;
  lycraKgPerKgFabric?: number;
  polyesterKgPerKgFabric?: number;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export type ImportJobStatus =
  | "uploaded"
  | "parsing"
  | "mapping"
  | "ready"
  | "importing"
  | "completed"
  | "failed";

export interface ImportJobStats {
  rowsRead: number;
  rowsImported: number;
  rowsError: number;
  duplicateCount: number;
  autoMappedColumns: number;
  userMappedColumns: number;
  confidenceScore: number;
}

export interface ImportJob {
  id: string;
  fileName: string;
  storagePath?: string;
  status: ImportJobStatus;
  sheetNames: string[];
  selectedSheet?: string;
  columnMapping: Record<string, string>;
  stats?: ImportJobStats;
  createdAt: Timestamp | Date;
  createdBy?: string;
  errorMessage?: string;
}

export interface ScoringWeights {
  fabricMatch: number;
  gsmProximity: number;
  openWidthProximity: number;
  tubeWidthProximity: number;
  compositionSimilarity: number;
  machinePreference: number;
}

export interface AppSettings {
  id: "app";
  defaultWastePercent: number;
  scoringWeights: ScoringWeights;
  importDuplicateSensitivity: number;
  updatedAt?: Timestamp | Date;
}

export type OrderQuantityUnit = "kg" | "ton" | "m";

/** Siparişte girilen tek en değerinin yorumu */
export type OrderWidthKind = "open" | "tube";

export interface OrderFormSnapshot {
  customerName: string;
  orderCode: string;
  orderTitle: string;
  /** Seçildiyse teknik kayıtlar bu reçeteye göre filtrelenir */
  fabricRecipeId?: string;
  fabricRecipeCode?: string;
  fabricTypeId: string;
  targetGsm: number;
  /** Tek mamül eni (cm); anlamı `widthKind` ile belirlenir */
  targetWidth: number;
  widthKind: OrderWidthKind;
  fabricContentNote?: string;
  cottonRatio?: number;
  polyesterRatio?: number;
  lycraRatio?: number;
  viscoseRatio?: number;
  otherRatio?: number;
  quantity: number;
  quantityUnit: OrderQuantityUnit;
  tolerancePercent: number;
  preferredMachineType?: string;
  preferredDiameter?: number;
  preferredPusFein?: number;
  wastePercentOverride?: number;
}

export type ConfidenceLevel = "high" | "medium" | "low";

export interface MaterialEstimate {
  component: string;
  netKg: number;
  withWasteKg: number;
}

export interface CalculationAlternative {
  technicalRecordId: string;
  machineId: string;
  machineName: string;
  machineType: string;
  diameter: number;
  pusFein: number;
  needleCount: number;
  estimatedOpenWidth: number;
  estimatedTubeWidth: number;
  estimatedGsm: number;
  matchScore: number;
  confidence: ConfidenceLevel;
  isRecommended: boolean;
  advantageNote?: string;
  materials: MaterialEstimate[];
  /** Teknik kayıttan — demo: m iplik / kg mamül (kalibrasyon üretimde yapılır) */
  yarnLengthMPerKg?: number;
  yarnTypeSummary?: string;
  /** Teknik kayıttaki bileşen özeti (kullanıcı girdisi değil) */
  dataDrivenCompositionNote?: string;
}

export interface CalculationResultPayload {
  alternatives: CalculationAlternative[];
  weightsUsed: ScoringWeights;
  generatedAt: string;
}

export interface Order {
  id: string;
  orderTitle: string;
  customerName: string;
  orderCode: string;
  form: OrderFormSnapshot;
  recommendedAlternatives: CalculationAlternative[];
  selectedAlternativeId?: string;
  userNote?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  createdBy?: string;
}

export type TechnicalImportFieldKey =
  | "fabricType"
  /** Excel’de reçete kodu (örn. D2-20/10); içe aktarmada id’ye çözülür */
  | "fabricRecipeCode"
  | "pusFein"
  | "needleCount"
  | "tubeWidth"
  | "openWidth"
  | "weightGsm"
  | "yarnLength"
  | "machineType"
  | "machineDiameter"
  | "cottonRatio"
  | "polyesterRatio"
  | "lycraRatio"
  | "viscoseRatio"
  | "notes"
  /** Excel’de tek “en” kolonu; import ekranında açık/tüp seçimi ile yazılır */
  | "singleWidth"
  | "skip";
