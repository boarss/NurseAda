/**
 * Client-side API helpers for NurseAda gateway.
 * Set NEXT_PUBLIC_GATEWAY_URL in .env (e.g. http://localhost:8000).
 */

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "";

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${GATEWAY_URL}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ChatOptions = {
  patientId?: string | null;
  imageBase64?: string | null;
};

export async function sendChatMessage(
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<{ reply: string }> {
  const body: Record<string, unknown> = { messages };
  if (options?.patientId) body.patient_id = options.patientId;
  if (options?.imageBase64) body.image_base64 = options.imageBase64;
  const res = await fetch(`${GATEWAY_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = "Chat request failed";
    try {
      const body = text ? JSON.parse(text) : {};
      if (body.detail) msg = typeof body.detail === "string" ? body.detail : body.detail[0]?.msg ?? msg;
      else if (body.message) msg = body.message;
    } catch {
      if (res.status === 404) msg = "Gateway not found. Ensure the gateway is running.";
      else if (res.status >= 500) msg = "Server error. Please try again shortly.";
    }
    throw new Error(msg);
  }
  return text ? JSON.parse(text) : { reply: "" };
}

export type PatientSummary = {
  resourceType: string;
  id?: string;
  name?: Array<{ given?: string[]; family?: string }>;
  birthDate?: string;
  gender?: string;
};

export async function getPatient(patientId: string): Promise<PatientSummary> {
  const res = await fetch(`${GATEWAY_URL}/patient/${patientId}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("Patient not found");
    if (res.status === 503) throw new Error("Patient data is not configured");
    throw new Error("Failed to fetch patient");
  }
  return res.json();
}
