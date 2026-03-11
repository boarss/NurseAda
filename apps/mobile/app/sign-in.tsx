import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter, Link } from "expo-router";
import { useAuth } from "../lib/AuthContext";
import { theme } from "../lib/theme";
import { hapticSuccess, hapticWarning } from "../lib/haptics";

const { colors, spacing, radius } = theme;

export default function SignInScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) return;
    setSubmitting(true);
    const err = await signIn(email.trim(), password);
    setSubmitting(false);
    if (err) {
      void hapticWarning();
      Alert.alert("Sign in failed", err);
    } else {
      void hapticSuccess();
      router.replace("/");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{t("auth.welcomeBack")}</Text>
        <Text style={styles.subtitle}>{t("auth.signInSubtitle")}</Text>

        <TextInput
          style={styles.input}
          placeholder={t("auth.emailPlaceholder")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder={t("auth.passwordPlaceholder")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            submitting && styles.buttonDisabled,
            pressed && !submitting && styles.buttonPressed,
          ]}
          onPress={handleSignIn}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>
            {submitting ? t("common.signingIn") : t("common.signIn")}
          </Text>
        </Pressable>

        <Link href="/sign-up" style={styles.link}>
          <Text style={styles.linkText}>
            {t("auth.noAccount")} <Text style={styles.linkBold}>{t("auth.createOne")}</Text>
          </Text>
        </Link>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{t("auth.continueAsGuest")}</Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.fg,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    marginBottom: 28,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.card,
    alignItems: "center",
    marginTop: spacing.xs,
    minHeight: 44,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { marginTop: 18, alignSelf: "center" },
  linkText: { fontSize: 14, color: colors.muted, textAlign: "center" },
  linkBold: { color: colors.primary, fontWeight: "600" },
});
