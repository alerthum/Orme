import { describe, it, expect } from "vitest";
import { calculateAlternatives, orderQuantityToFabricKg } from "./engine";
import type { AppSettings, OrderFormSnapshot, TechnicalRecord } from "@/types";

const settings: AppSettings = {
  id: "app",
  defaultWastePercent: 5,
  importDuplicateSensitivity: 0.85,
  scoringWeights: {
    fabricMatch: 0.3,
    gsmProximity: 0.2,
    openWidthProximity: 0.15,
    tubeWidthProximity: 0.1,
    compositionSimilarity: 0.15,
    machinePreference: 0.1,
  },
};

const baseRecord = (over: Partial<TechnicalRecord>): TechnicalRecord => ({
  id: "t1",
  fabricTypeId: "ft-1",
  fabricTypeName: "Test",
  machineId: "m1",
  machineName: "M1",
  machineType: "Yuvarlak",
  machineDiameter: 36,
  pusFein: 28,
  needleCount: 3000,
  weightGsm: 200,
  openWidth: 140,
  tubeWidth: 70,
  isApproved: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

describe("orderQuantityToFabricKg", () => {
  it("converts kg", () => {
    const input = {
      quantity: 100,
      quantityUnit: "kg",
      targetGsm: 180,
      targetWidth: 160,
      widthKind: "open",
    } as OrderFormSnapshot;
    expect(orderQuantityToFabricKg(input)).toBe(100);
  });

  it("converts ton", () => {
    const input = {
      quantity: 2,
      quantityUnit: "ton",
      targetGsm: 180,
      targetWidth: 160,
      widthKind: "open",
    } as OrderFormSnapshot;
    expect(orderQuantityToFabricKg(input)).toBe(2000);
  });
});

describe("calculateAlternatives", () => {
  it("returns sorted alternatives with scores", () => {
    const input: OrderFormSnapshot = {
      customerName: "X",
      orderCode: "1",
      orderTitle: "T",
      fabricTypeId: "ft-1",
      targetGsm: 195,
      targetWidth: 135,
      widthKind: "open",
      quantity: 500,
      quantityUnit: "kg",
      tolerancePercent: 5,
      cottonRatio: 75,
      polyesterRatio: 20,
      lycraRatio: 5,
    };
    const records: TechnicalRecord[] = [
      baseRecord({
        id: "a",
        weightGsm: 190,
        openWidth: 136,
        fabricTypeId: "ft-1",
        mainYarnKgPerKgFabric: 0.7,
        lycraKgPerKgFabric: 0.05,
        polyesterKgPerKgFabric: 0.2,
      }),
      baseRecord({
        id: "b",
        weightGsm: 220,
        openWidth: 120,
        fabricTypeId: "ft-1",
      }),
    ];
    const alts = calculateAlternatives({ input, records, settings });
    expect(alts.length).toBeGreaterThan(0);
    expect(alts[0]!.matchScore).toBeGreaterThanOrEqual(alts[1]!.matchScore);
    expect(alts[0]!.isRecommended).toBe(true);
    expect(alts[0]!.materials.length).toBeGreaterThan(0);
  });

  it("reçete id ile yalnızca eşleşen teknik satırları kullanır", () => {
    const input: OrderFormSnapshot = {
      customerName: "X",
      orderCode: "1",
      orderTitle: "T",
      fabricTypeId: "ft-1",
      fabricRecipeId: "fr-99",
      targetGsm: 180,
      targetWidth: 160,
      widthKind: "open",
      quantity: 1000,
      quantityUnit: "kg",
      tolerancePercent: 5,
    };
    const records: TechnicalRecord[] = [
      baseRecord({
        id: "match",
        fabricRecipeId: "fr-99",
        fabricTypeId: "ft-1",
        weightGsm: 182,
        openWidth: 158,
        yarnTypeSummary: "20/10",
        yarnLength: 3.8,
        frontYarnKgPerKgFabric: 0.55,
        backYarnKgPerKgFabric: 0.42,
        cottonRatio: 100,
      }),
      baseRecord({
        id: "other",
        fabricTypeId: "ft-1",
        weightGsm: 179,
        openWidth: 162,
      }),
    ];
    const alts = calculateAlternatives({ input, records, settings });
    expect(alts.every((a) => a.technicalRecordId === "match")).toBe(true);
    expect(alts[0]?.yarnTypeSummary).toBe("20/10");
    expect(alts[0]?.materials.some((m) => m.component.includes("Ön iplik"))).toBe(true);
  });

  it("yarnComponents varsa mamül kg bu oranlara göre bölünür (çoklu hammadde)", () => {
    const input: OrderFormSnapshot = {
      customerName: "X",
      orderCode: "1",
      orderTitle: "T",
      fabricTypeId: "ft-1",
      targetGsm: 200,
      targetWidth: 150,
      widthKind: "open",
      quantity: 300,
      quantityUnit: "kg",
      tolerancePercent: 5,
    };
    const records: TechnicalRecord[] = [
      baseRecord({
        id: "uc",
        fabricTypeId: "ft-1",
        weightGsm: 200,
        openWidth: 150,
        yarnComponents: [
          { component: "Pamuk", ratio: 60 },
          { component: "Polyester", ratio: 34 },
          { component: "Likra", ratio: 6 },
        ],
      }),
    ];
    const alts = calculateAlternatives({ input, records, settings });
    expect(alts[0]!.materials).toHaveLength(3);
    const pam = alts[0]!.materials.find((m) => m.component === "Pamuk");
    expect(pam?.withWasteKg).toBeCloseTo(300 * 0.6 * 1.05, 5);
  });

  it("siparişte bileşen yoksa skor bileşen ekseninde nötr (1) kalır", () => {
    const input: OrderFormSnapshot = {
      customerName: "X",
      orderCode: "1",
      orderTitle: "T",
      fabricTypeId: "ft-1",
      targetGsm: 195,
      targetWidth: 135,
      widthKind: "open",
      quantity: 500,
      quantityUnit: "kg",
      tolerancePercent: 5,
    };
    const records: TechnicalRecord[] = [
      baseRecord({
        id: "a",
        weightGsm: 190,
        openWidth: 136,
        fabricTypeId: "ft-1",
        cottonRatio: 100,
        mainYarnKgPerKgFabric: 0.95,
      }),
    ];
    const alts = calculateAlternatives({ input, records, settings });
    expect(alts[0]!.matchScore).toBeGreaterThan(70);
  });
});
