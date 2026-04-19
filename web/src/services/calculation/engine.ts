import type {
  AppSettings,
  CalculationAlternative,
  ConfidenceLevel,
  FabricRecipe,
  MaterialEstimate,
  OrderFormSnapshot,
  TechnicalRecord,
} from "@/types";
import { orderWidthContext } from "@/lib/order-width";

export interface CalculateParams {
  input: OrderFormSnapshot;
  records: TechnicalRecord[];
  settings: AppSettings;
  /** Siparişte seçilen reçete — iki iplik etiketleri ve dar filtre sonrası bağlam */
  activeRecipe?: FabricRecipe;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function distanceScore(
  target: number | undefined,
  value: number | undefined,
  tolerance: number
): number {
  if (target == null || value == null) return 0.5;
  const d = Math.abs(value - target) / Math.max(target, 1);
  const tol = tolerance / 100;
  if (d <= tol) return 1;
  return clamp01(1 - (d - tol) / (0.15 + tol));
}

function hasInputComposition(input: OrderFormSnapshot): boolean {
  return [
    input.cottonRatio,
    input.polyesterRatio,
    input.lycraRatio,
    input.viscoseRatio,
  ].some((x) => x != null && !Number.isNaN(x));
}

function compositionScore(
  input: OrderFormSnapshot,
  rec: TechnicalRecord
): number {
  if (!hasInputComposition(input)) {
    return 1;
  }
  const pairs: [number | undefined, number | undefined][] = [
    [input.cottonRatio, rec.cottonRatio],
    [input.polyesterRatio, rec.polyesterRatio],
    [input.lycraRatio, rec.lycraRatio],
    [input.viscoseRatio, rec.viscoseRatio],
  ];
  let n = 0;
  let s = 0;
  for (const [a, b] of pairs) {
    if (a != null && b != null) {
      n++;
      s += 1 - Math.min(1, Math.abs(a - b) / 20);
    }
  }
  if (n === 0) return 0.85;
  return clamp01(s / n);
}

function dataDrivenCompositionNote(rec: TechnicalRecord): string | undefined {
  const parts: string[] = [];
  if (rec.cottonRatio != null) parts.push(`Pamuk %${rec.cottonRatio}`);
  if (rec.polyesterRatio != null) parts.push(`PES %${rec.polyesterRatio}`);
  if (rec.lycraRatio != null) parts.push(`Likra %${rec.lycraRatio}`);
  if (rec.viscoseRatio != null) parts.push(`Viskon %${rec.viscoseRatio}`);
  if (rec.otherRatio != null) parts.push(`Diğer %${rec.otherRatio}`);
  return parts.length ? parts.join(" • ") : undefined;
}

function confidenceFromScore(score: number, neighborCount: number): ConfidenceLevel {
  if (score >= 82 && neighborCount >= 2) return "high";
  if (score >= 65) return "medium";
  return "low";
}

function estimateMaterials(
  fabricKg: number,
  waste: number,
  rec: TechnicalRecord,
  input: OrderFormSnapshot,
  activeRecipe?: FabricRecipe
): MaterialEstimate[] {
  const w = 1 + waste / 100;

  const yarnComp = rec.yarnComponents?.filter((y) => y.ratio > 0.001) ?? [];
  if (yarnComp.length > 0) {
    const sum = yarnComp.reduce((s, y) => s + y.ratio, 0);
    const scale = sum > 0 ? 1 / sum : 1;
    return yarnComp.map((y) => ({
      component: y.component,
      netKg: fabricKg * y.ratio * scale,
      withWasteKg: fabricKg * y.ratio * scale * w,
    }));
  }

  if (
    rec.frontYarnKgPerKgFabric != null &&
    rec.backYarnKgPerKgFabric != null &&
    rec.frontYarnKgPerKgFabric + rec.backYarnKgPerKgFabric > 0.001
  ) {
    const fNe = activeRecipe?.frontYarnNe;
    const bNe = activeRecipe?.backYarnNe;
    const mNe = activeRecipe?.middleYarnNe;
    const components: { name: string; kgPerKg: number }[] = [
      {
        name:
          fNe != null
            ? `Ön iplik (Ne ${fNe})`
            : "Ön iplik",
        kgPerKg: rec.frontYarnKgPerKgFabric,
      },
    ];
    if (rec.middleYarnKgPerKgFabric != null && rec.middleYarnKgPerKgFabric > 0.001) {
      components.push({
        name:
          mNe != null ? `Ara iplik (Ne ${mNe})` : "Ara iplik",
        kgPerKg: rec.middleYarnKgPerKgFabric,
      });
    }
    components.push({
      name:
        bNe != null
          ? `Arka iplik (Ne ${bNe})`
          : "Arka iplik",
      kgPerKg: rec.backYarnKgPerKgFabric,
    });
    if (rec.lycraKgPerKgFabric != null && rec.lycraKgPerKgFabric > 0.001) {
      components.push({ name: "Likra", kgPerKg: rec.lycraKgPerKgFabric });
    }
    if (rec.polyesterKgPerKgFabric != null && rec.polyesterKgPerKgFabric > 0.001) {
      components.push({ name: "Polyester", kgPerKg: rec.polyesterKgPerKgFabric });
    }
    const norm = components.reduce((s, c) => s + c.kgPerKg, 0);
    const scale = norm > 0 ? 1 / norm : 1;
    return components
      .filter((c) => c.kgPerKg > 0.001)
      .map((c) => ({
        component: c.name,
        netKg: fabricKg * c.kgPerKg * scale,
        withWasteKg: fabricKg * c.kgPerKg * scale * w,
      }));
  }

  const main =
    rec.mainYarnKgPerKgFabric ??
    (rec.cottonRatio != null ? rec.cottonRatio / 100 : undefined) ??
    (hasInputComposition(input) && input.cottonRatio != null
      ? input.cottonRatio / 100
      : 0.8);
  const lyc =
    rec.lycraKgPerKgFabric ??
    (rec.lycraRatio != null ? rec.lycraRatio / 100 : undefined) ??
    (hasInputComposition(input) && input.lycraRatio != null ? input.lycraRatio / 100 : 0);
  const poly =
    rec.polyesterKgPerKgFabric ??
    (rec.polyesterRatio != null ? rec.polyesterRatio / 100 : undefined) ??
    (hasInputComposition(input) && input.polyesterRatio != null
      ? input.polyesterRatio / 100
      : 0);
  const visc =
    (rec.viscoseRatio != null ? rec.viscoseRatio / 100 : undefined) ??
    (input.viscoseRatio != null ? input.viscoseRatio / 100 : 0);
  const other =
    input.otherRatio != null
      ? input.otherRatio / 100
      : rec.otherRatio != null
        ? rec.otherRatio / 100
        : Math.max(0, 1 - main - lyc - poly - visc);

  const norm = main + lyc + poly + visc + other;
  const scale = norm > 0 ? 1 / norm : 1;

  const components: { name: string; kgPerKg: number }[] = [
    { name: "Ana iplik (pamuk/karışım)", kgPerKg: main * scale },
    { name: "Likra", kgPerKg: lyc * scale },
    { name: "Polyester", kgPerKg: poly * scale },
    { name: "Viskon", kgPerKg: visc * scale },
    { name: "Diğer", kgPerKg: other * scale },
  ];

  return components
    .filter((c) => c.kgPerKg > 0.001)
    .map((c) => ({
      component: c.name,
      netKg: fabricKg * c.kgPerKg,
      withWasteKg: fabricKg * c.kgPerKg * w,
    }));
}

/** Sipariş miktarını kg mamül yaklaşımına çevirir — NOTE: metre için gsm+en kabulleri */
export function orderQuantityToFabricKg(input: OrderFormSnapshot): number {
  const q = input.quantity;
  switch (input.quantityUnit) {
    case "ton":
      return q * 1000;
    case "kg":
      return q;
    case "m": {
      const gsm = input.targetGsm;
      const openCm = orderWidthContext(input).approximateOpenCmForMass;
      const widthM = (openCm || 160) / 100;
      const areaKgPerM = (gsm * widthM) / 1000;
      return q * areaKgPerM;
    }
    default:
      return q;
  }
}

function interpolateNeighbors(
  target: { gsm: number; open: number; tube?: number },
  neighbors: TechnicalRecord[]
): Pick<TechnicalRecord, "openWidth" | "tubeWidth" | "weightGsm"> {
  if (neighbors.length === 0) {
    return {
      openWidth: target.open,
      tubeWidth: target.tube ?? target.open / 2,
      weightGsm: target.gsm,
    };
  }
  if (neighbors.length === 1) {
    const n = neighbors[0]!;
    return {
      openWidth: n.openWidth ?? target.open,
      tubeWidth: n.tubeWidth ?? target.tube ?? (n.openWidth ?? target.open) / 2,
      weightGsm: n.weightGsm,
    };
  }
  let wsum = 0;
  let o = 0;
  let t = 0;
  let g = 0;
  for (const n of neighbors) {
    const dg = Math.abs(n.weightGsm - target.gsm) + 1;
    const dw = Math.abs((n.openWidth ?? target.open) - target.open) + 1;
    const wgt = 1 / (dg * dw);
    wsum += wgt;
    o += (n.openWidth ?? target.open) * wgt;
    t += (n.tubeWidth ?? (n.openWidth ?? target.open) / 2) * wgt;
    g += n.weightGsm * wgt;
  }
  return {
    openWidth: o / wsum,
    tubeWidth: t / wsum,
    weightGsm: g / wsum,
  };
}

export function calculateAlternatives(params: CalculateParams): CalculationAlternative[] {
  const { input, records, settings, activeRecipe } = params;
  const weights = settings.scoringWeights;
  const tol = input.tolerancePercent ?? 3;
  const waste =
    input.wastePercentOverride ?? settings.defaultWastePercent ?? 5;
  const wctx = orderWidthContext(input);

  const active = records.filter((r) => r.isActive);
  let pool: TechnicalRecord[];
  if (input.fabricRecipeId) {
    const byRecipe = active.filter((r) => r.fabricRecipeId === input.fabricRecipeId);
    const byFabric = active.filter((r) => r.fabricTypeId === input.fabricTypeId);
    if (byRecipe.length) pool = byRecipe;
    else if (byFabric.length) pool = byFabric;
    else pool = active;
  } else {
    const byFabric = active.filter((r) => r.fabricTypeId === input.fabricTypeId);
    pool = byFabric.length ? byFabric : active;
  }

  const scored = pool.map((rec) => {
    let fabricMatch = rec.fabricTypeId === input.fabricTypeId ? 1 : 0.35;
    if (input.fabricRecipeId && rec.fabricRecipeId === input.fabricRecipeId) {
      fabricMatch = 1;
    }
    const gsmS = distanceScore(input.targetGsm, rec.weightGsm, tol);
    const openS =
      wctx.targetOpenForScore != null
        ? distanceScore(wctx.targetOpenForScore, rec.openWidth, tol)
        : 0.5;
    const tubeS =
      wctx.targetTubeForScore != null
        ? distanceScore(wctx.targetTubeForScore, rec.tubeWidth, tol)
        : 0.5;
    const compS = compositionScore(input, rec);
    let machS = 0.5;
    if (input.preferredMachineType && rec.machineType === input.preferredMachineType) {
      machS += 0.25;
    }
    if (input.preferredDiameter && Math.abs(rec.machineDiameter - input.preferredDiameter) < 0.01) {
      machS += 0.25;
    }
    if (input.preferredPusFein && Math.abs(rec.pusFein - input.preferredPusFein) < 0.01) {
      machS += 0.25;
    }
    machS = clamp01(machS);

    const raw =
      weights.fabricMatch * fabricMatch +
      weights.gsmProximity * gsmS +
      weights.openWidthProximity * openS +
      weights.tubeWidthProximity * tubeS +
      weights.compositionSimilarity * compS +
      weights.machinePreference * machS;

    const matchScore = Math.round(raw * 100);
    return { rec, matchScore, gsmS, openS, fabricMatch };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);

  const top = scored.slice(0, 12);
  const neighbors = top.slice(0, 5).map((s) => s.rec);

  const est = interpolateNeighbors(
    {
      gsm: input.targetGsm,
      open: wctx.interpolateOpenCm,
      tube: wctx.interpolateTubeCm,
    },
    neighbors
  );

  const fabricKg = orderQuantityToFabricKg(input);

  const alternatives: CalculationAlternative[] = top.map((row, idx) => {
    const rec = row.rec;
    const openTarget = wctx.targetOpenForScore ?? wctx.interpolateOpenCm;
    const tubeTarget = wctx.targetTubeForScore;
    const openW =
      (wctx.targetOpenForScore != null &&
      distanceScore(wctx.targetOpenForScore, rec.openWidth, tol) > 0.85
        ? rec.openWidth ?? est.openWidth
        : est.openWidth) ??
      openTarget;
    const tubeBase = openW / 2;
    const tubeW =
      (tubeTarget != null
        ? distanceScore(tubeTarget, rec.tubeWidth, tol) > 0.85
          ? rec.tubeWidth ?? est.tubeWidth
          : est.tubeWidth
        : rec.tubeWidth ?? tubeBase) ??
      tubeTarget ??
      tubeBase;
    const gsm =
      (distanceScore(input.targetGsm, rec.weightGsm, tol) > 0.85
        ? rec.weightGsm
        : est.weightGsm) ?? input.targetGsm;

    const conf = confidenceFromScore(row.matchScore, neighbors.length);

    return {
      technicalRecordId: rec.id,
      machineId: rec.machineId,
      machineName: rec.machineName,
      machineType: rec.machineType,
      diameter: rec.machineDiameter,
      pusFein: rec.pusFein,
      needleCount: rec.needleCount,
      estimatedOpenWidth: Math.round((openW ?? 0) * 10) / 10,
      estimatedTubeWidth: Math.round((tubeW ?? 0) * 10) / 10,
      estimatedGsm: Math.round((gsm ?? 0) * 10) / 10,
      matchScore: row.matchScore,
      confidence: conf,
      isRecommended: idx === 0,
      advantageNote:
        idx === 0
          ? "En yüksek ağırlıklı skor; hedefe yakın teknik kayıt kombinasyonu."
          : idx === 1
            ? "Alternatif makine çapı / iğne ile benzer sonuç."
            : undefined,
      materials: estimateMaterials(fabricKg, waste, rec, input, activeRecipe),
      yarnLengthMPerKg: rec.yarnLength,
      yarnTypeSummary: rec.yarnTypeSummary,
      dataDrivenCompositionNote: dataDrivenCompositionNote(rec),
    };
  });

  return alternatives;
}
