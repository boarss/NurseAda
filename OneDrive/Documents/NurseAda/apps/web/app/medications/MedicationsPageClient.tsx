"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addReminder,
  checkInteractions,
  deleteReminder,
  getReminders,
  type CheckInteractionsResult,
  type Reminder,
} from "../../lib/api";

export function MedicationsPageClient() {
  const [drugA, setDrugA] = useState("");
  const [drugB, setDrugB] = useState("");
  const [interactionResult, setInteractionResult] = useState<CheckInteractionsResult | null>(null);
  const [interactionLoading, setInteractionLoading] = useState(false);
  const [interactionError, setInteractionError] = useState<string | null>(null);

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [remindersError, setRemindersError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newDosage, setNewDosage] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const loadReminders = useCallback(async () => {
    setRemindersError(null);
    try {
      const list = await getReminders();
      setReminders(list);
    } catch (e) {
      setRemindersError(e instanceof Error ? e.message : "Failed to load reminders.");
    } finally {
      setRemindersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  async function handleCheckInteractions() {
    const names = [drugA.trim(), drugB.trim()].filter(Boolean);
    if (names.length < 2) {
      setInteractionError("Enter at least two drug names.");
      return;
    }
    setInteractionError(null);
    setInteractionResult(null);
    setInteractionLoading(true);
    try {
      const result = await checkInteractions(names);
      setInteractionResult(result);
    } catch (e) {
      setInteractionError(e instanceof Error ? e.message : "Check failed.");
    } finally {
      setInteractionLoading(false);
    }
  }

  async function handleAddReminder(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    const time = newTime.trim();
    if (!name || !time) {
      setAddError("Name and time are required.");
      return;
    }
    setAddError(null);
    setAddLoading(true);
    try {
      const created = await addReminder(name, time, newDosage.trim() || undefined);
      setReminders((prev) => [...prev, created]);
      setNewName("");
      setNewTime("");
      setNewDosage("");
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Could not add reminder.");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDeleteReminder(id: string) {
    try {
      await deleteReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // best-effort
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-1">
      {/* Drug interaction checker */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="mb-3 text-lg font-medium text-slate-200">Check drug interactions</h2>
        <p className="mb-4 text-xs text-slate-400">
          Enter two or more medications to see if they may interact. This is a guide only—always confirm with your doctor or pharmacist.
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="First medication"
            value={drugA}
            onChange={(e) => setDrugA(e.target.value)}
            className="flex-1 min-w-[140px] rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
          <input
            type="text"
            placeholder="Second medication"
            value={drugB}
            onChange={(e) => setDrugB(e.target.value)}
            className="flex-1 min-w-[140px] rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
        </div>
        <button
          type="button"
          onClick={handleCheckInteractions}
          disabled={interactionLoading}
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {interactionLoading ? "Checking..." : "Check interactions"}
        </button>
        {interactionError && <p className="mt-2 text-sm text-red-400">{interactionError}</p>}
        {interactionResult && (
          <div className="mt-4 rounded-md border border-slate-700 bg-slate-800/60 p-3 text-sm">
            {interactionResult.hasInteraction ? (
              <>
                <p className="mb-2 font-medium text-amber-300">
                  Possible interaction ({interactionResult.severity})
                </p>
                <ul className="list-inside list-disc space-y-1 text-slate-300">
                  {interactionResult.pairs.map((p, i) => (
                    <li key={i}>
                      <strong>{p.drugA}</strong> + <strong>{p.drugB}</strong>: {p.message}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-slate-300">No known interaction found for these names. Still confirm with your doctor or pharmacist.</p>
            )}
          </div>
        )}
      </section>

      {/* Reminders */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="mb-3 text-lg font-medium text-slate-200">Medication reminders</h2>
        <p className="mb-4 text-xs text-slate-400">
          Add reminders for when to take your medications. Reminders are stored for this session only unless you have an account.
        </p>

        <form onSubmit={handleAddReminder} className="mb-6 flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Medication name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="min-w-[120px] rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
          <input
            type="text"
            placeholder="Time (e.g. 08:00 or morning)"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="min-w-[120px] rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
          <input
            type="text"
            placeholder="Dosage (optional)"
            value={newDosage}
            onChange={(e) => setNewDosage(e.target.value)}
            className="min-w-[100px] rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={addLoading}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {addLoading ? "Adding..." : "Add reminder"}
          </button>
        </form>
        {addError && <p className="mb-2 text-sm text-red-400">{addError}</p>}

        {remindersLoading ? (
          <p className="text-sm text-slate-500">Loading reminders...</p>
        ) : remindersError ? (
          <p className="text-sm text-red-400">{remindersError}</p>
        ) : reminders.length === 0 ? (
          <p className="text-sm text-slate-500">No reminders yet. Add one above.</p>
        ) : (
          <ul className="space-y-2">
            {reminders.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm"
              >
                <span className="font-medium text-slate-200">{r.medicationName}</span>
                <span className="text-slate-400">{r.time}</span>
                {r.dosage && <span className="text-slate-500">{r.dosage}</span>}
                <button
                  type="button"
                  onClick={() => handleDeleteReminder(r.id)}
                  className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
