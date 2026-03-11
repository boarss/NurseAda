import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

import RemediesPage from "./page";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    getHerbalCatalog: vi.fn().mockResolvedValue({
      items: [
        {
          text: "**Ginger tea** may help with nausea.",
          source: "knowledge",
          condition: "nausea",
          evidence_level: "moderate",
          evidence_label: "Moderate evidence",
          contraindications: ["pregnancy (late)", "ulcer"],
          keywords: ["ginger", "nausea"],
        },
      ],
      total: 1,
    }),
  };
});

describe("RemediesPage", () => {
  it("renders herbal remedies with evidence badge and contraindications", async () => {
    renderWithProviders(<RemediesPage />);

    await waitFor(() =>
      expect(screen.getByText(/ginger tea/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/moderate evidence/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ginger tea/i }));
    expect(screen.getByText(/avoid if/i)).toBeInTheDocument();
  });
});

