import { z } from "zod";

export const orderFormSchema = z.object({
  customerName: z.string().min(1, "Müşteri gerekli"),
  orderCode: z.string().min(1, "Sipariş kodu gerekli"),
  orderTitle: z.string().min(1, "Sipariş adı gerekli"),
  fabricRecipeId: z.string().optional(),
  fabricRecipeCode: z.string().optional(),
  fabricTypeId: z.string().min(1, "Kumaş türü seçin"),
  targetGsm: z.coerce.number().positive(),
  targetWidth: z.coerce.number().positive(),
  widthKind: z.enum(["open", "tube"]),
  fabricContentNote: z.string().optional(),
  /** V1 uyumluluğu — V2 akışında kullanılmaz; bileşen teknik kayıttan gelir */
  cottonRatio: z.coerce.number().min(0).max(100).optional(),
  polyesterRatio: z.coerce.number().min(0).max(100).optional(),
  lycraRatio: z.coerce.number().min(0).max(100).optional(),
  viscoseRatio: z.coerce.number().min(0).max(100).optional(),
  otherRatio: z.coerce.number().min(0).max(100).optional(),
  quantity: z.coerce.number().positive(),
  quantityUnit: z.enum(["kg", "ton", "m"]),
  tolerancePercent: z.coerce.number().min(0).max(25).default(3),
  preferredMachineType: z.string().optional(),
  preferredDiameter: z.coerce.number().optional(),
  preferredPusFein: z.coerce.number().optional(),
  wastePercentOverride: z.coerce.number().min(0).max(50).optional(),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;
