import type { TechnicalRecord } from "@/types";
import seedFile from "@/data/seed/technical-records.json";

type SeedFile = {
  version?: number;
  technicalRecords?: TechnicalRecord[];
};

/** `npm run seed:technical` ile üretilen Excel kökenli teknik kayıtlar */
export function hydrateExcelSeedTechnicalRecords(): TechnicalRecord[] {
  const data = seedFile as unknown as SeedFile;
  const rows = data.technicalRecords ?? [];
  return rows.map((r, i) => ({
    ...r,
    id:
      typeof r.id === "string" && r.id.length > 0
        ? r.id
        : `ts-${String(i + 1).padStart(6, "0")}`,
    createdAt: r.createdAt != null ? new Date(String(r.createdAt)) : new Date(0),
    updatedAt: r.updatedAt != null ? new Date(String(r.updatedAt)) : new Date(0),
  }));
}
