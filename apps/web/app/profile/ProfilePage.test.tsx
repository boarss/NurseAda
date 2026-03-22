import React from "react";
import { fireEvent, screen } from "@testing-library/react";
import { vi } from "vitest";

import ProfilePage from "./page";
import { renderWithProviders } from "@/test/renderWithProviders";

const mockSignOut = vi.fn();

const defaultSignedOut = {
  session: null,
  user: null,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: mockSignOut,
  accessToken: null,
  getValidAccessToken: async () => null,
  patientCode: null,
};

const mockUseAuth = vi.fn(() => defaultSignedOut);

vi.mock("@/lib/AuthContext", async () => {
  const actual = await vi.importActual<typeof import("@/lib/AuthContext")>(
    "@/lib/AuthContext",
  );
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

describe("ProfilePage", () => {
  beforeEach(() => {
    mockSignOut.mockReset();
    mockUseAuth.mockReturnValue(defaultSignedOut);
  });

  it("shows guest state when not signed in", () => {
    renderWithProviders(<ProfilePage />);

    expect(screen.getByText(/Sign in to your profile/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/auth/sign-in",
    );
  });

  it("shows profile details when signed in and signs out", () => {
    mockUseAuth.mockReturnValue({
      session: {} as import("@supabase/supabase-js").Session,
      user: {
        id: "u1",
        email: "test@example.com",
        created_at: "2024-01-15T10:00:00.000Z",
        user_metadata: {},
      } as import("@supabase/supabase-js").User,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: mockSignOut,
      accessToken: "tok",
      getValidAccessToken: async () => "tok",
      patientCode: "NA-000042",
    });

    renderWithProviders(<ProfilePage />);

    expect(screen.getByRole("heading", { name: /^Profile$/i })).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("NA-000042")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));
    expect(mockSignOut).toHaveBeenCalled();
  });
});
