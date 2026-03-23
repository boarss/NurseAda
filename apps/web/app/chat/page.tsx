"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { sendChatMessage, sendFeedback, sendMedicalFeedbackWithSource } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useLocale } from "@/lib/IntlProvider";
import { LanguagePicker } from "@/components/LanguagePicker";

function MessageContent({ text }: { text: string }) {
  // Split disclaimer (common suffix) for visual separation
  const disclaimerMatch = text.match(
    /\n\n(?:This is (?:general information|not a substitute)|Consult a healthcare)[\s\S]+$/
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

type ChatMsg = {
  role: "user" | "assistant";
  text: string;
  imageDataUrl?: string | null;
};

export default function ChatPage() {
  const t = useTranslations();
  const { user, signOut, getValidAccessToken, patientCode } = useAuth();
  const { locale } = useLocale();
  const [message, setMessage] = useState("");
  const [dismissedAuthNudge, setDismissedAuthNudge] = useState(false);

  const suggestedPrompts = [
    t("chat.promptHeadache"),
    t("chat.promptFever"),
    t("chat.promptDrugCombo"),
    t("chat.promptCough"),
    t("chat.promptDka"),
    t("chat.promptXray"),
    t("chat.promptHerbalNausea"),
    t("chat.promptJointPain"),
    t("chat.promptPregnancy"),
    t("chat.promptClinic"),
    t("chat.promptAppointment"),
  ];
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [lastReplyIndex, setLastReplyIndex] = useState<number | null>(null);
  const [feedbackSourceUrl, setFeedbackSourceUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userText = message.trim() || (imageBase64 ? t("chat.analyzeImage") : "");
    if (!userText || loading) return;
    const imageToSend = imageBase64;
    const imagePreview = imageDataUrl;
    setMessage("");
    setError(null);
    setImageBase64(null);
    setImageDataUrl(null);
    setMessages((prev) => [
      ...prev,
      { role: "user", text: userText, imageDataUrl: imagePreview },
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
      const token = await getValidAccessToken();
      const { reply } = await sendChatMessage(nextMessages, {
        imageBase64: imageToSend || undefined,
        token: token ?? undefined,
        locale,
      });
      setMessages((prev) => {
        const next = [...prev, { role: "assistant", text: reply } as ChatMsg];
        setLastReplyIndex(next.length - 1);
        setFeedbackSourceUrl("");
        return next;
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: t("chat.serverError") } as ChatMsg,
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setMessage(prompt);
  };

  const submitReplyFeedback = useCallback(
    async (rating: number) => {
      const tok = await getValidAccessToken();
      const ref = feedbackSourceUrl.trim();
      try {
        if (user && ref) {
          if (!tok) {
            toast.error(t("chat.medicalSourceHint"));
            return;
          }
          await sendMedicalFeedbackWithSource({
            sourceUrl: ref,
            rating,
            token: tok,
          });
          toast.success(t("chat.feedbackWithSourceThanks"));
        } else {
          await sendFeedback({ rating, token: tok ?? undefined });
        }
        setFeedbackSourceUrl("");
        setLastReplyIndex(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("common.error"));
      }
    },
    [user, feedbackSourceUrl, getValidAccessToken, t]
  );

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageDataUrl(result);
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <main className="min-h-screen flex flex-col max-w-2xl mx-auto w-full">
      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-2 sm:gap-4 px-4 py-3 bg-bg/90 backdrop-blur-md border-b border-border">
        <Link
          href="/"
          className="rounded-lg p-2 -ml-2 text-muted hover:text-fg hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg"
          aria-label={t("common.backToHome")}
        >
          <span className="font-body font-medium">&larr;</span>
        </Link>
        <h1 className="font-display text-xl font-semibold text-fg">
          {t("chat.title")}
        </h1>
        <Link
          href="/remedies"
          className="rounded-card border border-border bg-surface px-2.5 py-1.5 text-xs text-primary hover:bg-primary/10 font-body font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          title="Browse herbal remedies"
        >
          {t("chat.remedies")}
        </Link>
        <Link
          href="/medications"
          className="rounded-card border border-border bg-surface px-2.5 py-1.5 text-xs text-primary hover:bg-primary/10 font-body font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          title="Medication reminders and interactions"
        >
          {t("chat.medications")}
        </Link>
        <Link
          href="/appointments"
          className="rounded-card border border-border bg-surface px-2.5 py-1.5 text-xs text-primary hover:bg-primary/10 font-body font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          title="Find clinics and book appointments"
        >
          {t("chat.appointments")}
        </Link>
        <LanguagePicker />
        <div className="ml-auto flex items-center gap-2">
          {!user && (
            <span className="text-xs text-muted font-body">{t("common.guest")}</span>
          )}
          {user ? (
            <>
              <Link
                href="/profile"
                className="hidden sm:inline rounded-card border border-border bg-surface px-2 py-1.5 text-xs text-muted hover:text-fg hover:bg-surface/80 font-body transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                title={`${t("chat.yourPatientId")}: ${patientCode ?? "—"}`}
              >
                {t("common.profile")}
                {patientCode ? (
                  <>
                    {": "}
                    <span className="text-fg font-semibold">{patientCode}</span>
                  </>
                ) : null}
              </Link>
              <span className="hidden sm:inline text-xs text-muted font-body truncate max-w-[120px]">
                {user.email}
              </span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-card border border-border bg-surface px-2 py-1.5 text-xs text-muted hover:text-fg font-body transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {t("common.signOut")}
              </button>
            </>
          ) : (
            <Link
              href="/auth/sign-in"
              className="rounded-card bg-primary text-white px-3 py-1.5 text-xs font-body font-medium transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {t("common.signIn")}
            </Link>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {!user && messages.length > 0 && !dismissedAuthNudge && (
          <div
            className="mb-4 rounded-card border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-body text-fg flex flex-wrap items-center gap-3"
            role="status"
          >
            <div className="flex-1 min-w-[180px]">
              <p className="font-semibold text-primary">
                {t("chat.authBannerTitle")}
              </p>
              <p className="text-xs text-muted mt-0.5">
                {t("chat.authBannerBody")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/auth/sign-up"
                className="rounded-card bg-primary text-white px-3 py-1.5 text-xs font-body font-semibold hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {t("common.signUp")}
              </Link>
              <Link
                href="/auth/sign-in"
                className="rounded-card border border-border bg-surface px-3 py-1.5 text-xs font-body text-muted hover:text-fg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {t("common.signIn")}
              </Link>
              <button
                type="button"
                onClick={() => setDismissedAuthNudge(true)}
                className="text-xs text-muted hover:text-fg px-1 py-1 focus:outline-none focus:ring-2 focus:ring-primary rounded-card"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        )}
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
              {t("chat.emptyState")}
            </p>
            <div>
              <p className="font-body text-muted text-xs mb-2">
                {t("chat.tryThese")}
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="rounded-card border border-border bg-surface hover:bg-bubble-assistant/50 text-fg px-3 py-2.5 min-h-[44px] text-sm font-body transition-transform duration-fast ease-out-expo focus:outline-none focus:ring-2 focus:ring-primary active:scale-[0.98] touch-manipulation"
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
              style={{ animationDelay: `calc(var(--stagger-delay) * ${Math.min(i, 8)})` }}
            >
              {m.role === "user" ? (
                <div className="space-y-2">
                  {m.imageDataUrl && (
                    <img
                      src={m.imageDataUrl}
                      alt={t("chat.attachedMedicalImage")}
                      className="rounded-lg max-h-[160px] max-w-full object-contain border border-white/20"
                    />
                  )}
                  <p className="font-body text-[15px] leading-relaxed whitespace-pre-wrap">
                    {m.text}
                  </p>
                </div>
              ) : (
                <>
                  <MessageContent text={m.text} />
                  {lastReplyIndex === i && (
                    <div className="mt-2 space-y-2 text-xs text-muted">
                      {user ? (
                        <div className="space-y-1">
                          <label
                            htmlFor={`medical-feedback-source-${i}`}
                            className="block font-medium text-fg/80"
                          >
                            {t("chat.medicalSourceLabel")}
                          </label>
                          <input
                            id={`medical-feedback-source-${i}`}
                            type="url"
                            inputMode="url"
                            autoComplete="url"
                            placeholder={t("chat.medicalSourcePlaceholder")}
                            value={feedbackSourceUrl}
                            onChange={(e) => setFeedbackSourceUrl(e.target.value)}
                            className="w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-fg text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <p className="text-[11px] leading-snug text-muted">
                            {t("chat.medicalSourceHint")}
                          </p>
                        </div>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{t("chat.wasHelpful")}</span>
                        <button
                          type="button"
                          onClick={() => void submitReplyFeedback(1)}
                          className="rounded-full border border-border px-2 py-1 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                          aria-label="Thumbs up"
                        >
                          👍
                        </button>
                        <button
                          type="button"
                          onClick={() => void submitReplyFeedback(-1)}
                          className="rounded-full border border-border px-2 py-1 hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                          aria-label="Thumbs down"
                        >
                          👎
                        </button>
                      </div>
                    </div>
                  )}
                </>
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

      <div className="sticky bottom-0 border-t border-border bg-bg/95 backdrop-blur-md p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {imageBase64 && (
          <div className="mb-2 flex items-center gap-3">
            {imageDataUrl && (
              <img
                src={imageDataUrl}
                alt={t("chat.preview")}
                className="h-14 w-14 rounded-lg object-cover border border-border"
              />
            )}
            <span className="text-sm text-muted font-body">{t("chat.imageAttached")}</span>
            <button
              type="button"
              onClick={() => { setImageBase64(null); setImageDataUrl(null); }}
              className="text-error text-sm hover:underline font-body"
            >
              {t("common.remove")}
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
            aria-label={t("chat.attachImage")}
          >
            📷
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("chat.placeholder")}
            className="flex-1 rounded-card border border-border bg-surface text-fg placeholder:text-muted px-4 py-3 font-body text-[15px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            aria-label={t("chat.placeholder")}
          />
          <button
            type="submit"
            disabled={loading || (!message.trim() && !imageBase64)}
            className="rounded-card bg-primary text-white font-body font-semibold px-5 py-3 min-h-[44px] min-w-[5rem] transition-transform duration-fast ease-out-expo hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg active:scale-[0.98] touch-manipulation"
          >
            {loading ? "…" : t("common.send")}
          </button>
        </form>
      </div>
    </main>
  );
}
