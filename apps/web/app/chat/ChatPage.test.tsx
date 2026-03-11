import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import ChatPage from "./page";
import { renderWithProviders } from "@/test/renderWithProviders";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    sendChatMessage: vi.fn().mockResolvedValue({
      reply:
        "Here is some guidance.\n\nThis is not a substitute for professional medical advice. Please consult a healthcare provider for diagnosis and treatment. In an emergency, seek care immediately.",
    }),
    getPatient: vi.fn().mockResolvedValue({
      resourceType: "Patient",
      id: "123",
      name: [{ given: ["Test"], family: "User" }],
      birthDate: "1990-01-01",
      gender: "female",
    }),
  };
});

describe("ChatPage", () => {
  it("renders suggested prompts on empty state", () => {
    renderWithProviders(<ChatPage />);
    expect(screen.getByText(/headache/i)).toBeInTheDocument();
    expect(screen.getByText(/fever/i)).toBeInTheDocument();
  });

  it("submits a message and renders disclaimer block from assistant reply", async () => {
    renderWithProviders(<ChatPage />);

    const input = screen.getByLabelText(/describe your symptoms/i);
    fireEvent.change(input, { target: { value: "I have a headache" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/this is not a substitute for professional medical advice/i),
      ).toBeInTheDocument(),
    );
  });
});

