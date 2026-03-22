"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  checkInteractions,
  type MedicationReminder,
  type InteractionCheckResponse,
} from "@/lib/api";

const SEVERITY_STYLES: Record<string, string> = {
  high: "border-error bg-error/5 text-error",
  medium: "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
  low: "border-border bg-surface text-muted",
};

function nextReminderTime(times: string[]): string | null {
  if (!times.length) return null;
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return times.find((t) => t > hhmm) ?? times[0];
}

// ── Reminder Card ────────────────────────────────────────────────────

function ReminderCard({
  reminder,
  onToggle,
  onDelete,
}: {
  reminder: MedicationReminder;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations();
  const frequencyOptions = [
    { value: "daily", label: t("medications.onceDaily") },
    { value: "twice_daily", label: t("medications.twiceDaily") },
    { value: "three_daily", label: t("medications.threeDaily") },
    { value: "weekly", label: t("medications.weekly") },
    { value: "custom", label: t("medications.custom") },
  ];
  const frequencyLabel = frequencyOptions.find((o) => o.value === reminder.frequency)?.label ?? reminder.frequency;
  const nextTime = nextReminderTime(reminder.reminder_times);
  return (
    <div
      className={`rounded-card border bg-surface shadow-card transition-all ${
        reminder.is_active ? "border-border" : "border-border/50 opacity-60"
      }`}
    >
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold text-fg leading-snug">
            {reminder.medication_name}
          </h3>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted font-body">
            {reminder.dosage && <span>{reminder.dosage}</span>}
            <span>{frequencyLabel}</span>
            {nextTime && <span>{t("medications.next", { time: nextTime })}</span>}
          </div>
          {reminder.notes && (
            <p className="text-xs text-muted font-body mt-1.5 line-clamp-2">
              {reminder.notes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggle}
            className={`relative w-10 h-6 rounded-full transition-colors duration-fast ease-out-expo focus:outline-none focus:ring-2 focus:ring-primary ${
              reminder.is_active ? "bg-primary" : "bg-border"
            }`}
            aria-label={reminder.is_active ? t("medications.pauseReminder") : t("medications.resumeReminder")}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-fast ease-out-expo ${
                reminder.is_active ? "left-[18px]" : "left-0.5"
              }`}
            />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-1.5 text-muted hover:text-error hover:bg-error/10 transition-colors focus:outline-none focus:ring-2 focus:ring-error"
            aria-label={`${t("common.delete")} ${reminder.medication_name}`}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Reminder Form ────────────────────────────────────────────────

function AddReminderForm({
  onCreated,
  getAccessToken,
}: {
  onCreated: (r: MedicationReminder) => void;
  getAccessToken: () => Promise<string | null>;
}) {
  const t = useTranslations();
  const frequencyOptions = [
    { value: "daily", label: t("medications.onceDaily") },
    { value: "twice_daily", label: t("medications.twiceDaily") },
    { value: "three_daily", label: t("medications.threeDaily") },
    { value: "weekly", label: t("medications.weekly") },
    { value: "custom", label: t("medications.custom") },
  ];
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [times, setTimes] = useState(["08:00"]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setDosage("");
    setFrequency("daily");
    setTimes(["08:00"]);
    setNotes("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setError("Please sign in to continue.");
        return;
      }
      const created = await createReminder(
        {
          medication_name: name.trim(),
          dosage: dosage.trim(),
          frequency,
          reminder_times: times.filter(Boolean),
          notes: notes.trim(),
        },
        token
      );
      onCreated(created);
      reset();
      setOpen(false);
      toast.success(t("common.toastReminderSaved"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create reminder";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-card border-2 border-dashed border-border hover:border-primary/50 bg-surface/50 px-5 py-4 text-sm font-body text-muted hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {t("medications.addReminder")}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card border border-primary/30 bg-surface shadow-card px-5 py-5 space-y-4"
    >
      <h3 className="font-display text-base font-semibold text-fg">{t("medications.newReminder")}</h3>

      {error && (
        <p className="text-sm text-error font-body" role="alert">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="med-name" className="block text-xs font-body text-muted mb-1">
            {t("medications.medicationNameRequired")}
          </label>
          <input
            id="med-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("medications.medicationPlaceholder")}
            required
            className="w-full rounded-card border border-border bg-bg text-fg placeholder:text-muted px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="med-dosage" className="block text-xs font-body text-muted mb-1">
            {t("medications.dosage")}
          </label>
          <input
            id="med-dosage"
            type="text"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder={t("medications.dosagePlaceholder")}
            className="w-full rounded-card border border-border bg-bg text-fg placeholder:text-muted px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="med-freq" className="block text-xs font-body text-muted mb-1">
            {t("medications.frequency")}
          </label>
          <select
            id="med-freq"
            value={frequency}
            onChange={(e) => {
              setFrequency(e.target.value);
              const count = e.target.value === "twice_daily" ? 2 : e.target.value === "three_daily" ? 3 : 1;
              setTimes((prev) => {
                const next = [...prev];
                while (next.length < count) next.push("12:00");
                return next.slice(0, count);
              });
            }}
            className="w-full rounded-card border border-border bg-bg text-fg px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {frequencyOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-body text-muted mb-1">
            {t("medications.reminderTimes")}
          </label>
          <div className="flex gap-2 flex-wrap">
            {times.map((time, i) => (
              <input
                key={i}
                type="time"
                value={time}
                onChange={(e) =>
                  setTimes((prev) => prev.map((val, j) => (j === i ? e.target.value : val)))
                }
                className="rounded-card border border-border bg-bg text-fg px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="med-notes" className="block text-xs font-body text-muted mb-1">
          {t("medications.notes")}
        </label>
        <input
          id="med-notes"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("medications.notesPlaceholder")}
          className="w-full rounded-card border border-border bg-bg text-fg placeholder:text-muted px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="rounded-card bg-primary text-white font-body font-semibold px-5 py-2.5 text-sm transition-colors hover:bg-primary-hover disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg"
        >
          {saving ? t("common.saving") : t("medications.saveReminder")}
        </button>
        <button
          type="button"
          onClick={() => { reset(); setOpen(false); }}
          className="rounded-card border border-border bg-surface text-muted px-4 py-2.5 text-sm font-body hover:text-fg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}

// ── Interaction Checker ──────────────────────────────────────────────

function InteractionChecker() {
  const t = useTranslations();
  const [drugs, setDrugs] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<InteractionCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addDrug = () => {
    const d = input.trim();
    if (d && !drugs.includes(d)) {
      setDrugs((prev) => [...prev, d]);
      setInput("");
      setResult(null);
    }
  };

  const removeDrug = (i: number) => {
    setDrugs((prev) => prev.filter((_, j) => j !== i));
    setResult(null);
  };

  const handleCheck = async () => {
    if (drugs.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await checkInteractions(drugs);
      setResult(res);
      toast.success(t("common.toastInteractionDone"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Check failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="drug-input" className="block text-xs font-body text-muted mb-1.5">
          {t("medications.interactionLabel")}
        </label>
        <div className="flex gap-2">
          <input
            id="drug-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addDrug(); }
            }}
            placeholder={t("medications.interactionPlaceholder")}
            className="flex-1 rounded-card border border-border bg-bg text-fg placeholder:text-muted px-4 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={addDrug}
            disabled={!input.trim()}
            className="rounded-card bg-primary text-white px-4 py-2.5 text-sm font-body font-semibold transition-colors hover:bg-primary-hover disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {t("common.add")}
          </button>
        </div>
      </div>

      {drugs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {drugs.map((d, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary px-3 py-1 text-sm font-body"
            >
              {d}
              <button
                type="button"
                onClick={() => removeDrug(i)}
                className="hover:text-error transition-colors focus:outline-none"
                aria-label={`${t("common.remove")} ${d}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleCheck}
        disabled={drugs.length < 2 || loading}
        className="rounded-card bg-primary text-white font-body font-semibold px-6 py-3 text-sm transition-all hover:bg-primary-hover disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg"
      >
        {loading ? t("common.checking") : t("medications.checkInteractions")}
      </button>

      {error && (
        <div className="rounded-card border border-error/40 bg-error/10 px-4 py-3 text-sm text-error font-body" role="alert">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3 animate-in">
          {result.warnings && result.warnings.length > 0 ? (
            result.warnings.map((w, i) => {
              const severity =
                result.interactions?.[i]?.severity ?? "medium";
              const cls = SEVERITY_STYLES[severity] || SEVERITY_STYLES.medium;
              return (
                <div
                  key={i}
                  className={`rounded-card border-2 px-4 py-3 text-sm font-body ${cls}`}
                >
                  <span className="font-semibold capitalize mr-1.5">
                    {severity === "high" ? t("medications.highRisk") : severity === "medium" ? t("medications.caution") : t("medications.note")}:
                  </span>
                  {w}
                </div>
              );
            })
          ) : result.message ? (
            <p className="text-sm text-muted font-body">{result.message}</p>
          ) : (
            <div className="rounded-card border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary font-body">
              {t("medications.noInteractions")}
            </div>
          )}
        </div>
      )}

      {drugs.length < 2 && !result && (
        <p className="text-sm text-muted font-body">
          {t("medications.minTwoDrugs")}
        </p>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function MedicationsPage() {
  const t = useTranslations();
  const { user, getValidAccessToken, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"reminders" | "interactions">("reminders");
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReminders = useCallback(async () => {
    const token = await getValidAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getReminders(token);
      setReminders(data.reminders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  }, [getValidAccessToken]);

  useEffect(() => {
    if (tab === "reminders" && user && !authLoading) {
      loadReminders();
    }
  }, [tab, user, authLoading, loadReminders]);

  const handleToggle = async (r: MedicationReminder) => {
    try {
      const token = await getValidAccessToken();
      if (!token) {
        toast.error(t("common.error"));
        return;
      }
      await updateReminder(r.id, { is_active: !r.is_active }, token);
      setReminders((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, is_active: !x.is_active } : x))
      );
      toast.success(t("common.toastReminderSaved"));
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleDelete = async (r: MedicationReminder) => {
    try {
      const token = await getValidAccessToken();
      if (!token) {
        toast.error(t("common.error"));
        return;
      }
      await deleteReminder(r.id, token);
      setReminders((prev) => prev.filter((x) => x.id !== r.id));
      toast.success(t("common.toastReminderDeleted"));
    } catch {
      toast.error(t("common.error"));
    }
  };

  return (
    <main className="min-h-screen max-w-2xl mx-auto w-full px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/"
          className="rounded-lg p-2 -ml-2 text-muted hover:text-fg hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={t("common.backToHome")}
        >
          <span className="font-body font-medium">&larr;</span>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold text-fg">
            {t("medications.title")}
          </h1>
          <p className="text-sm text-muted font-body mt-0.5">
            {t("medications.subtitle")}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "reminders"}
          onClick={() => setTab("reminders")}
          className={`px-4 py-2.5 text-sm font-body font-medium transition-colors focus:outline-none ${
            tab === "reminders"
              ? "text-primary border-b-2 border-primary -mb-px"
              : "text-muted hover:text-fg"
          }`}
        >
          {t("medications.myReminders")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "interactions"}
          onClick={() => setTab("interactions")}
          className={`px-4 py-2.5 text-sm font-body font-medium transition-colors focus:outline-none ${
            tab === "interactions"
              ? "text-primary border-b-2 border-primary -mb-px"
              : "text-muted hover:text-fg"
          }`}
        >
          {t("medications.interactionChecker")}
        </button>
      </div>

      {/* Reminders Tab */}
      {tab === "reminders" && (
        <div className="space-y-4">
          {authLoading ? (
            <p className="text-sm text-muted font-body py-8 text-center">{t("common.loading")}</p>
          ) : !user ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-muted font-body text-sm">
                {t("medications.signInReminders")}
              </p>
              <Link
                href="/auth/sign-in"
                className="inline-block rounded-card bg-primary text-white px-5 py-2.5 text-sm font-body font-semibold transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {t("common.signIn")}
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="rounded-card border border-error/40 bg-error/10 px-4 py-3 text-sm text-error font-body" role="alert">
                  {error}
                </div>
              )}

              {loading && (
                <div className="space-y-4" aria-busy="true" aria-label={t("medications.loadingReminders")}>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="rounded-card border border-border bg-surface shadow-card overflow-hidden"
                    >
                      <div className="px-5 py-4 flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="h-5 w-2/3 rounded bg-border animate-pulse" />
                          <div className="h-3 w-1/2 rounded bg-border animate-pulse" />
                        </div>
                        <div className="h-6 w-10 rounded-full bg-border animate-pulse shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && reminders.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-muted font-body text-sm mb-2">
                    {t("medications.noReminders")}
                  </p>
                  <p className="text-muted font-body text-xs">
                    {t("medications.noRemindersHint")}
                  </p>
                </div>
              )}

              {!loading &&
                reminders.map((r) => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    onToggle={() => handleToggle(r)}
                    onDelete={() => handleDelete(r)}
                  />
                ))}

              <AddReminderForm
                onCreated={(r) => setReminders((prev) => [r, ...prev])}
                getAccessToken={getValidAccessToken}
              />
            </>
          )}
        </div>
      )}

      {/* Interaction Checker Tab */}
      {tab === "interactions" && <InteractionChecker />}

      {/* Disclaimer */}
      <div className="mt-10 pt-4 border-t border-border">
        <p className="text-xs text-muted font-body leading-relaxed">
          {t("medications.disclaimer")}
        </p>
      </div>
    </main>
  );
}
