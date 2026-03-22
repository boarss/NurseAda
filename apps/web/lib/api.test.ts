import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  apiFetch,
  checkInteractions,
  createAppointment,
  createReminder,
  deleteAppointment,
  deleteReminder,
  getAppointments,
  getClinics,
  getHerbalCatalog,
  getReminders,
  healthCheck,
  sendChatMessage,
  sendFeedback,
  updateAppointment,
  updateReminder,
} from "./api";

function mockResponse(body: string, init: ResponseInit & { ok?: boolean } = {}) {
  const ok = init.ok ?? (init.status === undefined || (init.status >= 200 && init.status < 300));
  return new Response(body, { ...init, ok, status: init.status ?? 200 });
}

describe("api", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockClear();
    process.env.NEXT_PUBLIC_GATEWAY_URL = "http://gateway.test";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("apiFetch", () => {
    it("returns parsed JSON on success", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(JSON.stringify({ clinics: [{ id: "1" }] })));
      const out = await apiFetch<{ clinics: { id: string }[] }>("/admin/clinics", {
        token: "tok",
      });
      expect(out.clinics).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledWith(
        "http://gateway.test/admin/clinics",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer tok",
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("throws on 401", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse("", { status: 401, ok: false }));
      await expect(apiFetch("/x")).rejects.toThrow(/sign in/i);
    });

    it("uses detail from error JSON", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse(JSON.stringify({ detail: "Not allowed" }), { status: 403, ok: false }),
      );
      await expect(apiFetch("/x")).rejects.toThrow("Not allowed");
    });

    it("falls back for 5xx non-JSON body", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse("not json", { status: 502, ok: false }));
      await expect(apiFetch("/x")).rejects.toThrow(/server error/i);
    });
  });

  describe("healthCheck", () => {
    it("returns JSON when ok", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(JSON.stringify({ status: "healthy" })));
      await expect(healthCheck()).resolves.toEqual({ status: "healthy" });
      expect(fetchMock).toHaveBeenCalledWith("http://gateway.test/health", { cache: "no-store" });
    });

    it("throws when not ok", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse("", { status: 500, ok: false }));
      await expect(healthCheck()).rejects.toThrow(/health check failed/i);
    });
  });

  describe("sendChatMessage", () => {
    it("posts messages and optional fields", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse(JSON.stringify({ reply: "hi", clinical: null })),
      );
      const out = await sendChatMessage(
        [{ role: "user", content: "hello" }],
        {
          patientId: "p1",
          imageBase64: "abc",
          locale: "en",
          token: "t",
        },
      );
      expect(out.reply).toBe("hi");
      const [, init] = fetchMock.mock.calls[0];
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.messages).toEqual([{ role: "user", content: "hello" }]);
      expect(body.patient_id).toBe("p1");
      expect(body.image_base64).toBe("abc");
      expect(body.locale).toBe("en");
    });

    it("parses string detail on error", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse(JSON.stringify({ detail: "bad" }), { status: 400, ok: false }),
      );
      await expect(sendChatMessage([])).rejects.toThrow("bad");
    });

    it("parses validation detail array", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse(JSON.stringify({ detail: [{ msg: "invalid" }] }), {
          status: 422,
          ok: false,
        }),
      );
      await expect(sendChatMessage([])).rejects.toThrow("invalid");
    });

    it("maps status codes when body is not JSON", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse("x", { status: 404, ok: false }));
      await expect(sendChatMessage([])).rejects.toThrow(/gateway not found/i);
    });
  });

  describe("getHerbalCatalog", () => {
    it("returns catalog", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse(JSON.stringify({ items: [], total: 0 })),
      );
      await expect(getHerbalCatalog()).resolves.toEqual({ items: [], total: 0 });
    });

    it("503 message", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse("", { status: 503, ok: false }));
      await expect(getHerbalCatalog()).rejects.toThrow(/not configured/i);
    });
  });

  describe("medication reminders", () => {
    it("getReminders 401", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse("", { status: 401, ok: false }));
      await expect(getReminders("t")).rejects.toThrow(/sign in/i);
    });

    it("createReminder success", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(JSON.stringify({ id: "r1" })));
      const r = await createReminder({ medication_name: "Aspirin" }, "t");
      expect(r).toEqual({ id: "r1" });
    });

    it("updateReminder 404", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse("", { status: 404, ok: false }));
      await expect(updateReminder("id", {}, "t")).rejects.toThrow(/not found/i);
    });

    it("deleteReminder success", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(""));
      await expect(deleteReminder("id", "t")).resolves.toBeUndefined();
    });
  });

  describe("checkInteractions", () => {
    it("posts drug list", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(JSON.stringify({ interactions: [] })));
      await expect(checkInteractions(["a", "b"])).resolves.toEqual({ interactions: [] });
      const [url, init] = fetchMock.mock.calls[0];
      expect(String(url)).toContain("/medications/check-interactions");
      expect(JSON.parse((init as RequestInit).body as string)).toEqual({ drugs: ["a", "b"] });
    });
  });

  describe("clinics & appointments", () => {
    it("getClinics builds query string", async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse(JSON.stringify({ clinics: [], total: 0 })),
      );
      await getClinics({ state: "Lagos", specialty: "general", type: "clinic", q: "foo" });
      expect(String(fetchMock.mock.calls[0][0])).toContain("state=Lagos");
      expect(String(fetchMock.mock.calls[0][0])).toContain("specialty=general");
      expect(String(fetchMock.mock.calls[0][0])).toContain("type=clinic");
      expect(String(fetchMock.mock.calls[0][0])).toContain("q=foo");
    });

    it("getAppointments 503", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse("", { status: 503, ok: false }));
      await expect(getAppointments("t")).rejects.toThrow(/not configured/i);
    });

    it("createAppointment 401", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse("", { status: 401, ok: false }));
      await expect(createAppointment({ clinic_name: "X" }, "t")).rejects.toThrow(/sign in/i);
    });

    it("updateAppointment throws on failure", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse("", { status: 500, ok: false }));
      await expect(updateAppointment("1", {}, "t")).rejects.toThrow(/failed to update/i);
    });

    it("deleteAppointment 404", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse("", { status: 404, ok: false }));
      await expect(deleteAppointment("1", "t")).rejects.toThrow(/not found/i);
    });
  });

  describe("sendFeedback", () => {
    it("POSTs mapped body", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(""));
      await sendFeedback({
        conversationId: "c",
        messageId: "m",
        agentId: "a",
        rating: 5,
        comment: "ok",
        token: "t",
      });
      const [, init] = fetchMock.mock.calls[0];
      expect(JSON.parse((init as RequestInit).body as string)).toEqual({
        conversation_id: "c",
        message_id: "m",
        agent_id: "a",
        rating: 5,
        comment: "ok",
      });
    });
  });
});
