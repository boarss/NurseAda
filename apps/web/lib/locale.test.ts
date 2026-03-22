import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getLocale, setLocale } from "./locale";

describe("locale", () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
      key: () => null,
      length: 0,
    });
    vi.stubGlobal("navigator", { languages: ["en-US"], language: "en-US" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const k of Object.keys(store)) delete store[k];
  });

  it("setLocale persists supported locale", () => {
    setLocale("pcm");
    expect(store["nurseada-locale"]).toBe("pcm");
    expect(getLocale()).toBe("pcm");
  });

  it("setLocale ignores unsupported values", () => {
    setLocale("en");
    // @ts-expect-error intentional invalid locale for test
    setLocale("zz");
    expect(store["nurseada-locale"]).toBe("en");
  });
});
