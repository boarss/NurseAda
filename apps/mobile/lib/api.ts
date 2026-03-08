/**
 * NurseAda gateway client for mobile.
 * Set EXPO_PUBLIC_GATEWAY_URL (e.g. http://10.0.2.2:8000 for Android emulator).
 */

const GATEWAY_URL = process.env.EXPO_PUBLIC_GATEWAY_URL ?? "";

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${GATEWAY_URL}/health`);
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
