import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { sendChatMessage, getPatient, type ChatMessage, type PatientSummary } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { LanguagePicker } from "../components/LanguagePicker";
import { theme } from "../lib/theme";
import { hapticNudge } from "../lib/haptics";

const { colors, spacing, radius } = theme;

type UIMessage = {
  role: "user" | "assistant";
  text: string;
  imageUri?: string | null;
};

export default function ChatScreen() {
  const { t, i18n } = useTranslation();
  const { user, patientCode, getValidAccessToken } = useAuth();

  const suggestedPrompts = [
    t("chat.promptHeadache"),
    t("chat.promptFever"),
    t("chat.promptDrugCombo"),
    t("chat.promptHerbalNausea"),
    t("chat.promptJointPain"),
    t("chat.promptXray"),
  ];
  const router = useRouter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [patientSummary, setPatientSummary] = useState<PatientSummary | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const id = patientId.trim();
    if (!id || !user) {
      setPatientSummary(null);
      return;
    }
    const timeout = setTimeout(() => {
      void (async () => {
        const token = await getValidAccessToken();
        if (!token) {
          setPatientSummary(null);
          return;
        }
        getPatient(id, token)
          .then(setPatientSummary)
          .catch(() => setPatientSummary(null));
      })();
    }, 500);
    return () => clearTimeout(timeout);
  }, [patientId, user, getValidAccessToken]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t("chat.permissionNeeded"),
        t("chat.photoPermission")
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      if (asset.base64) {
        setImageBase64(asset.base64);
      } else if (asset.uri) {
        try {
          const b64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setImageBase64(b64);
        } catch {
          setImageBase64(null);
        }
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t("chat.permissionNeeded"),
        t("chat.cameraPermission")
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      if (asset.base64) {
        setImageBase64(asset.base64);
      } else if (asset.uri) {
        try {
          const b64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setImageBase64(b64);
        } catch {
          setImageBase64(null);
        }
      }
    }
  };

  const handleAttach = () => {
    Alert.alert(t("chat.attachTitle"), t("chat.attachSubtitle"), [
      { text: t("chat.camera"), onPress: takePhoto },
      { text: t("chat.photoLibrary"), onPress: pickImage },
      { text: t("common.cancel"), style: "cancel" },
    ]);
  };

  const removeImage = () => {
    setImageUri(null);
    setImageBase64(null);
  };

  const send = async () => {
    const text = input.trim() || (imageBase64 ? t("chat.analyzeImage") : "");
    if (!text || loading) return;

    const currentUri = imageUri;
    const currentB64 = imageBase64;
    setInput("");
    setImageUri(null);
    setImageBase64(null);

    const userMsg: UIMessage = { role: "user", text, imageUri: currentUri };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    void hapticNudge();
    try {
      const token = await getValidAccessToken();
      if (!token) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: t("chat.serverError") },
        ]);
        return;
      }
      const history: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.text,
      }));
      history.push({ role: "user", content: text });
      const { reply } = await sendChatMessage(history, {
        token,
        imageBase64: currentB64 || undefined,
        patientId: patientId.trim() || undefined,
        locale: i18n.language,
      });
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: t("chat.serverError"),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {user ? (
        <>
          {patientCode ? (
            <View style={styles.nurseAdaIdRow}>
              <Text style={styles.nurseAdaIdLabel}>
                {t("chat.yourPatientId")}:{" "}
              </Text>
              <Text style={styles.nurseAdaIdValue}>{patientCode}</Text>
            </View>
          ) : null}
          <View style={styles.patientRow}>
            <TextInput
              style={styles.patientInput}
              value={patientId}
              onChangeText={setPatientId}
              placeholder={t("chat.patientId")}
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
            />
            <LanguagePicker />
            {patientId.trim() !== "" && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/patient",
                    params: { id: patientId.trim() },
                  })
                }
              >
                <Text style={styles.profileLink}>{t("common.profile")}</Text>
              </Pressable>
            )}
          </View>
          {patientId.trim() === "" ? (
            <View style={styles.independentHintRow}>
              <Text style={styles.independentHintText}>
                {t("chat.independentHint")}
              </Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.guestBanner}>
          <Text style={styles.guestText}>
            {t("chat.guestMode")}
          </Text>
          <LanguagePicker />
        </View>
      )}
      {patientSummary && (
        <View style={styles.summaryBanner}>
          <Text style={styles.summaryLabel}>{t("chat.patient")} </Text>
          <Text style={styles.summaryValue}>
            {(() => {
              const n = patientSummary.name?.[0];
              const given = n?.given?.join(" ") ?? "";
              const name = [given, n?.family].filter(Boolean).join(" ") || patientSummary.id || "";
              const parts = [name];
              if (patientSummary.birthDate) {
                const yrs = Math.floor(
                  (Date.now() - new Date(patientSummary.birthDate).getTime()) / 31_557_600_000
                );
                parts.push(`${yrs}y`);
              }
              if (patientSummary.gender) parts.push(patientSummary.gender);
              return parts.join(", ");
            })()}
          </Text>
        </View>
      )}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === "user" ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            {item.role === "user" && item.imageUri && (
              <Image
                source={{ uri: item.imageUri }}
                style={styles.bubbleImage}
                resizeMode="cover"
              />
            )}
            <Text
              style={
                item.role === "user" ? styles.userText : styles.assistantText
              }
            >
              {item.text}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {t("chat.emptyState")}
            </Text>
            <View style={styles.promptsWrap}>
              {suggestedPrompts.map((p) => (
                <Pressable
                  key={p}
                  style={({ pressed }) => [styles.promptChip, pressed && styles.buttonPressed]}
                  onPress={() => {
                    setInput(p);
                  }}
                >
                  <Text style={styles.promptChipText}>{p}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
      />
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>{t("chat.thinking")}</Text>
        </View>
      )}

      {imageUri && (
        <View style={styles.previewRow}>
          <Image source={{ uri: imageUri }} style={styles.previewThumb} />
          <Text style={styles.previewLabel}>{t("chat.imageAttached")}</Text>
          <Pressable onPress={removeImage}>
            <Text style={styles.previewRemove}>{t("common.remove")}</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.inputRow}>
        <Pressable style={styles.attachBtn} onPress={handleAttach}>
          <Text style={styles.attachIcon}>📷</Text>
        </Pressable>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={t("chat.placeholder")}
          placeholderTextColor={colors.muted}
          returnKeyType="send"
          onSubmitEditing={send}
          editable={!loading}
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            (!input.trim() && !imageBase64 || loading) && styles.sendBtnDisabled,
            pressed && !loading && (input.trim() || imageBase64) && styles.buttonPressed,
          ]}
          onPress={send}
          disabled={(!input.trim() && !imageBase64) || loading}
        >
          <Text style={styles.sendText}>{t("common.send")}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  buttonPressed: { opacity: 0.85 },
  nurseAdaIdRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: "#ecfdf5",
    gap: 4,
  },
  nurseAdaIdLabel: { fontSize: 12, color: colors.muted },
  nurseAdaIdValue: { fontSize: 13, color: colors.fg, fontWeight: "700" },
  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  patientInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    backgroundColor: colors.bg,
  },
  profileLink: { fontSize: 13, color: colors.primary, fontWeight: "600" },
  independentHintRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  independentHintText: { fontSize: 11, color: colors.muted, lineHeight: 16 },
  summaryBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: "#ecfdf5",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryLabel: { fontSize: 13, color: colors.primary, fontWeight: "600" },
  summaryValue: { fontSize: 13, color: colors.fg },
  guestBanner: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  guestText: { fontSize: 12, color: "#92400e" },
  list: { padding: spacing.lg, paddingBottom: spacing.sm },
  bubble: {
    maxWidth: "85%",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  userBubble: {
    backgroundColor: colors.bubbleUser,
    alignSelf: "flex-end",
  },
  assistantBubble: {
    backgroundColor: colors.bubbleAssistant,
    alignSelf: "flex-start",
  },
  bubbleImage: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    marginBottom: 6,
  },
  userText: { color: "#fff", fontSize: 15, lineHeight: 21 },
  assistantText: { color: colors.fg, fontSize: 15, lineHeight: 21 },
  empty: { paddingVertical: 48, paddingHorizontal: spacing.lg, alignItems: "center" },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: spacing.lg },
  promptsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  promptChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    minHeight: 44,
  },
  promptChipText: { fontSize: 13, color: colors.primary },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  loadingText: { fontSize: 13, color: colors.muted },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  previewThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
  },
  previewLabel: { fontSize: 13, color: colors.muted, flex: 1 },
  previewRemove: { fontSize: 13, color: colors.error },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  attachBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    backgroundColor: colors.bg,
  },
  attachIcon: { fontSize: 18 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: colors.bg,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radius.card,
    minHeight: 44,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
