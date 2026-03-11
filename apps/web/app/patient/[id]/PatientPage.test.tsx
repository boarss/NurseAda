import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useParams } from "next/navigation";

import PatientProfilePage from "./page";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    getPatient: vi.fn().mockResolvedValue({
      resourceType: "Patient",
      id: "123",
      name: [{ given: ["Test"], family: "User" }],
      birthDate: "1990-01-01",
      gender: "female",
    }),
    getObservations: vi.fn().mockResolvedValue({
      resourceType: "Bundle",
      entry: [],
    }),
    getMedications: vi.fn().mockResolvedValue({
      resourceType: "Bundle",
      entry: [],
    }),
    getDiagnosticReports: vi.fn().mockResolvedValue({
      resourceType: "Bundle",
      entry: [],
    }),
  };
});

describe("PatientProfilePage", () => {
  it("renders patient demographics and tabs", async () => {
    (useParams as unknown as vi.Mock).mockReturnValue({ id: "123" });
    renderWithProviders(<PatientProfilePage />);

    await waitFor(() => expect(screen.getByText(/patient profile/i)).toBeInTheDocument());
    expect(screen.getByText(/observations/i)).toBeInTheDocument();
    expect(screen.getByText(/medications/i)).toBeInTheDocument();
    expect(screen.getByText(/reports/i)).toBeInTheDocument();
  });
});

