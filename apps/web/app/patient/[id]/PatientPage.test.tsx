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
      patientCode: "NA-000123",
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

describe("PatientProfilePage", () => {
  it("renders patient demographics and tabs", async () => {
    (useParams as unknown as vi.Mock).mockReturnValue({ id: "NA-000123" });
    renderWithProviders(<PatientProfilePage />);

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /my profile/i }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText(/na-000123/i)).toBeInTheDocument();
  });
});

