import { describe, expect, it } from "vitest";

import { splitDisclaimer } from "./generateResponse";

describe("splitDisclaimer", () => {
  it("returns full string when no disclaimer pattern", () => {
    const reply = "Hello\n\nStay hydrated.";
    expect(splitDisclaimer(reply)).toEqual({ main: reply, disclaimer: null });
  });

  it("splits when disclaimer starts with known phrase", () => {
    const main = "Here is advice.";
    const disc =
      "This is general information only, not medical advice.\nConsult a healthcare provider.";
    const reply = `${main}\n\n${disc}`;
    expect(splitDisclaimer(reply)).toEqual({ main, disclaimer: disc });
  });
});
