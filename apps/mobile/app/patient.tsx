import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../lib/AuthContext";
import {
  getPatient,
  getObservations,
  getMedications,
  getDiagnosticReports,
  type PatientSummary,
  type FhirObservation,
  type FhirMedicationRequest,
  type FhirDiagnosticReport,
} from "../lib/api";
import { theme } from "../lib/theme";

const { colors } = theme;

type Tab = "observations" | "medications" | "reports";

function displayName(p: PatientSummary): string {
  const n = p.name?.[0];
  if (!n) return p.id ?? "Unknown";
  const given = n.given?.join(" ") ?? "";
  return [given, n.family].filter(Boolean).join(" ") || p.id || "Unknown";
}

function age(birthDate?: string): string | null {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  return `${Math.floor(diff / 31_557_600_000)}y`;
}

function fmtDate(iso?: string): string {
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

export default function PatientScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const patientId = id ?? "";
  const { accessToken, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [patient, setPatient] = useState<PatientSummary | null>(null);
  const [pLoading, setPLoading] = useState(true);
  const [pErr, setPErr] = useState<string | null>(null);

  const [obs, setObs] = useState<FhirObservation[]>([]);
  const [obsLoading, setObsLoading] = useState(true);
  const [obsErr, setObsErr] = useState<string | null>(null);

  const [meds, setMeds] = useState<FhirMedicationRequest[]>([]);
  const [medsLoading, setMedsLoading] = useState(true);
  const [medsErr, setMedsErr] = useState<string | null>(null);

  const [reports, setReports] = useState<FhirDiagnosticReport[]>([]);
  const [rptLoading, setRptLoading] = useState(true);
  const [rptErr, setRptErr] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("observations");

  const fetchAll = useCallback(async () => {
    if (!patientId || !accessToken) return;

    setPLoading(true);
    setPErr(null);
    try {
      setPatient(await getPatient(patientId, accessToken));
    } catch (e: any) {
      setPErr(e?.message ?? "Failed");
    } finally {
      setPLoading(false);
    }

    setObsLoading(true);
    setObsErr(null);
    try {
      const b = await getObservations(patientId, accessToken);
      setObs((b.entry ?? []).map((e) => e.resource));
    } catch (e: any) {
      setObsErr(e?.message ?? "Failed");
    } finally {
      setObsLoading(false);
    }

    setMedsLoading(true);
    setMedsErr(null);
    try {
      const b = await getMedications(patientId, accessToken);
      setMeds((b.entry ?? []).map((e) => e.resource));
    } catch (e: any) {
      setMedsErr(e?.message ?? "Failed");
    } finally {
      setMedsLoading(false);
    }

    setRptLoading(true);
    setRptErr(null);
    try {
      const b = await getDiagnosticReports(patientId, accessToken);
      setReports((b.entry ?? []).map((e) => e.resource));
    } catch (e: any) {
      setRptErr(e?.message ?? "Failed");
    } finally {
      setRptLoading(false);
    }
  }, [patientId, accessToken]);

  useEffect(() => {
    if (!authLoading && accessToken) fetchAll();
  }, [authLoading, accessToken, fetchAll]);

  if (authLoading)
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );

  if (!user)
    return (
      <View style={s.center}>
        <Text style={s.heading}>{t("patient.signInRequired")}</Text>
        <Text style={s.sub}>{t("patient.authRequired")}</Text>
        <Pressable style={s.primaryBtn} onPress={() => router.push("/sign-in")}>
          <Text style={s.primaryBtnText}>{t("common.signIn")}</Text>
        </Pressable>
      </View>
    );

  const TABS: { key: Tab; label: string }[] = [
    { key: "observations", label: t("patient.observations") },
    { key: "medications", label: t("patient.medications") },
    { key: "reports", label: t("patient.reports") },
  ];

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      {/* Demographics */}
      {pLoading ? (
        <View style={s.card}>
          <ActivityIndicator color={colors.primary} />
          <Text style={s.sub}>{t("patient.loadingDemographics")}</Text>
        </View>
      ) : pErr ? (
        <View style={[s.card, s.errCard]}>
          <Text style={s.errText}>{pErr}</Text>
        </View>
      ) : patient ? (
        <View style={s.card}>
          <Text style={s.heading}>{displayName(patient)}</Text>
          <Text style={s.sub}>
            {[age(patient.birthDate), patient.gender]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          {patient.birthDate && (
            <Text style={s.tiny}>{t("patient.born", { date: fmtDate(patient.birthDate) })}</Text>
          )}
          <Text style={s.tiny}>{t("patient.id", { id: patient.id ?? patientId })}</Text>
        </View>
      ) : null}

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[s.tab, tab === t.key && s.tabActive]}
          >
            <Text
              style={[s.tabText, tab === t.key && s.tabTextActive]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab content */}
      {tab === "observations" && (
        <Section loading={obsLoading} error={obsErr} empty={obs.length === 0} loadingLabel={t("patient.loadingObservations")} emptyMessage={t("patient.noObservations")}>
          {obs.map((o, i) => {
            const label = o.code?.text ?? o.code?.coding?.[0]?.display ?? "Observation";
            const val = o.valueQuantity
              ? `${o.valueQuantity.value} ${o.valueQuantity.unit ?? ""}`
              : o.valueString ?? "";
            return (
              <View key={o.id ?? i} style={s.item}>
                <Text style={s.itemLabel}>{label}</Text>
                {val ? <Text style={s.itemValue}>{val}</Text> : null}
                <Text style={s.tiny}>{fmtDate(o.effectiveDateTime ?? o.issued)}</Text>
              </View>
            );
          })}
        </Section>
      )}

      {tab === "medications" && (
        <Section loading={medsLoading} error={medsErr} empty={meds.length === 0} loadingLabel={t("patient.loadingMedications")} emptyMessage={t("patient.noMedications")}>
          {meds.map((m, i) => {
            const name =
              m.medicationCodeableConcept?.text ??
              m.medicationCodeableConcept?.coding?.[0]?.display ??
              "Medication";
            return (
              <View key={m.id ?? i} style={s.item}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={s.itemLabel}>{name}</Text>
                  {m.status && <Text style={s.badge}>{m.status}</Text>}
                </View>
                {m.dosageInstruction?.[0]?.text && (
                  <Text style={s.sub}>{m.dosageInstruction[0].text}</Text>
                )}
                <Text style={s.tiny}>{t("patient.prescribed", { date: fmtDate(m.authoredOn) })}</Text>
              </View>
            );
          })}
        </Section>
      )}

      {tab === "reports" && (
        <Section loading={rptLoading} error={rptErr} empty={reports.length === 0} loadingLabel={t("patient.loadingReports")} emptyMessage={t("patient.noReports")}>
          {reports.map((r, i) => {
            const title =
              r.code?.text ?? r.code?.coding?.[0]?.display ?? "Report";
            return (
              <View key={r.id ?? i} style={s.item}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={s.itemLabel}>{title}</Text>
                  {r.status && <Text style={s.badge}>{r.status}</Text>}
                </View>
                {r.conclusion && <Text style={s.sub}>{r.conclusion}</Text>}
                <Text style={s.tiny}>{fmtDate(r.effectiveDateTime ?? r.issued)}</Text>
              </View>
            );
          })}
        </Section>
      )}
    </ScrollView>
  );
}

