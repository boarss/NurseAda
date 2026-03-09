"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { sendChatMessage } from "@/lib/api";

const SUGGESTED_PROMPTS = [
  "I have a headache",
  "I feel feverish and tired",
  "Can I take paracetamol with ibuprofen?",
  "What should I do for a cough?",
  "I have ketones and high blood sugar",
  "What is DKA?",
  "Analyze this X-ray image",
  "Any herbal remedies for nausea?",
];

function MessageContent({ text }: { text: string }) {
  // Split disclaimer (common suffix) for visual separation
  const disclaimerMatch = text.match(
    /\n\n(?:This is (?:general information|not a substitute)|Consult a healthcare).+$/s
  );
  const mainText = disclaimerMatch ? text.slice(0, disclaimerMatch.index) : text;
  const disclaimer = disclaimerMatch ? disclaimerMatch[0].trim() : null;

  // Simple **bold** and • list rendering
  const renderInline = (s: string) => {
    const parts: React.ReactNode[] = [];
    let last = 0;
    const re = /\*\*([^*]+)\*\*/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s)) !== null) {
      parts.push(s.slice(last, m.index));
      parts.push(<strong key={m.index}>{m[1]}</strong>);
      last = m.index + m[0].length;
    }
    parts.push(s.slice(last));
    return parts;
  };

  const lines = mainText.split("\n").filter((l) => l.trim());
  const elements: React.ReactNode[] = [];
  let idx = 0;
  let key = 0;
  while (idx < lines.length) {
    const line = lines[idx];
    const trimmed = line.trim();
    if (trimmed.startsWith("•")) {
      const bullets: string[] = [];
      while (idx < lines.length && lines[idx].trim().startsWith("•")) {
        bullets.push(lines[idx].trim().slice(1).trim());
        idx++;
      }
      elements.push(
        <ul key={key++} className="list-disc list-inside pl-1 space-y-0.5 my-2">
          {bullets.map((b, j) => (
            <li key={j}>{renderInline(b)}</li>
          ))}
        </ul>
      );
      continue;
    }
    elements.push(
      <p key={key++} className="whitespace-pre-wrap my-1">
        {renderInline(line)}
      </p>
    );
    idx++;
  }

  return (
    <div className="font-body text-[15px] leading-relaxed space-y-1">
      {elements}
      {disclaimer && (
        <p className="text-muted text-sm mt-3 pt-3 border-t border-border/60">
          {disclaimer}
        </p>
      )}
    </div>
  );
}

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; text: string; hadImage?: boolean }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientId, setPatientId] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userText = message.trim() || (imageBase64 ? "Analyze this image" : "");
    if (!userText || loading) return;
    const imageToSend = imageBase64;
    setMessage("");
    setError(null);
    setImageBase64(null);
    setMessages((prev) => [
      ...prev,
      { role: "user", text: userText, hadImage: !!imageToSend },
    ]);
    setLoading(true);
    try {
      const history = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.text,
      }));
      const nextMessages = [
        ...history,
        { role: "user" as const, content: userText },
      ];
      const { reply } = await sendChatMessage(nextMessages, {
        patientId: patientId || undefined,
        imageBase64: imageToSend || undefined,
      });
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I couldn't reach the server. Check that the gateway is running and the URL in .env.local is correct.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setMessage(prompt);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <main className="min-h-screen flex flex-col max-w-2xl mx-auto w-full">
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
        <div className="ml-auto flex items-center gap-2">
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="Patient ID (optional)"
            className="w-28 rounded-card border border-border bg-surface text-fg placeholder:text-muted px-2 py-1.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Patient ID for EHR context"
          />
        </div>
      </header>

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
          <div className="space-y-4">
            <p className="font-body text-muted text-sm leading-relaxed max-w-md">
              Describe your symptoms, ask about medications, or get general
              health guidance. In an emergency, call 112 or seek care
              immediately.
            </p>
            <div>
              <p className="font-body text-muted text-xs mb-2">
                Try one of these:
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="rounded-card border border-border bg-surface hover:bg-bubble-assistant/50 text-fg px-3 py-2 text-sm font-body transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
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
              {m.role === "user" ? (
                <div className="space-y-2">
                  <p className="font-body text-[15px] leading-relaxed whitespace-pre-wrap">
                    {m.text}
                  </p>
                  {m.hadImage && (
                    <p className="text-xs opacity-80">📷 Image attached</p>
                  )}
                </div>
              ) : (
                <MessageContent text={m.text} />
              )}
            </div>
          ))}
          {loading && (
            <div className="animate-bubble max-w-[85%] mr-auto rounded-card px-4 py-3 bg-bubble-assistant text-fg">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-primary/60 animate-pulse" />
                <span className="inline-block w-2 h-2 rounded-full bg-primary/60 animate-pulse [animation-delay:0.2s]" />
                <span className="inline-block w-2 h-2 rounded-full bg-primary/60 animate-pulse [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-border bg-bg/95 backdrop-blur-md p-4">
        {imageBase64 && (
          <div className="mb-2 flex items-center gap-2 text-sm text-muted">
            <span>📷 Image attached</span>
            <button
              type="button"
              onClick={() => setImageBase64(null)}
              className="text-error hover:underline"
            >
              Remove
            </button>
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="flex gap-3 items-end"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            aria-hidden
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-card border border-border bg-surface p-3 text-muted hover:text-fg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Attach image"
          >
            📷
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your symptoms or ask a health question..."
            className="flex-1 rounded-card border border-border bg-surface text-fg placeholder:text-muted px-4 py-3 font-body text-[15px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            aria-label="Chat message"
          />
          <button
            type="submit"
            disabled={loading || (!message.trim() && !imageBase64)}
            className="rounded-card bg-primary text-white font-body font-semibold px-5 py-3 min-w-[5rem] transition-all duration-200 hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg active:scale-[0.98]"
          >
            {loading ? "…" : "Send"}
          </button>
        </form>
      </div>
    </main>
  );
}
