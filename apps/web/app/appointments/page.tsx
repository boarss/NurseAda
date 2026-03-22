"use client";


import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import {
  getClinics,
  getAppointments,
  createAppointment,
  deleteAppointment,
  type Clinic,
  type Appointment,
} from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  requested:
    "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
  confirmed: "border-primary bg-primary/5 text-primary",
  cancelled: "border-border bg-surface text-muted line-through",
  completed: "border-primary bg-primary/10 text-primary",
};

const NIGERIAN_STATES = [
  "", "Lagos", "Oyo", "FCT", "Kano", "Kaduna", "Rivers", "Enugu", "Edo",
  "Ogun", "Delta", "Anambra", "Imo",
];

const SPECIALTIES = [
  "", "general", "surgery", "paediatrics", "obstetrics", "cardiology",
  "ophthalmology", "orthopaedics", "oncology", "dermatology", "psychiatry",
  "radiology", "emergency", "maternal", "immunization",
];

const FACILITY_TYPES = [
  "", "hospital", "clinic", "primary_health_center", "specialist",
];

type Tab = "appointments" | "clinics" | "book";

// ── Appointment Card ─────────────────────────────────────────────────

function AppointmentCard({
  appt,
  onCancel,
}: {
  appt: Appointment;
  onCancel: () => void;
}) {
  const t = useTranslations();
  const cls =
    STATUS_STYLES[appt.status] || STATUS_STYLES.requested;
  return (
    <div className={`rounded-card border-2 shadow-card transition-all ${cls}`}>
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold leading-snug">
            {appt.clinic_name}
          </h3>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs font-body">
            <span className="capitalize">{appt.status}</span>
            {appt.preferred_date && <span>{appt.preferred_date}</span>}
            {appt.preferred_time && <span>{appt.preferred_time}</span>}
            {appt.specialty && <span className="capitalize">{appt.specialty}</span>}
            <span className="capitalize">{appt.appointment_type.replace("_", " ")}</span>
          </div>
          {appt.reason && (
            <p className="text-xs font-body mt-1.5 line-clamp-2 opacity-80">
              {appt.reason}
            </p>
          )}
        </div>
        {appt.status === "requested" && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-muted hover:text-error hover:bg-error/10 transition-colors focus:outline-none focus:ring-2 focus:ring-error shrink-0"
            aria-label={t("appointments.cancelAppointment", { clinic: appt.clinic_name })}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Clinic Card ──────────────────────────────────────────────────────

function ClinicCard({
  clinic,
  onBook,
}: {
  clinic: Clinic;
  onBook: () => void;
}) {
  const t = useTranslations();
  return (
    <div className="rounded-card border border-border bg-surface shadow-card">
      <div className="px-5 py-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-base font-semibold text-fg leading-snug">
            {clinic.name}
          </h3>
          {clinic.accepts_telemedicine && (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 text-primary px-2 py-0.5 text-[11px] font-body font-medium">
              {t("appointments.telemedicine")}
            </span>
          )}
        </div>
        <p className="text-xs text-muted font-body">
          {clinic.address} — {clinic.city}, {clinic.state}
        </p>
        <p className="text-xs text-muted font-body">{t("appointments.phone", { number: clinic.phone })}</p>
        <div className="flex flex-wrap gap-1.5">
          {clinic.specialties.map((s) => (
            <span
              key={s}
              className="rounded-full bg-primary/5 text-primary border border-primary/10 px-2 py-0.5 text-[11px] font-body capitalize"
            >
              {s}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted font-body">{t("appointments.hours", { hours: clinic.hours })}</p>
        <button
          type="button"
          onClick={onBook}
          className="mt-1 rounded-card bg-primary text-white font-body font-semibold text-sm px-4 py-2 transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg"
        >
          {t("appointments.bookAtClinic")}
        </button>
      </div>
    </div>
  );
}

// ── Booking Form ─────────────────────────────────────────────────────

function BookingForm({
  prefilledClinic,
  getAccessToken,
  onBooked,
}: {
  prefilledClinic?: Clinic | null;
  getAccessToken: () => Promise<string | null>;
  onBooked: (a: Appointment) => void;
}) {
  const t = useTranslations();
  const [clinicName, setClinicName] = useState(prefilledClinic?.name ?? "");
  const [clinicId, setClinicId] = useState(prefilledClinic?.id ?? "");
  const [specialty, setSpecialty] = useState("");
  const [appointmentType, setAppointmentType] = useState<"in_person" | "telemedicine">("in_person");
  const [reason, setReason] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledClinic) {
      setClinicName(prefilledClinic.name);
      setClinicId(prefilledClinic.id);
      if (prefilledClinic.accepts_telemedicine) {
        setAppointmentType("telemedicine");
      }
    }
  }, [prefilledClinic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setError("Please sign in to continue.");
        return;
      }
      const created = await createAppointment(
        {
          clinic_name: clinicName.trim(),
          clinic_id: clinicId || undefined,
          specialty: specialty || undefined,
          appointment_type: appointmentType,
          reason: reason.trim(),
          preferred_date: preferredDate || undefined,
          preferred_time: preferredTime || undefined,
          notes: notes.trim(),
        },
        token
      );
      onBooked(created);
      setClinicName("");
      setClinicId("");
      setSpecialty("");
      setAppointmentType("in_person");
      setReason("");
      setPreferredDate("");
      setPreferredTime("");
      setNotes("");
      toast.success(t("common.toastAppointmentRequested"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to book appointment";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className="rounded-card border border-error/40 bg-error/10 px-4 py-3 text-sm text-error font-body"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="clinic-name" className="block text-xs font-body text-muted mb-1">
            {t("appointments.clinicHospital")}
          </label>
          <input
            id="clinic-name"
            type="text"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            placeholder={t("appointments.clinicPlaceholder")}
            required
            className="w-full rounded-card border border-border bg-bg text-fg placeholder:text-muted px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="appt-specialty" className="block text-xs font-body text-muted mb-1">
            {t("appointments.specialty")}
          </label>
          <select
            id="appt-specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full rounded-card border border-border bg-bg text-fg px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary capitalize"
          >
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s || t("appointments.anyGeneral")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-body text-muted mb-1.5">
          {t("appointments.appointmentType")}
        </label>
        <div className="flex gap-4">
          <label className="inline-flex items-center gap-2 text-sm font-body text-fg cursor-pointer">
            <input
              type="radio"
              name="appt-type"
              value="in_person"
              checked={appointmentType === "in_person"}
              onChange={() => setAppointmentType("in_person")}
              className="accent-primary"
            />
            {t("appointments.inPerson")}
          </label>
          <label className="inline-flex items-center gap-2 text-sm font-body text-fg cursor-pointer">
            <input
              type="radio"
              name="appt-type"
              value="telemedicine"
              checked={appointmentType === "telemedicine"}
              onChange={() => setAppointmentType("telemedicine")}
              className="accent-primary"
            />
            {t("appointments.telemedicine")}
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="appt-reason" className="block text-xs font-body text-muted mb-1">
          {t("appointments.reasonForVisit")}
        </label>
        <textarea
          id="appt-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("appointments.reasonPlaceholder")}
          rows={2}
          className="w-full rounded-card border border-border bg-bg text-fg placeholder:text-muted px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="appt-date" className="block text-xs font-body text-muted mb-1">
            {t("appointments.preferredDate")}
          </label>
          <input
            id="appt-date"
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            className="w-full rounded-card border border-border bg-bg text-fg px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="appt-time" className="block text-xs font-body text-muted mb-1">
            {t("appointments.preferredTime")}
          </label>
          <input
            id="appt-time"
            type="time"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
            className="w-full rounded-card border border-border bg-bg text-fg px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label htmlFor="appt-notes" className="block text-xs font-body text-muted mb-1">
          {t("medications.notes")}
        </label>
        <input
          id="appt-notes"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("appointments.additionalInfo")}
          className="w-full rounded-card border border-border bg-bg text-fg placeholder:text-muted px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <button
        type="submit"
        disabled={saving || !clinicName.trim()}
        className="rounded-card bg-primary text-white font-body font-semibold px-6 py-3 text-sm transition-all hover:bg-primary-hover disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg"
      >
        {saving ? t("common.booking") : t("appointments.requestAppointment")}
      </button>
    </form>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const t = useTranslations();
  const { user, getValidAccessToken, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("appointments");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefilledClinic, setPrefilledClinic] = useState<Clinic | null>(null);

  // Clinic filters
  const [stateFilter, setStateFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const loadAppointments = useCallback(async () => {
    const token = await getValidAccessToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAppointments(token);
      setAppointments(data.appointments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [getValidAccessToken]);

  const loadClinics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClinics({
        state: stateFilter,
        specialty: specialtyFilter,
        type: typeFilter,
      });
      setClinics(data.clinics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clinics");
    } finally {
      setLoading(false);
    }
  }, [stateFilter, specialtyFilter, typeFilter]);

  useEffect(() => {
    if (tab === "appointments" && user && !authLoading) loadAppointments();
    if (tab === "clinics") loadClinics();
  }, [tab, user, authLoading, loadAppointments, loadClinics]);

  const handleCancel = async (a: Appointment) => {
    try {
      const token = await getValidAccessToken();
      if (!token) {
        toast.error(t("common.error"));
        return;
      }
      await deleteAppointment(a.id, token);
      setAppointments((prev) => prev.filter((x) => x.id !== a.id));
      toast.success(t("common.toastAppointmentCancelled"));
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleBookFromClinic = (c: Clinic) => {
    setPrefilledClinic(c);
    setTab("book");
  };

  const handleBooked = (a: Appointment) => {
    setAppointments((prev) => [a, ...prev]);
    setPrefilledClinic(null);
    setTab("appointments");
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "appointments", label: t("appointments.myAppointments") },
    { key: "clinics", label: t("appointments.findClinic") },
    { key: "book", label: t("appointments.book") },
  ];

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
            {t("appointments.title")}
          </h1>
          <p className="text-sm text-muted font-body mt-0.5">
            {t("appointments.subtitle")}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-body font-medium transition-colors focus:outline-none ${
              tab === t.key
                ? "text-primary border-b-2 border-primary -mb-px"
                : "text-muted hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── My Appointments ─────────────────────────────────────────── */}
      {tab === "appointments" && (
        <div className="space-y-4">
          {authLoading ? (
            <p className="text-sm text-muted font-body py-8 text-center">
              {t("common.loading")}
            </p>
          ) : !user ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-muted font-body text-sm">
                {t("appointments.signInAppointments")}
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
                <div
                  className="rounded-card border border-error/40 bg-error/10 px-4 py-3 text-sm text-error font-body"
                  role="alert"
                >
                  {error}
                </div>
              )}

              {loading && (
                <div className="space-y-4" aria-busy="true" aria-label={t("appointments.loadingAppointments")}>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="rounded-card border-2 border-border bg-surface shadow-card overflow-hidden"
                    >
                      <div className="px-5 py-4 flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="h-5 w-3/4 rounded bg-border animate-pulse" />
                          <div className="h-3 w-full rounded bg-border animate-pulse" />
                          <div className="h-3 w-2/3 rounded bg-border animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && appointments.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-muted font-body text-sm mb-2">
                    {t("appointments.noAppointments")}
                  </p>
                  <p className="text-muted font-body text-xs">
                    {t("appointments.noAppointmentsHint")}
                  </p>
                </div>
              )}

              {!loading &&
                appointments.map((a, i) => (
                  <div
                    key={a.id}
                    className="animate-in opacity-0"
                    style={{ animationDelay: `calc(var(--stagger-delay) * ${i})` }}
                  >
                    <AppointmentCard
                      appt={a}
                      onCancel={() => handleCancel(a)}
                    />
                  </div>
                ))}
            </>
          )}
        </div>
      )}

      {/* ── Find a Clinic ───────────────────────────────────────────── */}
      {tab === "clinics" && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              aria-label={t("appointments.filterByState")}
              className="rounded-card border border-border bg-bg text-fg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t("appointments.allStates")}</option>
              {NIGERIAN_STATES.filter(Boolean).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              aria-label={t("appointments.filterBySpecialty")}
              className="rounded-card border border-border bg-bg text-fg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary capitalize"
            >
              <option value="">{t("appointments.allSpecialties")}</option>
              {SPECIALTIES.filter(Boolean).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label={t("appointments.filterByType")}
              className="rounded-card border border-border bg-bg text-fg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary capitalize"
            >
              <option value="">{t("appointments.allTypes")}</option>
              {FACILITY_TYPES.filter(Boolean).map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div
              className="rounded-card border border-error/40 bg-error/10 px-4 py-3 text-sm text-error font-body"
              role="alert"
            >
              {error}
            </div>
          )}

          {loading && (
            <div className="space-y-4" aria-busy="true" aria-label={t("appointments.loadingClinics")}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-card border border-border bg-surface shadow-card overflow-hidden"
                >
                  <div className="px-5 py-4 space-y-2">
                    <div className="h-5 w-2/3 rounded bg-border animate-pulse" />
                    <div className="h-3 w-full rounded bg-border animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-border animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && clinics.length === 0 && (
            <p className="text-sm text-muted font-body py-8 text-center">
              {t("appointments.noClinics")}
            </p>
          )}

          <div className="space-y-4">
            {!loading &&
              clinics.map((c) => (
                <ClinicCard
                  key={c.id}
                  clinic={c}
                  onBook={() => handleBookFromClinic(c)}
                />
              ))}
          </div>
        </div>
      )}

      {/* ── Book Appointment ────────────────────────────────────────── */}
      {tab === "book" && (
        <div>
          {authLoading ? (
            <p className="text-sm text-muted font-body py-8 text-center">
              {t("common.loading")}
            </p>
          ) : !user ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-muted font-body text-sm">
                {t("appointments.signInBook")}
              </p>
              <Link
                href="/auth/sign-in"
                className="inline-block rounded-card bg-primary text-white px-5 py-2.5 text-sm font-body font-semibold transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {t("common.signIn")}
              </Link>
            </div>
          ) : (
            <BookingForm
              prefilledClinic={prefilledClinic}
              getAccessToken={getValidAccessToken}
              onBooked={handleBooked}
            />
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-10 pt-4 border-t border-border">
        <p className="text-xs text-muted font-body leading-relaxed">
          {t("appointments.disclaimer")}
        </p>
      </div>
    </main>
  );
}
