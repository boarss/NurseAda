import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Integration: real `fetch` against a local HTTP server (no mocked `global.fetch`).
 * Validates `lib/api` URL building, headers, and JSON parsing for the Expo client.
 *
 * `lib/api` reads `EXPO_PUBLIC_GATEWAY_URL` at module load — import the module only
 * after the env var is set in `beforeAll`.
 */
function startMinimalGateway(): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = req.url ?? "";

      if (req.method === "GET" && url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "healthy" }));
        return;
      }

      if (req.method === "GET" && url.startsWith("/herbal/catalog")) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            items: [
              {
                text: "Zobo (hibiscus) tea",
                source: "seed",
                condition: "general",
                evidence_level: "B",
                evidence_label: "Moderate",
                contraindications: [],
                keywords: ["hydration"],
              },
            ],
            total: 1,
          }),
        );
        return;
      }

      if (req.method === "GET" && url.startsWith("/appointments/clinics")) {
        if (!url.includes("state=Lagos")) {
          res.writeHead(400);
          res.end();
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            clinics: [
              {
                id: "stub-1",
                name: "Integration Clinic",
                address: "1 Test Road",
                city: "Lagos",
                state: "Lagos",
                phone: "08000000000",
                specialties: ["general"],
                facility_type: "clinic",
                accepts_telemedicine: true,
                hours: "08:00–18:00",
              },
            ],
            total: 1,
          }),
        );
        return;
      }

      if (req.method === "POST" && url === "/chat") {
        let body = "";
        req.on("data", (c) => {
          body += c;
        });
        req.on("end", () => {
          const auth = req.headers.authorization;
          if (auth !== "Bearer test-token") {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ detail: "unauthorized" }));
            return;
          }
          try {
            const parsed = JSON.parse(body || "{}") as { messages?: unknown[] };
            if (!Array.isArray(parsed.messages) || parsed.messages.length === 0) {
              res.writeHead(400);
              res.end();
              return;
            }
          } catch {
            res.writeHead(400);
            res.end();
            return;
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ reply: "integration-reply" }));
        });
        return;
      }

      if (req.method === "GET" && /^\/patient\/[^/]+$/.test(url.split("?")[0] ?? "")) {
        const auth = req.headers.authorization;
        if (auth !== "Bearer pat-token") {
          res.writeHead(401);
          res.end();
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            resourceType: "Patient",
            id: "fhir-1",
            name: [{ given: ["Test"], family: "User" }],
            birthDate: "1990-01-01",
            gender: "female",
          }),
        );
        return;
      }

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ detail: "not found" }));
    });

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address() as AddressInfo;
      resolve({
        baseUrl: `http://127.0.0.1:${addr.port}`,
        close: () =>
          new Promise<void>((res, rej) => {
            server.close((err) => (err ? rej(err) : res()));
          }),
      });
    });
  });
}

describe("gateway client (integration, mobile)", () => {
  let baseUrl: string;
  let closeServer: () => Promise<void>;
  const prevGateway = process.env.EXPO_PUBLIC_GATEWAY_URL;

  let healthCheck: typeof import("../../lib/api").healthCheck;
  let getHerbalCatalog: typeof import("../../lib/api").getHerbalCatalog;
  let getClinics: typeof import("../../lib/api").getClinics;
  let sendChatMessage: typeof import("../../lib/api").sendChatMessage;
  let getPatient: typeof import("../../lib/api").getPatient;

  beforeAll(async () => {
    const s = await startMinimalGateway();
    baseUrl = s.baseUrl;
    closeServer = s.close;
    process.env.EXPO_PUBLIC_GATEWAY_URL = baseUrl;
    const api = await import("../../lib/api");
    healthCheck = api.healthCheck;
    getHerbalCatalog = api.getHerbalCatalog;
    getClinics = api.getClinics;
    sendChatMessage = api.sendChatMessage;
    getPatient = api.getPatient;
  });

  afterAll(async () => {
    await closeServer();
    process.env.EXPO_PUBLIC_GATEWAY_URL = prevGateway;
  });

  it("healthCheck talks to real server", async () => {
    await expect(healthCheck()).resolves.toEqual({ status: "healthy" });
  });

  it("getHerbalCatalog parses catalog JSON", async () => {
    const out = await getHerbalCatalog();
    expect(out.total).toBe(1);
    expect(out.items[0]?.text).toMatch(/zobo/i);
  });

  it("getClinics sends query string and parses clinics", async () => {
    const out = await getClinics({ state: "Lagos" });
    expect(out.total).toBe(1);
    expect(out.clinics[0]?.name).toBe("Integration Clinic");
  });

  it("sendChatMessage posts messages and Authorization header", async () => {
    const out = await sendChatMessage([{ role: "user", content: "Hello" }], {
      token: "test-token",
    });
    expect(out.reply).toBe("integration-reply");
  });

  it("getPatient sends Bearer token and parses Patient JSON", async () => {
    const patient = await getPatient("fhir-1", "pat-token");
    expect(patient.resourceType).toBe("Patient");
    expect(patient.id).toBe("fhir-1");
    expect(patient.name?.[0]?.family).toBe("User");
  });
});
