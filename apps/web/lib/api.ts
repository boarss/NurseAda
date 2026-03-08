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

export async function sendChatMessage(
  messages: ChatMessage[]
): Promise<{ reply: string }> {
  const res = await fetch(`${GATEWAY_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error("Chat request failed");
  return res.json();
}
