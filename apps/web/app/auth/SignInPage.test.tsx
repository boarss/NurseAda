import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import SignInPage from "./sign-in/page";
import { renderWithProviders } from "@/test/renderWithProviders";

const mockSignIn = vi.fn();

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
      signIn: mockSignIn,
      signUp: vi.fn(),
      signOut: vi.fn(),
      accessToken: null,
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

describe("SignInPage", () => {
  beforeEach(() => {
    mockSignIn.mockReset();
    mockPush.mockReset();
    mockReplace.mockReset();
  });

  it("shows error when email or password is invalid", async () => {
    mockSignIn.mockResolvedValueOnce("Invalid email or password");

    renderWithProviders(<SignInPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrongpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/invalid email or password/i),
      ).toBeInTheDocument(),
    );
  });

  it("redirects to /chat after successful sign in", async () => {
    mockSignIn.mockResolvedValueOnce(null);

    renderWithProviders(<SignInPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "correctpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/chat"));
  });
});

