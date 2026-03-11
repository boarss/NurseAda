"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/AuthContext";
import {
  getPatient,
  getObservations,
  getMedications,
  getDiagnosticReports,
  type PatientSummary,
  type FhirBundle,
  type FhirObservation,
  type FhirMedicationRequest,
  type FhirDiagnosticReport,
} from "@/lib/api";

type Tab = "observations" | "medications" | "reports";

function patientDisplayName(p: PatientSummary, fallback: string): string {
  const n = p.name?.[0];
  if (!n) return p.id ?? fallback;
  const given = n.given?.join(" ") ?? "";
  return [given, n.family].filter(Boolean).join(" ") || p.id || fallback;
}

function patientAge(birthDate?: string): string | null {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  return `${Math.floor(diff / 31_557_600_000)}y`;
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function SectionShell({
  loadingText,
  emptyText,
  loading,
  error,
  empty,
  children,
}: {
  loadingText: string;
  emptyText: string;
  loading: boolean;
  error: string | null;
  empty: boolean;
  children: React.ReactNode;
}) {
  if (loading)
    return (
      <div className="space-y-3 py-4" aria-busy="true" aria-label={loadingText}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-card border border-border bg-surface px-4 py-3 flex items-center gap-3"
          >
            <div className="h-4 flex-1 max-w-[80%] rounded bg-border animate-pulse" />
            <div className="h-4 w-20 rounded bg-border animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    );
  if (error)
    return (
      <div className="rounded-card border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
        {error}
      </div>
    );
  if (empty)
    return (
      <p className="py-6 text-center text-muted text-sm font-body">
        {emptyText}
      </p>
    );
  return <>{children}</>;
}

export default function PatientProfilePage() {
  const t = useTranslations();
  const params = useParams<{ id: string }>();
  const patientId = params.id;
  const { accessToken, user, loading: authLoading } = useAuth();

  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [patientErr, setPatientErr] = useState<string | null>(null);
  const [patientLoading, setPatientLoading] = useState(true);

  const [observations, setObservations] = useState<FhirObservation[]>([]);
  const [obsLoading, setObsLoading] = useState(true);
  const [obsErr, setObsErr] = useState<string | null>(null);

  const [meds, setMeds] = useState<FhirMedicationRequest[]>([]);
  const [medsLoading, setMedsLoading] = useState(true);
  const [medsErr, setMedsErr] = useState<string | null>(null);

  const [reports, setReports] = useState<FhirDiagnosticReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsErr, setReportsErr] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("observations");

  const fetchAll = useCallback(async () => {
    if (!patientId || !accessToken) return;

    setPatientLoading(true);
    setPatientErr(null);
    try {
      const p = await getPatient(patientId, accessToken);
      setPatient(p);
    } catch (e) {
      setPatientErr(e instanceof Error ? e.message : "Failed to load patient");
    } finally {
      setPatientLoading(false);
    }

    setObsLoading(true);
    setObsErr(null);
    try {
      const bundle = await getObservations(patientId, accessToken);
      setObservations(
        (bundle.entry ?? []).map((e) => e.resource)
      );
    } catch (e) {
      setObsErr(e instanceof Error ? e.message : "Failed to load observations");
    } finally {
      setObsLoading(false);
    }

    setMedsLoading(true);
    setMedsErr(null);
    try {
      const bundle = await getMedications(patientId, accessToken);
      setMeds(
        (bundle.entry ?? []).map((e) => e.resource)
      );
    } catch (e) {
      setMedsErr(e instanceof Error ? e.message : "Failed to load medications");
    } finally {
      setMedsLoading(false);
    }

    setReportsLoading(true);
    setReportsErr(null);
    try {
      const bundle = await getDiagnosticReports(patientId, accessToken);
      setReports(
        (bundle.entry ?? []).map((e) => e.resource)
      );
    } catch (e) {
      setReportsErr(
        e instanceof Error ? e.message : "Failed to load reports"
      );
    } finally {
      setReportsLoading(false);
    }
  }, [patientId, accessToken]);

  useEffect(() => {
    if (!authLoading && accessToken) {
      fetchAll();
    }
  }, [authLoading, accessToken, fetchAll]);

  if (authLoading) return null;

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="font-display text-2xl font-semibold text-fg">
            {t("patient.signInRequired")}
          </h1>
          <p className="text-muted font-body text-sm">
            {t("patient.authRequired")}
          </p>
          <Link
            href="/auth/sign-in"
            className="inline-block rounded-card bg-primary text-white px-6 py-3 font-body font-semibold hover:bg-primary-hover transition-colors"
          >
            {t("common.signIn")}
          </Link>
        </div>
      </main>
    );
  }

  const age = patient ? patientAge(patient.birthDate) : null;

  const TAB_ITEMS: { key: Tab; label: string }[] = [
    { key: "observations", label: t("patient.observations") },
    { key: "medications", label: t("patient.medications") },
    { key: "reports", label: t("patient.reports") },
  ];

  return (
    <main className="min-h-screen max-w-3xl mx-auto w-full px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/chat"
          className="rounded-lg p-2 -ml-2 text-muted hover:text-fg hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={t("common.backToChat")}
        >
          <span className="font-body font-medium">&larr;</span>
        </Link>
        <h1 className="font-display text-2xl font-semibold text-fg">
          Patient Profile
        </h1>
      </div>

      {/* Demographics card */}
      {patientLoading ? (
        <div
          className="rounded-card border border-border bg-surface px-6 py-5 mb-6"
          aria-busy="true"
          aria-label={t("patient.loadingDemographics")}
        >
          <div className="flex flex-wrap gap-4">
            <div className="h-7 w-48 rounded bg-border animate-pulse" />
            <div className="h-4 w-16 rounded bg-border animate-pulse" />
            <div className="h-4 w-20 rounded bg-border animate-pulse" />
          </div>
          <div className="h-4 w-32 rounded bg-border animate-pulse mt-3" />
          <div className="h-3 w-24 rounded bg-border animate-pulse mt-2" />
        </div>
      ) : patientErr ? (
        <div className="rounded-card border border-error/40 bg-error/10 px-6 py-4 mb-6 text-sm text-error">
          {patientErr}
        </div>
      ) : patient ? (
        <div className="rounded-card border border-border bg-surface px-6 py-5 mb-6">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="font-display text-xl font-semibold text-fg">
              {patientDisplayName(patient, t("patient.unknown"))}
            </h2>
            {age && (
              <span className="text-sm text-muted font-body">{age}</span>
            )}
            {patient.gender && (
              <span className="text-sm text-muted font-body capitalize">
                {patient.gender}
              </span>
            )}
          </div>
          {patient.birthDate && (
            <p className="text-sm text-muted font-body mt-1">
              {t("patient.born", { date: formatDate(patient.birthDate) })}
            </p>
          )}
          <p className="text-xs text-muted font-body mt-2">
            {t("patient.id", { id: patient.id ?? patientId })}
          </p>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-4">
        {TAB_ITEMS.map((t) => (
          <button
            key={t.key}
            type="button"
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

      {/* Tab content */}
      {tab === "observations" && (
        <SectionShell
          loadingText={t("patient.loadingObservations")}
          emptyText={t("patient.noObservations")}
          loading={obsLoading}
          error={obsErr}
          empty={observations.length === 0}
        >
          <div className="space-y-3">
            {observations.map((obs, i) => {
              const label =
                obs.code?.text ??
                obs.code?.coding?.[0]?.display ??
                "Observation";
              const value = obs.valueQuantity
                ? `${obs.valueQuantity.value} ${obs.valueQuantity.unit ?? ""}`
                : obs.valueString ?? "";
              const date = formatDate(
                obs.effectiveDateTime ?? obs.issued
              );
              return (
                <div
                  key={obs.id ?? i}
                  className="flex items-start justify-between gap-4 rounded-card border border-border bg-surface px-4 py-3"
                >
                  <div>
                    <p className="font-body text-sm font-medium text-fg">
                      {label}
                    </p>
                    {value && (
                      <p className="font-body text-lg font-semibold text-primary mt-0.5">
                        {value}
                      </p>
                    )}
                  </div>
                  {date && (
                    <span className="text-xs text-muted font-body whitespace-nowrap mt-1">
                      {date}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </SectionShell>
      )}

      {tab === "medications" && (
        <SectionShell
          loadingText={t("patient.loadingMedications")}
          emptyText={t("patient.noMedications")}
          loading={medsLoading}
          error={medsErr}
          empty={meds.length === 0}
        >
          <div className="space-y-3">
            {meds.map((med, i) => {
              const name =
                med.medicationCodeableConcept?.text ??
                med.medicationCodeableConcept?.coding?.[0]?.display ??
                "Medication";
              const dosage = med.dosageInstruction?.[0]?.text;
              const date = formatDate(med.authoredOn);
              return (
                <div
                  key={med.id ?? i}
                  className="rounded-card border border-border bg-surface px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-body text-sm font-medium text-fg">
                      {name}
                    </p>
                    {med.status && (
                      <span
                        className={`text-xs font-body px-2 py-0.5 rounded-full ${
                          med.status === "active"
                            ? "bg-primary/10 text-primary"
                            : "bg-surface text-muted border border-border"
                        }`}
                      >
                        {med.status}
                      </span>
                    )}
                  </div>
                  {dosage && (
                    <p className="text-sm text-muted font-body mt-1">
                      {dosage}
                    </p>
                  )}
                  {date && (
                    <p className="text-xs text-muted font-body mt-1">
                      {t("patient.prescribed", { date })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </SectionShell>
      )}

      {tab === "reports" && (
        <SectionShell
          loadingText={t("patient.loadingReports")}
          emptyText={t("patient.noReports")}
          loading={reportsLoading}
          error={reportsErr}
          empty={reports.length === 0}
        >
          <div className="space-y-3">
            {reports.map((rpt, i) => {
              const title =
                rpt.code?.text ??
                rpt.code?.coding?.[0]?.display ??
                "Diagnostic Report";
              const category =
                rpt.category?.[0]?.coding?.[0]?.display;
              const date = formatDate(
                rpt.effectiveDateTime ?? rpt.issued
              );
              return (
                <div
                  key={rpt.id ?? i}
                  className="rounded-card border border-border bg-surface px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-body text-sm font-medium text-fg">
                        {title}
                      </p>
                      {category && (
                        <span className="text-xs text-muted font-body">
                          {category}
                        </span>
                      )}
                    </div>
                    {rpt.status && (
                      <span
                        className={`text-xs font-body px-2 py-0.5 rounded-full ${
                          rpt.status === "final"
                            ? "bg-primary/10 text-primary"
                            : "bg-surface text-muted border border-border"
                        }`}
                      >
                        {rpt.status}
                      </span>
                    )}
                  </div>
                  {rpt.conclusion && (
                    <p className="text-sm text-fg font-body mt-2 leading-relaxed">
                      {rpt.conclusion}
                    </p>
                  )}
                  {date && (
                    <p className="text-xs text-muted font-body mt-1">
                      {date}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </SectionShell>
      )}
    </main>
  );
}
