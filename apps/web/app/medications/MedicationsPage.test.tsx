import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

import MedicationsPage from "./page";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    getReminders: vi.fn().mockResolvedValue({ reminders: [] }),
    createReminder: vi.fn().mockResolvedValue({
      id: "1",
      user_id: "u1",
      medication_name: "Metformin",
      dosage: "500 mg",
      frequency: "daily",
      reminder_times: ["08:00"],
      start_date: "2024-01-01",
      end_date: null,
      is_active: true,
      notes: "",
      created_at: "",
      updated_at: "",
    }),
    checkInteractions: vi.fn().mockResolvedValue({
      interactions: [],
      warnings: ["aspirin + ibuprofen: increased bleeding risk"],
    }),
  };
});

describe("MedicationsPage", () => {
  it("renders tabs for reminders and interactions", () => {
    renderWithProviders(<MedicationsPage />);
    expect(screen.getByText(/my reminders/i)).toBeInTheDocument();
    expect(screen.getByText(/interaction checker/i)).toBeInTheDocument();
  });

  it("shows interaction checker result badge for warnings", async () => {
    renderWithProviders(<MedicationsPage />);
    fireEvent.click(screen.getByRole("tab", { name: /interaction checker/i }));

    const input = screen.getByLabelText(/check if your medicines/i);
    fireEvent.change(input, { target: { value: "aspirin" } });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    fireEvent.change(input, { target: { value: "ibuprofen" } });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    fireEvent.click(screen.getByRole("button", { name: /check interactions/i }));

    await waitFor(() =>
      expect(screen.getByText(/bleeding risk/i)).toBeInTheDocument(),
    );
  });
});

