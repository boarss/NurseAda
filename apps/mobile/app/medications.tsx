import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useAuth } from "../lib/AuthContext";
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  checkInteractions,
  type MedicationReminder,
  type InteractionCheckResponse,
} from "../lib/api";
import {
  requestPermissions,
  syncReminders,
  scheduleReminder,
  cancelReminder,
} from "../lib/notifications";
import { theme } from "../lib/theme";
import { hapticSuccess, hapticWarning } from "../lib/haptics";

const { colors, spacing, radius } = theme;

const SEVERITY_BG: Record<string, string> = {
  high: "#fef2f2",
  medium: "#fffbeb",
  low: "#f5f5f4",
};
const SEVERITY_FG: Record<string, string> = {
  high: "#dc2626",
  medium: "#d97706",
  low: "#64748b",
};
const SEVERITY_BORDER: Record<string, string> = {
  high: "#fca5a5",
  medium: "#fcd34d",
  low: "#e7e5e4",
};

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
  const { t } = useTranslation();
  const freqLabels: Record<string, string> = {
    daily: t("medications.onceDaily"),
    twice_daily: t("medications.twiceDaily"),
    three_daily: t("medications.threeDaily"),
    weekly: t("medications.weekly"),
    custom: t("medications.custom"),
  };
  const times = (reminder.reminder_times || []).join(", ");
  return (
    <View style={[s.card, !reminder.is_active && s.cardInactive]}>
      <View style={s.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.medName}>{reminder.medication_name}</Text>
          <Text style={s.medDetail}>
            {[reminder.dosage, freqLabels[reminder.frequency] || reminder.frequency, times]
              .filter(Boolean)
              .join("  ·  ")}
          </Text>
          {reminder.notes ? (
            <Text style={s.medNotes} numberOfLines={2}>
              {reminder.notes}
            </Text>
          ) : null}
        </View>
        <View style={s.cardActions}>
          <Switch
            value={reminder.is_active}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
            accessibilityLabel={reminder.is_active ? t("medications.pauseReminder") : t("medications.resumeReminder")}
          />
          <Pressable
            onPress={onDelete}
            hitSlop={8}
            accessibilityLabel={`Delete ${reminder.medication_name}`}
          >
            <Text style={s.deleteIcon}>✕</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ── Add Reminder ─────────────────────────────────────────────────────

function AddReminderSection({
  onCreated,
  token,
}: {
  onCreated: (r: MedicationReminder) => void;
  token?: string | null;
}) {
  const { t } = useTranslation();
  const freqLabels: Record<string, string> = {
    daily: t("medications.onceDaily"),
    twice_daily: t("medications.twiceDaily"),
    three_daily: t("medications.threeDaily"),
    weekly: t("medications.weekly"),
    custom: t("medications.custom"),
  };
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [time, setTime] = useState("08:00");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setDosage("");
    setFrequency("daily");
    setTime("08:00");
    setNotes("");
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const created = await createReminder(
        {
          medication_name: name.trim(),
          dosage: dosage.trim(),
          frequency,
          reminder_times: [time],
          notes: notes.trim(),
        },
        token
      );
      onCreated(created);
      reset();
      setOpen(false);
      void hapticSuccess();
      await scheduleReminder(created);
    } catch {
      Alert.alert("Error", "Could not save reminder. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Pressable style={s.addBtn} onPress={() => setOpen(true)}>
        <Text style={s.addBtnText}>{t("medications.addReminder")}</Text>
      </Pressable>
    );
  }

  return (
    <View style={s.formCard}>
      <Text style={s.formTitle}>{t("medications.newReminder")}</Text>

      <Text style={s.label}>{t("medications.medicationNameRequired")}</Text>
      <TextInput
        style={s.input}
        value={name}
        onChangeText={setName}
        placeholder={t("medications.medicationPlaceholder")}
        placeholderTextColor="#94a3b8"
      />

      <Text style={s.label}>{t("medications.dosage")}</Text>
      <TextInput
        style={s.input}
        value={dosage}
        onChangeText={setDosage}
        placeholder={t("medications.dosagePlaceholder")}
        placeholderTextColor="#94a3b8"
      />

      <Text style={s.label}>{t("medications.frequency")}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.freqRow}
        contentContainerStyle={{ gap: 8 }}
      >
        {Object.entries(freqLabels).map(([val, lbl]) => (
          <Pressable
            key={val}
            onPress={() => setFrequency(val)}
            style={[s.freqChip, frequency === val && s.freqChipActive]}
          >
            <Text style={[s.freqChipText, frequency === val && s.freqChipTextActive]}>
              {lbl}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={s.label}>{t("medications.reminderTimes")}</Text>
      <TextInput
        style={s.input}
        value={time}
        onChangeText={setTime}
        placeholder="08:00"
        placeholderTextColor="#94a3b8"
        keyboardType="numbers-and-punctuation"
      />

      <Text style={s.label}>{t("medications.notes")}</Text>
      <TextInput
        style={s.input}
        value={notes}
        onChangeText={setNotes}
        placeholder={t("medications.notesPlaceholder")}
        placeholderTextColor="#94a3b8"
      />

      <View style={s.formActions}>
        <Pressable
          style={[s.saveBtn, (!name.trim() || saving) && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!name.trim() || saving}
        >
          <Text style={s.saveBtnText}>{saving ? t("common.saving") : t("medications.saveReminder")}</Text>
        </Pressable>
        <Pressable
          style={s.cancelBtn}
          onPress={() => {
            reset();
            setOpen(false);
          }}
        >
          <Text style={s.cancelBtnText}>{t("common.cancel")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Interaction Checker ──────────────────────────────────────────────

function InteractionChecker() {
  const { t } = useTranslation();
  const [drugs, setDrugs] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [result, setResult] = useState<InteractionCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);

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
    try {
      setResult(await checkInteractions(drugs));
      void hapticSuccess();
    } catch {
      void hapticWarning();
      Alert.alert("Error", "Could not check interactions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <View style={s.inputRow}>
        <TextInput
          style={[s.input, { flex: 1 }]}
          value={input}
          onChangeText={setInput}
          placeholder={t("medications.interactionPlaceholder")}
          placeholderTextColor="#94a3b8"
          onSubmitEditing={addDrug}
          returnKeyType="done"
        />
        <Pressable
          style={[s.addDrugBtn, !input.trim() && { opacity: 0.5 }]}
          onPress={addDrug}
          disabled={!input.trim()}
        >
          <Text style={s.addDrugBtnText}>{t("common.add")}</Text>
        </Pressable>
      </View>

      {drugs.length > 0 && (
        <View style={s.chipWrap}>
          {drugs.map((d, i) => (
            <View key={i} style={s.drugChip}>
              <Text style={s.drugChipText}>{d}</Text>
              <Pressable onPress={() => removeDrug(i)} hitSlop={6}>
                <Text style={s.drugChipX}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Pressable
        style={[s.checkBtn, (drugs.length < 2 || loading) && { opacity: 0.5 }]}
        onPress={handleCheck}
        disabled={drugs.length < 2 || loading}
      >
        <Text style={s.checkBtnText}>
          {loading ? t("common.checking") : t("medications.checkInteractions")}
        </Text>
      </Pressable>

      {result &&
        (result.warnings && result.warnings.length > 0 ? (
          result.warnings.map((w, i) => {
            const sev = result.interactions?.[i]?.severity ?? "medium";
            return (
              <View
                key={i}
                style={[
                  s.resultCard,
                  {
                    backgroundColor: SEVERITY_BG[sev] || SEVERITY_BG.medium,
                    borderColor: SEVERITY_BORDER[sev] || SEVERITY_BORDER.medium,
                  },
                ]}
              >
                <Text
                  style={[
                    s.resultLabel,
                    { color: SEVERITY_FG[sev] || SEVERITY_FG.medium },
                  ]}
                >
                  {sev === "high" ? t("medications.highRisk") : sev === "medium" ? t("medications.caution") : t("medications.note")}
                </Text>
                <Text
                  style={[
                    s.resultText,
                    { color: SEVERITY_FG[sev] || SEVERITY_FG.medium },
                  ]}
                >
                  {w}
                </Text>
              </View>
            );
          })
        ) : result.message ? (
          <Text style={s.noResult}>{result.message}</Text>
        ) : (
          <View style={s.okCard}>
            <Text style={s.okText}>{t("medications.noInteractions")}</Text>
          </View>
        ))}

      {drugs.length < 2 && !result && (
        <Text style={s.hint}>{t("medications.minTwoDrugs")}</Text>
      )}
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────

export default function MedicationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, accessToken, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"reminders" | "interactions">("reminders");
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permAsked, setPermAsked] = useState(false);

  const loadReminders = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getReminders(accessToken);
      setReminders(data.reminders);
      await syncReminders(data.reminders);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load reminders");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (tab === "reminders" && accessToken) {
      loadReminders();
    }
  }, [tab, accessToken, loadReminders]);

  useEffect(() => {
    if (user && !permAsked) {
      setPermAsked(true);
      requestPermissions();
    }
  }, [user, permAsked]);

  const handleToggle = async (r: MedicationReminder) => {
    const next = !r.is_active;
    setReminders((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, is_active: next } : x))
    );
    try {
      await updateReminder(r.id, { is_active: next }, accessToken);
      if (next) await scheduleReminder({ ...r, is_active: true });
      else await cancelReminder(r.id);
      void hapticSuccess();
    } catch {
      setReminders((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, is_active: !next } : x))
      );
    }
  };

  const handleDelete = async (r: MedicationReminder) => {
    Alert.alert("Delete reminder", `Remove ${r.medication_name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setReminders((prev) => prev.filter((x) => x.id !== r.id));
          try {
            await deleteReminder(r.id, accessToken);
            await cancelReminder(r.id);
            void hapticWarning();
          } catch {
            loadReminders();
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      {/* Tabs */}
      <View style={s.tabRow}>
        <Pressable
          style={[s.tab, tab === "reminders" && s.tabActive]}
          onPress={() => setTab("reminders")}
        >
          <Text style={[s.tabText, tab === "reminders" && s.tabTextActive]}>
            {t("medications.myReminders")}
          </Text>
        </Pressable>
        <Pressable
          style={[s.tab, tab === "interactions" && s.tabActive]}
          onPress={() => setTab("interactions")}
        >
          <Text style={[s.tabText, tab === "interactions" && s.tabTextActive]}>
            {t("medications.interactionChecker")}
          </Text>
        </Pressable>
      </View>

      {/* Reminders */}
      {tab === "reminders" && (
        <View style={{ gap: 12 }}>
          {authLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
          ) : !user ? (
            <View style={s.authPrompt}>
              <Text style={s.authText}>{t("medications.signInReminders")}</Text>
              <Pressable style={s.signInBtn} onPress={() => router.push("/sign-in")}>
                <Text style={s.signInText}>{t("common.signIn")}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {error && <Text style={s.errText}>{error}</Text>}

              {loading && (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
              )}

              {!loading && reminders.length === 0 && (
                <View style={s.emptyBox}>
                  <Text style={s.emptyTitle}>{t("medications.noReminders")}</Text>
                  <Text style={s.emptySubtitle}>{t("medications.noRemindersHint")}</Text>
                </View>
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

              <AddReminderSection
                onCreated={(r) => setReminders((prev) => [r, ...prev])}
                token={accessToken}
              />
            </>
          )}
        </View>
      )}

      {/* Interaction Checker */}
      {tab === "interactions" && <InteractionChecker />}

      {/* Disclaimer */}
      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>{t("medications.disclaimer")}</Text>
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
  tab: { paddingHorizontal: spacing.lg, paddingVertical: 10 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { fontSize: 14, fontWeight: "500", color: colors.muted },
  tabTextActive: { color: colors.primary },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 14,
  },
  cardInactive: { opacity: 0.55 },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  medName: { fontSize: 15, fontWeight: "700", color: colors.fg },
  medDetail: { fontSize: 12, color: colors.muted, marginTop: 3 },
  medNotes: { fontSize: 12, color: colors.muted, marginTop: 4 },
  cardActions: { alignItems: "center", gap: 10 },
  deleteIcon: { fontSize: 14, color: colors.muted, fontWeight: "600" },

  addBtn: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingVertical: 16,
    alignItems: "center",
  },
  addBtnText: { fontSize: 14, color: colors.muted },

  formCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
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
  freqRow: { maxHeight: 40 },
  freqChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  freqChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  freqChipText: { fontSize: 12, color: colors.muted, fontWeight: "500" },
  freqChipTextActive: { color: "#fff" },
  formActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  cancelBtnText: { color: colors.muted, fontSize: 14 },

  inputRow: { flexDirection: "row", gap: 8 },
  addDrugBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: "center",
  },
  addDrugBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  drugChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "#ecfdf5",
  },
  drugChipText: { fontSize: 13, color: colors.primary },
  drugChipX: { fontSize: 12, color: colors.primary, fontWeight: "700" },
  checkBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  checkBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  resultCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  resultLabel: { fontSize: 12, fontWeight: "700", marginBottom: 2 },
  resultText: { fontSize: 13, lineHeight: 19 },
  okCard: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "#ecfdf5",
    borderRadius: 10,
    padding: 12,
  },
  okText: { fontSize: 13, color: colors.primary },
  noResult: { fontSize: 13, color: colors.muted, textAlign: "center", paddingVertical: 12 },
  hint: { fontSize: 13, color: colors.muted },

  authPrompt: { alignItems: "center", paddingVertical: 32, gap: 12 },
  authText: { fontSize: 14, color: colors.muted, textAlign: "center" },
  signInBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  signInText: { color: "#fff", fontWeight: "600" },

  errText: { color: colors.error, fontSize: 13, textAlign: "center", paddingVertical: 8 },
  emptyBox: { alignItems: "center", paddingVertical: 24 },
  emptyTitle: { fontSize: 14, color: colors.muted },
  emptySubtitle: { fontSize: 12, color: colors.muted, marginTop: 4 },

  disclaimer: {
    marginTop: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  disclaimerText: { fontSize: 11, color: colors.muted, lineHeight: 17 },
});
