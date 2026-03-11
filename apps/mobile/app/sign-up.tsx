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
import { Link } from "expo-router";
import { useAuth } from "../lib/AuthContext";
import { theme } from "../lib/theme";
import { hapticSuccess, hapticWarning } from "../lib/haptics";

const { colors, spacing, radius } = theme;

export default function SignUpScreen() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || !password) return;
    if (password !== confirm) {
      Alert.alert(t("common.error"), t("auth.passwordsMismatch"));
      return;
    }
    if (password.length < 6) {
      Alert.alert(t("common.error"), t("auth.passwordTooShort"));
      return;
    }
    setSubmitting(true);
    const err = await signUp(email.trim(), password);
    setSubmitting(false);
    if (err) {
      Alert.alert("Sign up failed", err);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t("auth.checkEmail")}</Text>
        <Text style={styles.subtitle}>
          {t("auth.confirmationSent", { email })}
        </Text>
        <Link href="/sign-in" style={styles.link}>
          <Text style={[styles.linkText, styles.linkBold]}>{t("auth.goToSignIn")}</Text>
        </Link>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{t("auth.createAccount")}</Text>
        <Text style={styles.subtitle}>
          {t("auth.signUpSubtitle")}
        </Text>

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
          placeholder={t("auth.passwordHint")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />
        <TextInput
          style={styles.input}
          placeholder={t("auth.repeatPassword")}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoComplete="new-password"
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            submitting && styles.buttonDisabled,
            pressed && !submitting && styles.buttonPressed,
          ]}
          onPress={handleSignUp}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>
            {submitting ? t("common.creatingAccount") : t("auth.createAccount")}
          </Text>
        </Pressable>

        <Text style={styles.disclaimer}>
          {t("auth.signUpDisclaimer")}
        </Text>

        <Link href="/sign-in" style={styles.link}>
          <Text style={styles.linkText}>
            {t("auth.alreadyHaveAccount")}{" "}
            <Text style={styles.linkBold}>{t("common.signIn")}</Text>
          </Text>
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
  disclaimer: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.lg,
    lineHeight: 18,
  },
  link: { marginTop: 18, alignSelf: "center" },
  linkText: { fontSize: 14, color: colors.muted, textAlign: "center" },
  linkBold: { color: colors.primary, fontWeight: "600" },
});
