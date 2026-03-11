import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useAuth } from "../lib/AuthContext";
import {
  getClinics,
  getAppointments,
  createAppointment,
  deleteAppointment,
  type Clinic,
  type Appointment,
} from "../lib/api";
import { theme } from "../lib/theme";
import { hapticSuccess, hapticWarning } from "../lib/haptics";

const { colors, spacing, radius } = theme;

const STATUS_BG: Record<string, string> = {
  requested: "#fffbeb",
  confirmed: "#ecfdf5",
  cancelled: "#f5f5f4",
  completed: "#ecfdf5",
};
const STATUS_FG: Record<string, string> = {
  requested: "#d97706",
  confirmed: "#059669",
  cancelled: "#94a3b8",
  completed: "#059669",
};
const STATUS_BORDER: Record<string, string> = {
  requested: "#fcd34d",
  confirmed: "#059669",
  cancelled: "#e7e5e4",
  completed: "#059669",
};

type Tab = "appointments" | "clinics" | "book";

const STATES = [
  "Lagos", "Oyo", "FCT", "Kano", "Kaduna", "Rivers", "Enugu", "Edo",
];

// ── Appointment Card ─────────────────────────────────────────────────

function AppointmentCard({
  appt,
  onCancel,
}: {
  appt: Appointment;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View
      style={[
        s.card,
        {
          borderColor: STATUS_BORDER[appt.status] || colors.border,
          backgroundColor: STATUS_BG[appt.status] || colors.surface,
        },
      ]}
    >
      <View style={s.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={[s.cardTitle, { color: STATUS_FG[appt.status] || colors.fg }]}>
            {appt.clinic_name}
          </Text>
          <Text style={s.cardDetail}>
            {[
              appt.status,
              appt.preferred_date,
              appt.preferred_time,
              appt.specialty,
              appt.appointment_type?.replace("_", " "),
            ]
              .filter(Boolean)
              .join("  ·  ")}
          </Text>
          {appt.reason ? (
            <Text style={s.cardNotes} numberOfLines={2}>
              {appt.reason}
            </Text>
          ) : null}
        </View>
        {appt.status === "requested" && (
          <Pressable onPress={onCancel} hitSlop={8} accessibilityLabel={t("appointments.cancelAppointment", { clinic: appt.clinic_name })}>
            <Text style={s.cancelIcon}>✕</Text>
          </Pressable>
        )}
      </View>
    </View>
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
  const { t } = useTranslation();
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{clinic.name}</Text>
      <Text style={s.cardDetail}>
        {clinic.address} — {clinic.city}, {clinic.state}
      </Text>
      <Text style={s.cardDetail}>Phone: {clinic.phone}</Text>
      <View style={s.chipWrap}>
        {clinic.specialties.map((sp) => (
          <View key={sp} style={s.specChip}>
            <Text style={s.specChipText}>{sp}</Text>
          </View>
        ))}
        {clinic.accepts_telemedicine && (
          <View style={[s.specChip, { borderColor: colors.primary, backgroundColor: "#ecfdf5" }]}>
            <Text style={[s.specChipText, { color: colors.primary }]}>{t("appointments.telemedicine")}</Text>
          </View>
        )}
      </View>
      <Text style={s.cardDetail}>Hours: {clinic.hours}</Text>
      <Pressable style={s.bookBtn} onPress={onBook}>
        <Text style={s.bookBtnText}>{t("appointments.bookAtClinic")}</Text>
      </Pressable>
    </View>
  );
}

// ── Booking Form ─────────────────────────────────────────────────────

function BookingForm({
  prefilledClinic,
  token,
  onBooked,
}: {
  prefilledClinic?: Clinic | null;
  token?: string | null;
  onBooked: (a: Appointment) => void;
}) {
  const [clinicName, setClinicName] = useState(prefilledClinic?.name ?? "");
  const [clinicId, setClinicId] = useState(prefilledClinic?.id ?? "");
  const [specialty, setSpecialty] = useState("");
  const [apptType, setApptType] = useState<"in_person" | "telemedicine">("in_person");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (prefilledClinic) {
      setClinicName(prefilledClinic.name);
      setClinicId(prefilledClinic.id);
      if (prefilledClinic.accepts_telemedicine) setApptType("telemedicine");
    }
  }, [prefilledClinic]);

  const handleSave = async () => {
    if (!clinicName.trim()) return;
    setSaving(true);
    try {
      const created = await createAppointment(
        {
          clinic_name: clinicName.trim(),
          clinic_id: clinicId || undefined,
          specialty: specialty || undefined,
          appointment_type: apptType,
          reason: reason.trim(),
          preferred_date: date || undefined,
          preferred_time: time || undefined,
          notes: notes.trim(),
        },
        token
      );
      onBooked(created);
      void hapticSuccess();
      setClinicName("");
      setClinicId("");
      setSpecialty("");
      setApptType("in_person");
      setReason("");
      setDate("");
      setTime("");
      setNotes("");
    } catch {
      void hapticWarning();
      Alert.alert("Error", "Could not book appointment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.formCard}>
      <Text style={s.formTitle}>{t("appointments.book")}</Text>

      <Text style={s.label}>{t("appointments.clinicHospital")}</Text>
      <TextInput
        style={s.input}
        value={clinicName}
        onChangeText={setClinicName}
        placeholder={t("appointments.clinicPlaceholder")}
        placeholderTextColor="#94a3b8"
      />

      <Text style={s.label}>{t("appointments.specialty")}</Text>
      <TextInput
        style={s.input}
        value={specialty}
        onChangeText={setSpecialty}
        placeholder={t("appointments.anyGeneral")}
        placeholderTextColor="#94a3b8"
      />

      <Text style={s.label}>{t("appointments.appointmentType")}</Text>
      <View style={s.typeRow}>
        <Pressable
          style={[s.typeChip, apptType === "in_person" && s.typeChipActive]}
          onPress={() => setApptType("in_person")}
        >
          <Text style={[s.typeChipText, apptType === "in_person" && s.typeChipTextActive]}>
            {t("appointments.inPerson")}
          </Text>
        </Pressable>
        <Pressable
          style={[s.typeChip, apptType === "telemedicine" && s.typeChipActive]}
          onPress={() => setApptType("telemedicine")}
        >
          <Text style={[s.typeChipText, apptType === "telemedicine" && s.typeChipTextActive]}>
            {t("appointments.telemedicine")}
          </Text>
        </Pressable>
      </View>

      <Text style={s.label}>{t("appointments.reasonForVisit")}</Text>
      <TextInput
        style={[s.input, { minHeight: 56, textAlignVertical: "top" }]}
        value={reason}
        onChangeText={setReason}
        placeholder={t("appointments.reasonPlaceholder")}
        placeholderTextColor="#94a3b8"
        multiline
      />

      <Text style={s.label}>{t("appointments.preferredDate")}</Text>
      <TextInput
        style={s.input}
        value={date}
        onChangeText={setDate}
        placeholder="2026-03-15"
        placeholderTextColor="#94a3b8"
      />

      <Text style={s.label}>{t("appointments.preferredTime")}</Text>
      <TextInput
        style={s.input}
        value={time}
        onChangeText={setTime}
        placeholder="09:00"
        placeholderTextColor="#94a3b8"
      />

      <Text style={s.label}>{t("appointments.additionalInfo")}</Text>
      <TextInput
        style={s.input}
        value={notes}
        onChangeText={setNotes}
        placeholder={t("appointments.additionalInfo")}
        placeholderTextColor="#94a3b8"
      />

      <Pressable
        style={[s.submitBtn, (!clinicName.trim() || saving) && { opacity: 0.5 }]}
        onPress={handleSave}
        disabled={!clinicName.trim() || saving}
      >
        <Text style={s.submitBtnText}>{saving ? t("common.booking") : t("appointments.requestAppointment")}</Text>
      </Pressable>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────

export default function AppointmentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, accessToken, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("appointments");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefilledClinic, setPrefilledClinic] = useState<Clinic | null>(null);
  const [stateFilter, setStateFilter] = useState("");

  const loadAppointments = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAppointments(accessToken);
      setAppointments(data.appointments);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const loadClinics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClinics({ state: stateFilter });
      setClinics(data.clinics);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load clinics");
    } finally {
      setLoading(false);
    }
  }, [stateFilter]);

  useEffect(() => {
    if (tab === "appointments" && accessToken) loadAppointments();
    if (tab === "clinics") loadClinics();
  }, [tab, accessToken, loadAppointments, loadClinics]);

  const handleCancel = (a: Appointment) => {
    Alert.alert("Cancel appointment", `Cancel appointment at ${a.clinic_name}?`, [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel appointment",
        style: "destructive",
        onPress: async () => {
          setAppointments((prev) => prev.filter((x) => x.id !== a.id));
          try {
            await deleteAppointment(a.id, accessToken);
            void hapticWarning();
          } catch {
            loadAppointments();
          }
        },
      },
    ]);
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

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      {/* Tabs */}
      <View style={s.tabRow}>
        {(
          [
            { key: "appointments", label: t("appointments.myAppointments") },
            { key: "clinics", label: t("appointments.findClinic") },
            { key: "book", label: t("appointments.book") },
          ] as const
        ).map((tabItem) => (
          <Pressable
            key={tabItem.key}
            style={[s.tab, tab === tabItem.key && s.tabActive]}
            onPress={() => setTab(tabItem.key)}
          >
            <Text style={[s.tabText, tab === tabItem.key && s.tabTextActive]}>
              {tabItem.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── My Appointments ────────────────────────────────────────── */}
      {tab === "appointments" && (
        <View style={{ gap: 12 }}>
          {authLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
          ) : !user ? (
            <View style={s.authPrompt}>
              <Text style={s.authText}>{t("appointments.signInAppointments")}</Text>
              <Pressable style={s.signInBtn} onPress={() => router.push("/sign-in")}>
                <Text style={s.signInBtnText}>{t("common.signIn")}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {error && <Text style={s.errText}>{error}</Text>}
              {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />}
              {!loading && appointments.length === 0 && (
                <View style={s.emptyBox}>
                  <Text style={s.emptyTitle}>{t("appointments.noAppointments")}</Text>
                  <Text style={s.emptySubtitle}>{t("appointments.noAppointmentsHint")}</Text>
                </View>
              )}
              {!loading &&
                appointments.map((a) => (
                  <AppointmentCard key={a.id} appt={a} onCancel={() => handleCancel(a)} />
                ))}
            </>
          )}
        </View>
      )}

      {/* ── Find a Clinic ──────────────────────────────────────────── */}
      {tab === "clinics" && (
        <View style={{ gap: 12 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            style={{ maxHeight: 40 }}
          >
            <Pressable
              style={[s.filterChip, !stateFilter && s.filterChipActive]}
              onPress={() => setStateFilter("")}
            >
              <Text style={[s.filterChipText, !stateFilter && s.filterChipTextActive]}>
                {t("appointments.allStates")}
              </Text>
            </Pressable>
            {STATES.map((st) => (
              <Pressable
                key={st}
                style={[s.filterChip, stateFilter === st && s.filterChipActive]}
                onPress={() => setStateFilter(st)}
              >
                <Text style={[s.filterChipText, stateFilter === st && s.filterChipTextActive]}>
                  {st}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {error && <Text style={s.errText}>{error}</Text>}
          {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />}
          {!loading && clinics.length === 0 && (
            <Text style={s.emptyTitle}>{t("appointments.noClinics")}</Text>
          )}
          {!loading &&
            clinics.map((c) => (
              <ClinicCard key={c.id} clinic={c} onBook={() => handleBookFromClinic(c)} />
            ))}
        </View>
      )}

      {/* ── Book ───────────────────────────────────────────────────── */}
      {tab === "book" && (
        <>
          {authLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
          ) : !user ? (
            <View style={s.authPrompt}>
              <Text style={s.authText}>{t("appointments.signInBook")}</Text>
              <Pressable style={s.signInBtn} onPress={() => router.push("/sign-in")}>
                <Text style={s.signInBtnText}>{t("common.signIn")}</Text>
              </Pressable>
            </View>
          ) : (
            <BookingForm
              prefilledClinic={prefilledClinic}
              token={accessToken}
              onBooked={handleBooked}
            />
          )}
        </>
      )}

      {/* Disclaimer */}
      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>{t("appointments.disclaimer")}</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 48 },

  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.lg,
  },
  tab: { paddingHorizontal: 14, paddingVertical: 10 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: "500", color: colors.muted },
  tabTextActive: { color: colors.primary },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 14,
  },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.fg },
  cardDetail: { fontSize: 12, color: colors.muted, marginTop: 3 },
  cardNotes: { fontSize: 12, color: colors.muted, marginTop: 4 },
  cancelIcon: { fontSize: 14, color: colors.muted, fontWeight: "600" },

  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  specChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  specChipText: { fontSize: 11, color: colors.muted, textTransform: "capitalize" },

  bookBtn: {
    marginTop: 10,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  bookBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 12, color: colors.muted, fontWeight: "500" },
  filterChipTextActive: { color: "#fff" },

  formCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.card,
    padding: 16,
    gap: 8,
  },
  formTitle: { fontSize: 16, fontWeight: "700", color: colors.fg, marginBottom: 4 },
  label: { fontSize: 12, color: colors.muted, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.fg,
  },
  typeRow: { flexDirection: "row", gap: 10 },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { fontSize: 13, color: colors.muted, fontWeight: "500" },
  typeChipTextActive: { color: "#fff" },

  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  authPrompt: { alignItems: "center", paddingVertical: 32, gap: 12 },
  authText: { fontSize: 14, color: colors.muted, textAlign: "center" },
  signInBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  signInBtnText: { color: "#fff", fontWeight: "600" },

  errText: { color: colors.error, fontSize: 13, textAlign: "center", paddingVertical: 8 },
  emptyBox: { alignItems: "center", paddingVertical: 24 },
  emptyTitle: { fontSize: 14, color: colors.muted, textAlign: "center" },
  emptySubtitle: { fontSize: 12, color: colors.muted, marginTop: 4, textAlign: "center" },

  disclaimer: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  disclaimerText: { fontSize: 11, color: colors.muted, lineHeight: 17 },
});
