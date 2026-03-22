import { describe, expect, it } from "vitest";

import { formatRecommendations } from "./recommendationEngine";

describe("formatRecommendations", () => {
  it("returns empty for non-array", () => {
    expect(formatRecommendations(null)).toEqual([]);
    expect(formatRecommendations(undefined)).toEqual([]);
  });

  it("trims, dedupes case-insensitively, skips empty", () => {
    expect(
      formatRecommendations([" Rest ", "rest", "", "  ", "Drink water"]),
    ).toEqual(["Rest", "Drink water"]);
  });

  it("skips non-strings", () => {
    expect(formatRecommendations(["a", 1 as unknown as string, "b"])).toEqual(["a", "b"]);
  });
});
