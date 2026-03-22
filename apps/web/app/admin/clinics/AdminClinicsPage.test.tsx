import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdminClinicsPage from "./page";
import { renderWithProviders } from "@/test/renderWithProviders";
import * as AuthContext from "@/lib/AuthContext";
import * as api from "@/lib/api";

describe("AdminClinicsPage", () => {
  const useAuthSpy = vi.spyOn(AuthContext, "useAuth");
  const apiFetchSpy = vi.spyOn(api, "apiFetch").mockResolvedValue({
    clinics: [
      {
        id: "c1",
        name: "Test Clinic",
        address: "1 St",
        city: "Lagos",
        state: "Lagos",
        specialties: ["general"],
        facility_type: "clinic",
        accepts_telemedicine: true,
      },
    ],
  });

  afterEach(() => {
    useAuthSpy.mockRestore();
    apiFetchSpy.mockRestore();
  });

  it("loads clinics when signed in", async () => {
    useAuthSpy.mockReturnValue({
      session: null,
      user: { id: "u1", email: "a@b.com" } as import("@supabase/supabase-js").User,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      accessToken: "tok",
      getValidAccessToken: vi.fn().mockResolvedValue("tok"),
      patientCode: null,
    });

    renderWithProviders(<AdminClinicsPage />);

    await waitFor(() => expect(apiFetchSpy).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText(/test clinic/i)).toBeInTheDocument());
  });
});
