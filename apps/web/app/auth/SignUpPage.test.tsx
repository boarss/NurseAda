import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SignUpPage from "./sign-up/page";
import { renderWithProviders } from "@/test/renderWithProviders";

const mockSignUp = vi.fn();
const mockReplace = vi.fn();

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
      signUp: mockSignUp,
      signOut: vi.fn(),
      accessToken: null,
      getValidAccessToken: async () => null,
      patientCode: null,
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

describe("SignUpPage", () => {
  beforeEach(() => {
    mockSignUp.mockReset();
    mockReplace.mockReset();
  });

  it("allows user to sign up with email and password", async () => {
    mockSignUp.mockResolvedValueOnce(null);

    renderWithProviders(<SignUpPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "secret123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "secret123" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /create your account/i }),
    );

    await waitFor(() =>
      expect(screen.queryByText(/check your email/i)).not.toBeNull(),
    );

    expect(mockSignUp).toHaveBeenCalledWith("user@example.com", "secret123");
  });

  it("shows validation error when passwords do not match", () => {
    renderWithProviders(<SignUpPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "secret123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "different" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /create your account/i }),
    );

    expect(
      screen.queryByText(/passwords do not match/i),
    ).not.toBeNull();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("shows validation error when password is too short", () => {
    renderWithProviders(<SignUpPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "123" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /create your account/i }),
    );

    expect(
      screen.queryByText(/password must be at least 6 characters/i),
    ).not.toBeNull();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("shows backend error message from signUp", async () => {
    mockSignUp.mockResolvedValueOnce("Email already registered");

    renderWithProviders(<SignUpPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: "secret123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "secret123" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /create your account/i }),
    );

    await waitFor(() =>
      expect(
        screen.queryByText(/email already registered/i),
      ).not.toBeNull(),
    );
  });
});