function Section({
  loading,
  error,
  empty,
  loadingLabel,
  emptyMessage,
  children,
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  loadingLabel: string;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  if (loading)
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={s.sub}>{loadingLabel}</Text>
      </View>
    );
  if (error)
    return (
      <View style={[s.card, s.errCard]}>
        <Text style={s.errText}>{error}</Text>
      </View>
    );
  if (empty)
    return (
      <Text style={[s.sub, { textAlign: "center", paddingVertical: 24 }]}>
        {emptyMessage}
      </Text>
    );
  return <>{children}</>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fafaf9" },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e7e5e4",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  errCard: { borderColor: "#fca5a5", backgroundColor: "#fef2f2" },
  errText: { color: "#dc2626", fontSize: 14 },
  heading: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
  sub: { fontSize: 14, color: "#64748b", marginTop: 2 },
  tiny: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e7e5e4",
    marginBottom: 12,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#059669" },
  tabText: { fontSize: 14, color: "#64748b" },
  tabTextActive: { color: "#059669", fontWeight: "600" },
  item: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e7e5e4",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  itemLabel: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  itemValue: { fontSize: 18, fontWeight: "700", color: "#059669", marginTop: 2 },
  badge: {
    fontSize: 11,
    color: "#059669",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  primaryBtn: {
    backgroundColor: "#059669",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
