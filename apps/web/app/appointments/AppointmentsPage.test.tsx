import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

import AppointmentsPage from "./page";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    getAppointments: vi.fn().mockResolvedValue({ appointments: [] }),
    getClinics: vi.fn().mockResolvedValue({
      clinics: [
        {
          id: "c1",
          name: "Lagos General Hospital",
          address: "1 Example St",
          city: "Lagos",
          state: "Lagos",
          phone: "08000000000",
          specialties: ["general"],
          facility_type: "hospital",
          accepts_telemedicine: true,
          hours: "24/7",
        },
      ],
      total: 1,
    }),
    createAppointment: vi.fn().mockResolvedValue({
      id: "a1",
      user_id: "u1",
      clinic_name: "Lagos General Hospital",
      clinic_id: "c1",
      specialty: "general",
      appointment_type: "in_person",
      reason: "Checkup",
      preferred_date: "2025-01-01",
      preferred_time: "10:00",
      status: "requested",
      severity: null,
      referral_agent: null,
      notes: "",
      created_at: "",
      updated_at: "",
    }),
  };
});

describe("AppointmentsPage", () => {
  it("renders tabs and loads clinics list", async () => {
    renderWithProviders(<AppointmentsPage />);

    fireEvent.click(screen.getByRole("tab", { name: /find a clinic/i }));

    await waitFor(() =>
      expect(screen.getByText(/lagos general hospital/i)).toBeInTheDocument(),
    );
  });
});

