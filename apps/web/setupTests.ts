import { beforeEach, expect, vi } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

import { supabaseMock, resetSupabaseClientMock } from "./test/mocks/supabaseClientMock";

expect.extend(matchers);

// Basic mock for matchMedia used by some components/layouts
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    media: "",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

vi.mock("@/lib/supabase", () => ({
  supabase: supabaseMock,
}));

beforeEach(() => {
  resetSupabaseClientMock();
});
