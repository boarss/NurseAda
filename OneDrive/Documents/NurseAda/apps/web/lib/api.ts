import type { ChatRequest, ChatResponse } from "@nurseada/shared-ts/types";

const DEFAULT_BASE = "http://localhost:8000";
const REQUEST_TIMEOUT_MS = 25_000;

export function getApiBase(): string {
  if (typeof window !== "undefined") {
    return (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_BASE).trim() || DEFAULT_BASE;
  }
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_BASE).trim() || DEFAULT_BASE;
}

export type HealthStatus = "ok" | "unreachable" | "timeout";

export async function checkHealth(): Promise<HealthStatus> {
  const base = getApiBase();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${base}/health`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (res.ok) return "ok";
    return "unreachable";
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof Error && e.name === "AbortError") return "timeout";
    return "unreachable";
  }
}

export async function sendChat(req: ChatRequest): Promise<ChatResponse> {
  const base = getApiBase();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(res.status === 502 ? "Service temporarily unavailable. Please try again." : text || "Request failed.");
    }
    return (await res.json()) as ChatResponse;
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof Error) {
      if (e.name === "AbortError") throw new Error("Request took too long. Please try again.");
      throw e;
    }
    throw new Error("Unable to reach NurseAda. Please check your connection and try again.");
  }
}

export type InteractionPair = { drugA: string; drugB: string; severity: string; message: string };
export type CheckInteractionsResult = {
  hasInteraction: boolean;
  severity: string;
  pairs: InteractionPair[];
};

export async function checkInteractions(drugNames: string[]): Promise<CheckInteractionsResult> {
  const base = getApiBase();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(`${base}/medications/check-interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drugNames }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error("Could not check interactions. Try again.");
    return (await res.json()) as CheckInteractionsResult;
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof Error) throw e;
    throw new Error("Could not check interactions.");
  }
}

export type Reminder = { id: string; medicationName: string; time: string; dosage: string | null };

export async function getReminders(): Promise<Reminder[]> {
  const base = getApiBase();
  const res = await fetch(`${base}/medications/reminders`, { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load reminders.");
  const data = (await res.json()) as { reminders: Reminder[] };
  return data.reminders;
}

export async function addReminder(medicationName: string, time: string, dosage?: string): Promise<Reminder> {
  const base = getApiBase();
  const res = await fetch(`${base}/medications/reminders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ medicationName, time, dosage: dosage ?? null }),
  });
  if (!res.ok) throw new Error("Could not add reminder.");
  return (await res.json()) as Reminder;
}

export async function deleteReminder(id: string): Promise<void> {
  const base = getApiBase();
  const res = await fetch(`${base}/medications/reminders/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Could not delete reminder.");
}
