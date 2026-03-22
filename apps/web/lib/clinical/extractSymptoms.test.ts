import { describe, expect, it } from "vitest";

import { isExtractedSymptom, normalizeExtractedSymptoms } from "./extractSymptoms";

describe("isExtractedSymptom", () => {
  it("accepts valid objects", () => {
    expect(
      isExtractedSymptom({ term: "fever", present: true, negated: false }),
    ).toBe(true);
  });

  it("rejects invalid shapes", () => {
    expect(isExtractedSymptom(null)).toBe(false);
    expect(isExtractedSymptom({ term: 1, present: true, negated: false })).toBe(false);
    expect(isExtractedSymptom({ term: "x", present: "yes", negated: false })).toBe(false);
  });
});

describe("normalizeExtractedSymptoms", () => {
  it("returns empty for non-array", () => {
    expect(normalizeExtractedSymptoms(undefined)).toEqual([]);
    expect(normalizeExtractedSymptoms({})).toEqual([]);
  });

  it("filters and normalizes terms", () => {
    const out = normalizeExtractedSymptoms([
      { term: " Fever ", present: true, negated: false, duration: "2d", severity: "mild" },
      { bad: true },
      { term: "cough", present: false, negated: true },
    ]);
    expect(out).toEqual([
      {
        term: "fever",
        present: true,
        negated: false,
        duration: "2d",
        severity: "mild",
      },
      {
        term: "cough",
        present: false,
        negated: true,
        duration: null,
        severity: null,
      },
    ]);
  });
});
