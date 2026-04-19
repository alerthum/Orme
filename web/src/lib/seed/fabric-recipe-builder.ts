import type { FabricRecipe } from "../../types";

/** mock-db ile aynı id üretimi (JSON kataloğu) */
export const SEED_FABRIC_TYPE_IDS = {
  FL2: "ft-001",
  D2: "ft-002",
  INT: "ft-003",
  KSK: "ft-004",
  LAC: "ft-005",
  RIB: "ft-006",
  SUP: "ft-007",
  U3P: "ft-008",
} as const;

const ts = () => new Date();

function recipe(
  id: string,
  code: string,
  name: string,
  fabricTypeId: string,
  structureCategory: string,
  frontYarnNe: number,
  backYarnNe: number,
  yarnConstructionLabel: string,
  extra?: Partial<FabricRecipe>
): FabricRecipe {
  const t = ts();
  return {
    id,
    code,
    name,
    fabricTypeId,
    structureCategory,
    frontYarnNe,
    backYarnNe,
    yarnConstructionLabel,
    isActive: true,
    createdAt: t,
    updatedAt: t,
    ...extra,
  };
}

/**
 * Excel ailelerine göre genişletilmiş reçete listesi (JSON kataloğu için).
 * Teknik satırlar `yarnConstructionLabel` ile eşlenir.
 */
export function buildFabricRecipesCatalog(): FabricRecipe[] {
  const out: FabricRecipe[] = [];
  let n = 0;
  const fr = () => {
    n += 1;
    return `fr-${String(n).padStart(3, "0")}`;
  };

  out.push(
    recipe(
      fr(),
      "D2-20/10",
      "Düz iki iplik 20/10",
      SEED_FABRIC_TYPE_IDS.D2,
      "düz 2 iplik",
      20,
      10,
      "20/10",
      { compositionHint: "Pamuk/PES karışımı — düz iki iplik" }
    )
  );

  const d2Pairs: [string, string, number, number][] = [
    ["D2-30/30", "Düz iki iplik 30/30", 30, 30],
    ["D2-40/40", "Düz iki iplik 40/40", 40, 40],
    ["D2-60/60", "Düz iki iplik 60/60", 60, 60],
    ["D2-36/36", "Düz iki iplik 36/36", 36, 36],
    ["D2-32/32", "Düz iki iplik 32/32", 32, 32],
    ["D2-80/80", "Düz iki iplik 80/80", 80, 80],
    ["D2-20/20", "Düz iki iplik 20/20", 20, 20],
    ["D2-50/50", "Düz iki iplik 50/50", 50, 50],
  ];
  for (const [code, name, a, b] of d2Pairs) {
    out.push(
      recipe(fr(), code, name, SEED_FABRIC_TYPE_IDS.D2, "düz 2 iplik", a, b, `${a}/${b}`)
    );
  }

  const fl2Pairs: [string, string, number, number][] = [
    ["FL2-60/60", "Full Lycra 60/60", 60, 60],
    ["FL2-80/80", "Full Lycra 80/80", 80, 80],
    ["FL2-40/40", "Full Lycra 40/40", 40, 40],
    ["FL2-32/32", "Full Lycra 32/32", 32, 32],
    ["FL2-30/30", "Full Lycra 30/30", 30, 30],
    ["FL2-20/20", "Full Lycra 20/20", 20, 20],
  ];
  for (const [code, name, a, b] of fl2Pairs) {
    out.push(
      recipe(fr(), code, name, SEED_FABRIC_TYPE_IDS.FL2, "full lycra 2 iplik", a, b, `${a}/${b}`, {
        compositionHint: "20D likra + polyester yüzey — Excel FULL LYC sayfaları",
      })
    );
  }

  const intNe: [string, number][] = [
    ["INT-60/1", 60],
    ["INT-50/1", 50],
    ["INT-40/1", 40],
    ["INT-36/1", 36],
    ["INT-30/1", 30],
  ];
  for (const [code, ne] of intNe) {
    out.push(
      recipe(
        fr(),
        code,
        `İnterlok Ne ${ne}`,
        SEED_FABRIC_TYPE_IDS.INT,
        "interlok",
        ne,
        1,
        `${ne}/1`,
        { compositionHint: "Düz interlok — İNTERLOK.xlsx" }
      )
    );
  }

  const ribKskNe: [string, string, number][] = [
    ["RIB-60/1", "Ribana 60/1 %5 Lyc", 60],
    ["RIB-50/1", "Ribana 50/1 %5 Lyc", 50],
    ["RIB-40/1", "Ribana 40/1 %5 Lyc", 40],
    ["KSK-60/1", "Kaşkorse 60/1 %5 Lyc", 60],
    ["KSK-50/1", "Kaşkorse 50/1 %5 Lyc", 50],
    ["KSK-40/1", "Kaşkorse 40/1 %5 Lyc", 40],
  ];
  for (const [code, name, ne] of ribKskNe) {
    const ft = code.startsWith("RIB") ? SEED_FABRIC_TYPE_IDS.RIB : SEED_FABRIC_TYPE_IDS.KSK;
    const st = code.startsWith("RIB") ? "ribana" : "kaşkorse";
    out.push(
      recipe(fr(), code, name, ft, st, ne, 1, `${ne}/1`, {
        compositionHint: "%5 likra — Excel ribana / kaşkorse ENLER",
      })
    );
  }

  const lacNe: [string, number][] = [
    ["LAC-60/1", 60],
    ["LAC-50/1", 50],
    ["LAC-40/1", 40],
    ["LAC-36/1", 36],
  ];
  for (const [code, ne] of lacNe) {
    out.push(
      recipe(
        fr(),
        code,
        `Lakost tek/çift toplama Ne ${ne}`,
        SEED_FABRIC_TYPE_IDS.LAC,
        "lakost",
        ne,
        1,
        `${ne}/1`,
        { compositionHint: "%5 Lyc lakost — LACOSTLAR.xlsx" }
      )
    );
  }

  const supNe: [string, number][] = [
    ["SUP-60/1", 60],
    ["SUP-50/1", 50],
    ["SUP-40/1", 40],
  ];
  for (const [code, ne] of supNe) {
    out.push(
      recipe(fr(), code, `Süprem Ne ${ne}`, SEED_FABRIC_TYPE_IDS.SUP, "süprem", ne, 1, `${ne}/1`, {
        compositionHint: "Full / %5 Lyc süprem — SÜPREM.xlsx",
      })
    );
  }

  const u3Triples: [number, number, number][] = [
    [40, 70, 10],
    [40, 70, 12],
    [40, 70, 14],
    [40, 90, 10],
    [40, 90, 12],
    [40, 90, 14],
    [36, 36, 10],
    [36, 36, 12],
    [36, 36, 14],
    [36, 30, 10],
    [36, 30, 12],
    [36, 30, 14],
    [36, 20, 10],
    [36, 20, 12],
    [36, 20, 14],
  ];
  for (const [a, b, c] of u3Triples) {
    const label = `${a}/${b}/${c}`;
    out.push(
      recipe(
        fr(),
        `U3P-${a}-${b}-${c}`,
        `Üç iplik ${label} (dış/ara/arka)`,
        SEED_FABRIC_TYPE_IDS.U3P,
        "üç iplik",
        a,
        c,
        label,
        {
          middleYarnNe: b,
          thirdYarnNe: c,
          yarnStructure: "3-ply",
          compositionHint: "70DN / 90DN PES veya pamuklu ara — ÜÇİPLİKLER.xlsx",
        }
      )
    );
  }

  return out;
}
