import { describe, it, expect } from "vitest";
import { suggestColumnMapping, mappingConfidence } from "./column-mapper";

describe("suggestColumnMapping", () => {
  it("maps Turkish headers", () => {
    const headers = ["GRAMAJ", "AÇIK EN", "İĞNE SAYISI", "PUS"];
    const m = suggestColumnMapping(headers);
    expect(m["GRAMAJ"]).toBe("weightGsm");
    expect(m["AÇIK EN"]).toBe("openWidth");
    expect(m["İĞNE SAYISI"]).toBe("needleCount");
    expect(m["PUS"]).toBe("pusFein");
  });
});

describe("mappingConfidence", () => {
  it("returns score in 0-1", () => {
    const c = mappingConfidence({
      A: "weightGsm",
      B: "openWidth",
      C: undefined,
    });
    expect(c).toBeGreaterThan(0);
    expect(c).toBeLessThanOrEqual(1);
  });
});
