"use client";

import { useState } from "react";
import Link from "next/link";
import { sendChatMessage } from "@/lib/api";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;
    const userText = message.trim();
    setMessage("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);
    try {
      const history = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.text,
      }));
      const nextMessages = [...history, { role: "user" as const, content: userText }];
      const { reply } = await sendChatMessage(nextMessages);
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I couldn’t reach the server. Check that the gateway is running at the URL in .env.local.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col max-w-2xl mx-auto w-full">
      {/* Header with back and title */}
      <header className="sticky top-0 z-10 flex items-center gap-4 px-4 py-3 bg-bg/90 backdrop-blur-md border-b border-border">
        <Link
          href="/"
          className="rounded-lg p-2 -ml-2 text-muted hover:text-fg hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg"
          aria-label="Back to home"
        >
          <span className="font-body font-medium">←</span>
        </Link>
        <h1 className="font-display text-xl font-semibold text-fg">
          Chat with NurseAda
        </h1>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {error && (
          <div
            className="mb-4 rounded-card border border-error/40 bg-error/10 px-4 py-3 text-sm text-error"
            role="alert"
          >
            {error}
          </div>
        )}
        {messages.length === 0 && !error && (
          <p className="font-body text-muted text-sm leading-relaxed max-w-md">
            Ask about symptoms, medications, or general health. This is not a
            substitute for professional care—in an emergency, seek help
            immediately.
          </p>
        )}
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`animate-bubble max-w-[85%] rounded-card px-4 py-3 ${
                m.role === "user"
                  ? "ml-auto bg-bubble-user text-white"
                  : "mr-auto bg-bubble-assistant text-fg"
              }`}
            >
              <p className="font-body text-[15px] leading-relaxed whitespace-pre-wrap">
                {m.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="sticky bottom-0 border-t border-border bg-bg/95 backdrop-blur-md p-4">
        <form
          onSubmit={handleSubmit}
          className="flex gap-3 items-end"
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-card border border-border bg-surface text-fg placeholder:text-muted px-4 py-3 font-body text-[15px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            aria-label="Chat message"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-card bg-primary text-white font-body font-semibold px-5 py-3 min-w-[5rem] transition-all duration-200 hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg active:scale-[0.98]"
          >
            {loading ? "…" : "Send"}
          </button>
        </form>
      </div>
    </main>
  );
}
