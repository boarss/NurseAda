import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getClinics, getHerbalCatalog, healthCheck } from "@/lib/api";

/**
 * Integration: real `fetch` against a local HTTP server (no mocked `global.fetch`).
 * Validates `lib/api` URL building, headers, and response parsing against wire-format JSON.
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

describe("gateway client (integration)", () => {
  let baseUrl: string;
  let closeServer: () => Promise<void>;
  const prevGateway = process.env.NEXT_PUBLIC_GATEWAY_URL;

  beforeAll(async () => {
    const s = await startMinimalGateway();
    baseUrl = s.baseUrl;
    closeServer = s.close;
    process.env.NEXT_PUBLIC_GATEWAY_URL = baseUrl;
  });

  afterAll(async () => {
    await closeServer();
    process.env.NEXT_PUBLIC_GATEWAY_URL = prevGateway;
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
});
