import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  isDuzIkiIplikWorkbook,
  parseIkiIplikWorkbook,
  SHEET_ENLER,
  SHEET_GRAMAJ,
} from "./duz-iki-iplik";

const xlsxPath = path.resolve(
  __dirname,
  "../../../../data/excel-kaynak/İKİ İPLİK.xlsx"
);

describe("duz-iki-iplik parser", () => {
  it("isDuzIkiIplikWorkbook", () => {
    expect(isDuzIkiIplikWorkbook([SHEET_ENLER, SHEET_GRAMAJ])).toBe(true);
    expect(isDuzIkiIplikWorkbook([SHEET_ENLER])).toBe(false);
  });

  it("parses İKİ İPLİK.xlsx when present", () => {
    if (!fs.existsSync(xlsxPath)) {
      console.warn("Atlandı (dosya yok):", xlsxPath);
      return;
    }
    const buf = fs.readFileSync(xlsxPath);
    const r = parseIkiIplikWorkbook(buf);
    expect(r.enler.length).toBeGreaterThan(10);
    expect(r.gramaj.length).toBeGreaterThan(50);
    const first = r.enler[0];
    expect(first).toBeDefined();
    expect(first!.openWidthCm).toBeGreaterThan(0);
    expect(first!.pusFein).toBeGreaterThan(0);
  });
});
