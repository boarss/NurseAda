"use client";

import { useState } from "react";
import type { ChatMessage } from "@nurseada/shared-ts/types";
import { EmergencyBanner } from "../common/EmergencyBanner";
import { sendChat } from "../../lib/api";

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    const userMessage: ChatMessage = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await sendChat({ messages: nextMessages, locale: "en", country: "NG" });
      setMessages([...nextMessages, res.message]);
      setEmergency(res.safety.emergency);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }
    setLoading(false);
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-3">
      <EmergencyBanner show={emergency} />
      <div className="flex-1 space-y-2 overflow-y-auto rounded-md border border-slate-800 bg-slate-900/60 p-3 text-sm">
        {messages.length === 0 && (
          <p className="text-xs text-slate-400">
            Ask about a symptom, medication, or health concern in your own words. I’ll respond with cautious,
            Africa-aware guidance.
          </p>
        )}
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-slate-800 text-slate-50"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl bg-slate-800 px-3 py-2 text-xs text-slate-400" aria-busy="true">
              NurseAda is thinking...
            </div>
          </div>
        )}
        {error && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-red-300">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="w-fit rounded-full border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question here..."
          className="flex-1 rounded-full border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-50 outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-medium text-slate-950 disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Send"}
        </button>
      </form>
    </div>
  );
}

