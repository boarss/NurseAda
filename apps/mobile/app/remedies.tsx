import { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { getHerbalCatalog, type HerbalRemedy } from "../lib/api";
import { theme } from "../lib/theme";

const { colors, spacing, radius } = theme;

const CONDITION_CHIPS = [
  "All",
  "nausea",
  "malaria",
  "cough",
  "headache",
  "diarrhea",
  "fever",
  "pain",
  "fatigue",
  "hypertension",
  "skin",
  "toothache",
  "congestion",
];

const EVIDENCE_BG: Record<string, string> = {
  strong: "#ecfdf5",
  moderate: "#fffbeb",
  limited: "#f5f5f4",
  traditional: "#f5f5f4",
};
const EVIDENCE_FG: Record<string, string> = {
  strong: "#059669",
  moderate: "#d97706",
  limited: "#64748b",
  traditional: "#64748b",
};

function extractName(text: string): string {
  const m = text.match(/\*\*(.+?)\*\*/);
  return m ? m[1] : text.slice(0, 40);
}

function stripBold(text: string): string {
  return text.replace(/\*\*/g, "");
}

export default function RemediesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [remedies, setRemedies] = useState<HerbalRemedy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("All");
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getHerbalCatalog()
      .then((d) => setRemedies(d.items))
      .catch((e: any) => setError(e?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = remedies;
    if (active !== "All") {
      list = list.filter(
        (r) =>
          r.condition.toLowerCase().includes(active) ||
          r.keywords.some((kw) => kw.includes(active))
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.text.toLowerCase().includes(q) ||
          r.condition.toLowerCase().includes(q) ||
          r.keywords.some((kw) => kw.includes(q))
      );
    }
    return list;
  }, [remedies, active, search]);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={s.loadingText}>{t("remedies.loading")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.center}>
        <Text style={s.errText}>{error}</Text>
        <Pressable style={s.retryBtn} onPress={() => router.back()}>
          <Text style={s.retryText}>{t("common.back")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <TextInput
        style={s.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder={t("remedies.searchPlaceholder")}
        placeholderTextColor="#94a3b8"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.chipRow}
        contentContainerStyle={s.chipContent}
      >
        {CONDITION_CHIPS.map((c) => (
          <Pressable
            key={c}
            onPress={() => {
              setActive(c);
              setExpanded(null);
            }}
            style={[s.chip, active === c && s.chipActive]}
          >
            <Text style={[s.chipText, active === c && s.chipTextActive]}>
              {c === "All" ? t("remedies.all") : c.charAt(0).toUpperCase() + c.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {filtered.length === 0 && (
        <Text style={s.emptyText}>{t("remedies.noResults")}</Text>
      )}

      {filtered.map((r, i) => {
        const name = extractName(r.text);
        const isOpen = expanded === i;
        return (
          <Pressable
            key={`${r.condition}-${i}`}
            onPress={() => setExpanded(isOpen ? null : i)}
            style={s.card}
          >
            <View style={s.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{name}</Text>
                <Text style={s.cardCondition}>{r.condition}</Text>
              </View>
              <View
                style={[
                  s.badge,
                  { backgroundColor: EVIDENCE_BG[r.evidence_level] || "#f5f5f4" },
                ]}
              >
                <Text
                  style={[
                    s.badgeText,
                    { color: EVIDENCE_FG[r.evidence_level] || "#64748b" },
                  ]}
                >
                  {r.evidence_label || r.evidence_level}
                </Text>
              </View>
            </View>

            {isOpen && (
              <View style={s.cardBody}>
                <Text style={s.bodyText}>{stripBold(r.text)}</Text>
                {r.contraindications.length > 0 && (
                  <View style={s.warnBox}>
                    <Text style={s.warnTitle}>{t("remedies.avoidIf")}</Text>
                    <Text style={s.warnText}>
                      {r.contraindications.join(", ")}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Pressable>
        );
      })}

      <View style={s.disclaimer}>
        <Text style={s.disclaimerText}>{t("remedies.disclaimer")}</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fafaf9" },
  content: { padding: 16, paddingBottom: 48 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: { marginTop: 8, fontSize: 14, color: "#64748b" },
  errText: { color: "#dc2626", fontSize: 14, textAlign: "center" },
  retryBtn: {
    marginTop: 16,
    backgroundColor: "#059669",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: "#fff", fontWeight: "600" },
  searchInput: {
    borderWidth: 1,
    borderColor: "#e7e5e4",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  chipRow: { marginBottom: 14, maxHeight: 40 },
  chipContent: { gap: 8, paddingRight: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e7e5e4",
    backgroundColor: "#fff",
  },
  chipActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  chipText: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14,
    paddingVertical: 32,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e7e5e4",
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 14,
    gap: 10,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  cardCondition: {
    fontSize: 12,
    color: "#64748b",
    textTransform: "capitalize",
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: { fontSize: 10, fontWeight: "600" },
  cardBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 0,
  },
  bodyText: { fontSize: 13, color: "#0f172a", lineHeight: 20 },
  warnBox: {
    marginTop: 10,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 8,
    padding: 10,
  },
  warnTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#dc2626",
    marginBottom: 2,
  },
  warnText: { fontSize: 12, color: "#dc2626" },
  disclaimer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e7e5e4",
  },
  disclaimerText: { fontSize: 11, color: "#94a3b8", lineHeight: 17 },
});
