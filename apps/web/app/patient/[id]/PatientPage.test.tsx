import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useParams } from "next/navigation";

import PatientProfilePage from "./page";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
}));

vi.mock("@/lib/AuthContext", async () => {
  const actual = await vi.importActual<typeof import("@/lib/AuthContext")>(
    "@/lib/AuthContext",
  );
  return {
    ...actual,
    useAuth: () => ({
      session: null,
      user: { id: "u1" },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      accessToken: "test-token",
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

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

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /patient profile/i }),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: /observations/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /medications/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reports/i }),
    ).toBeInTheDocument();
  });
});

