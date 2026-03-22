import React from "react";
import { screen } from "@testing-library/react";
import { vi } from "vitest";

import ChatPage from "../chat/page";
import MedicationsPage from "../medications/page";
import AppointmentsPage from "../appointments/page";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("@/lib/AuthContext", async () => {
  const actual = await vi.importActual<typeof import("@/lib/AuthContext")>(
    "@/lib/AuthContext",
  );
  return {
    ...actual,
    useAuth: () => ({
      session: null,
      user: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      accessToken: null,
      getValidAccessToken: async () => null,
      patientCode: null,
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "123" }),
}));

describe("Access control when signed out", () => {
  it("allows access to chat page as guest", () => {
    renderWithProviders(<ChatPage />);

    expect(screen.getByText(/guest/i)).toBeInTheDocument();
  });

  it("requires sign in for medication reminders", () => {
    renderWithProviders(<MedicationsPage />);

    expect(
      screen.getByText(/sign in to create and manage medication reminders/i),
    ).toBeInTheDocument();
  });

  it("requires sign in for appointments", () => {
    renderWithProviders(<AppointmentsPage />);

    expect(
      screen.getByText(/sign in to view and manage your appointments/i),
    ).toBeInTheDocument();
  });
});

