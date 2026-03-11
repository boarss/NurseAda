import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  FlatList,
} from "react-native";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "pcm", flag: "🇳🇬", label: "Pidgin" },
  { code: "ha", flag: "🇳🇬", label: "Hausa" },
  { code: "yo", flag: "🇳🇬", label: "Yorùbá" },
  { code: "ig", flag: "🇳🇬", label: "Igbo" },
] as const;

export function LanguagePicker() {
  const { i18n, t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const select = (code: string) => {
    i18n.changeLanguage(code);
    setVisible(false);
  };

  return (
    <>
      <Pressable
        style={styles.trigger}
        onPress={() => setVisible(true)}
        accessibilityLabel={t("language.select")}
        accessibilityRole="button"
      >
        <Text style={styles.triggerText}>
          {current.flag} {t(`language.${current.code}`)}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{t("language.select")}</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.option,
                    item.code === i18n.language && styles.optionActive,
                  ]}
                  onPress={() => select(item.code)}
                >
                  <Text style={styles.optionFlag}>{item.flag}</Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      item.code === i18n.language && styles.optionLabelActive,
                    ]}
                  >
                    {t(`language.${item.code}`)}
                  </Text>
                  {item.code === i18n.language && (
                    <Text style={styles.check}>✓</Text>
                  )}
                </Pressable>
              )}
            />
            <Pressable
              style={styles.closeBtn}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.closeBtnText}>{t("common.close")}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  triggerText: { fontSize: 13, color: "#059669", fontWeight: "600" },
  chevron: { fontSize: 12, color: "#94a3b8" },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 36,
    paddingHorizontal: 20,
    maxHeight: "50%",
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 16,
    textAlign: "center",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  optionActive: { backgroundColor: "#ecfdf5" },
  optionFlag: { fontSize: 20 },
  optionLabel: { fontSize: 16, color: "#0f172a", flex: 1 },
  optionLabelActive: { color: "#059669", fontWeight: "600" },
  check: { fontSize: 16, color: "#059669", fontWeight: "700" },
  closeBtn: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  closeBtnText: { fontSize: 15, color: "#64748b", fontWeight: "600" },
});
