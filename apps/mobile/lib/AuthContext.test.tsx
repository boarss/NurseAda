import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthProvider, useAuth } from "./AuthContext";
import {
  supabaseAuthMock,
  supabaseFromMock,
  patientsSingle,
} from "../test/mocks/supabaseClientMock";

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("AuthProvider (mobile)", () => {
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

  it("exposes signUp success as null error", async () => {
    supabaseAuthMock.signUp.mockResolvedValueOnce({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper });

    let err: string | null = "pending";
    await act(async () => {
      err = await result.current.signUp("new@b.com", "secret");
    });
    expect(err).toBeNull();
  });

  it("exposes signUp Supabase error message", async () => {
    supabaseAuthMock.signUp.mockResolvedValueOnce({
      error: { message: "Email taken" },
    });
    const { result } = renderHook(() => useAuth(), { wrapper });

    let err: string | null = null;
    await act(async () => {
      err = await result.current.signUp("x@b.com", "secret");
    });
    expect(err).toBe("Email taken");
  });

  it("getValidAccessToken returns null when session has no access_token", async () => {
    supabaseAuthMock.getSession.mockResolvedValue({
      data: { session: { access_token: null } },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let token: string | null = "pending";
    await act(async () => {
      token = await result.current.getValidAccessToken();
    });
    expect(token).toBeNull();
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

  it("getValidAccessToken falls back to existing token when refresh fails", async () => {
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
      data: { session: null },
      error: { message: "refresh failed" },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    let token: string | null = null;
    await act(async () => {
      token = await result.current.getValidAccessToken();
    });
    expect(token).toBe("old");
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
      data: { patient_code: "NA-000042" },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.patientCode).toBe("NA-000042"));
    expect(supabaseFromMock).toHaveBeenCalledWith("patients");
  });

  it("sets patientCode to null when patients query returns error", async () => {
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
      data: null,
      error: { message: "not found" },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.patientCode).toBeNull());
  });

  it("signOut clears session and patientCode", async () => {
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
      data: { patient_code: "NA-000001" },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.patientCode).toBe("NA-000001"));

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.patientCode).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });
});
