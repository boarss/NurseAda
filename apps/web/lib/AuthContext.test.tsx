import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthProvider, useAuth } from "./AuthContext";
import {
  supabaseAuthMock,
  supabaseFromMock,
  patientsSingle,
} from "@/test/mocks/supabaseClientMock";

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthProvider", () => {
  it("exposes signIn success as null error", async () => {
    supabaseAuthMock.signInWithPassword.mockResolvedValueOnce({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper });

    let err: string | null = "pending";
    await act(async () => {
      err = await result.current.signIn("a@b.com", "secret");
    });
    expect(err).toBeNull();
  });

  it("exposes signIn Supabase error message", async () => {
    supabaseAuthMock.signInWithPassword.mockResolvedValueOnce({
      error: { message: "Invalid login" },
    });
    const { result } = renderHook(() => useAuth(), { wrapper });

    let err: string | null = null;
    await act(async () => {
      err = await result.current.signIn("a@b.com", "wrong");
    });
    expect(err).toBe("Invalid login");
  });

  it("maps configuration errors from thrown exceptions", async () => {
    supabaseAuthMock.signUp.mockRejectedValueOnce(
      new Error("Supabase is not configured for this test"),
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    let err: string | null = null;
    await act(async () => {
      err = await result.current.signUp("a@b.com", "secret");
    });
    expect(err).toMatch(/NEXT_PUBLIC_SUPABASE_URL/i);
  });

  it("getValidAccessToken returns token when session is fresh", async () => {
    const now = Math.floor(Date.now() / 1000);
    supabaseAuthMock.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "tok",
          expires_at: now + 3600,
        },
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    let token: string | null = null;
    await act(async () => {
      token = await result.current.getValidAccessToken();
    });
    expect(token).toBe("tok");
  });

  it("getValidAccessToken refreshes when near expiry", async () => {
    const now = Math.floor(Date.now() / 1000);
    supabaseAuthMock.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "old",
          expires_at: now + 60,
        },
      },
    });
    supabaseAuthMock.refreshSession.mockResolvedValueOnce({
      data: { session: { access_token: "new" } },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    let token: string | null = null;
    await act(async () => {
      token = await result.current.getValidAccessToken();
    });
    expect(token).toBe("new");
  });

  it("loads patient_code when session has user", async () => {
    supabaseAuthMock.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "t",
          expires_at: Math.floor(Date.now() / 1000) + 9999,
          user: { id: "user-1" },
        },
      },
    });
    patientsSingle.mockResolvedValue({
      data: { patient_code: "P-001" },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.patientCode).toBe("P-001"));
    expect(supabaseFromMock).toHaveBeenCalledWith("patients");
  });
});
