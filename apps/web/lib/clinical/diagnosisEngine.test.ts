import { describe, expect, it } from "vitest";

import { getDiagnosisSummary } from "./diagnosisEngine";

describe("getDiagnosisSummary", () => {
  it("handles missing diagnosis", () => {
    expect(getDiagnosisSummary(null)).toMatch(/no diagnosis/i);
  });

  it("includes severity and rounded confidence", () => {
    expect(
      getDiagnosisSummary({
        severity: "high",
        inferred_codes: [],
        confidence: 0.8123,
      }),
    ).toBe("high (81% confidence)");
  });

  it("omits confidence when not a number", () => {
    expect(
      getDiagnosisSummary({
        severity: "low",
        inferred_codes: [],
      }),
    ).toBe("low");
  });
});
