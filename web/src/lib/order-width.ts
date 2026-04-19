import type { OrderFormSnapshot, OrderWidthKind } from "@/types";

/** Sipariş formundaki tek en girişini motor ve kg hesaplarına dağıtır */
export function orderWidthContext(input: OrderFormSnapshot) {
  const w = input.targetWidth;
  const isOpen = input.widthKind === "open";
  const isTube = input.widthKind === "tube";

  return {
    /** Skorda kullanılır; diğer eksen nötr (0.5) */
    targetOpenForScore: isOpen ? w : undefined,
    targetTubeForScore: isTube ? w : undefined,
    /** Metre → kg dönüşümünde kullanılan yaklaşık açık en (cm) */
    approximateOpenCmForMass: isOpen ? w : w * 2,
    /** Komşu interpolasyonunda anchor açık en (cm) — tüp girildiyse ~2×tüp */
    interpolateOpenCm: isOpen ? w : w * 2,
    interpolateTubeCm: isTube ? w : undefined,
  };
}

/** Eski kayıtlarda `targetOpenWidth` / `targetTubeWidth` olabilir (Firestore). */
export function orderWidthSummary(input: OrderFormSnapshot): string {
  const row = input as OrderFormSnapshot & {
    targetOpenWidth?: number;
    targetTubeWidth?: number;
  };
  if (
    row.targetWidth != null &&
    (row.widthKind === "open" || row.widthKind === "tube")
  ) {
    const label = row.widthKind === "open" ? "açık en" : "tüp en";
    return `${row.targetWidth} cm (${label})`;
  }
  if (row.targetOpenWidth != null) {
    return `${row.targetOpenWidth} cm (açık en)`;
  }
  if (row.targetTubeWidth != null) {
    return `${row.targetTubeWidth} cm (tüp en)`;
  }
  return "—";
}

export const WIDTH_KIND_LABELS: Record<OrderWidthKind, string> = {
  open: "Açık en (mamül açık eni)",
  tube: "Tüp en",
};
