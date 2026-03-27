import { useEffect, useRef } from "react";
import { Link } from "expo-router";
import { Text, View, StyleSheet, Pressable, Animated } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../lib/AuthContext";
import { LanguagePicker } from "../components/LanguagePicker";
import { theme } from "../lib/theme";
import { hapticNudge } from "../lib/haptics";

const { colors, spacing, radius } = theme;

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user, signOut, loading, patientCode } = useAuth();
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
        <Text style={styles.title}>{t("meta.appName")}</Text>
        <Text style={styles.subtitle}>{t("home.subtitle")}</Text>
      </Animated.View>
      <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      <Link href="/chat" asChild>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPressIn={() => void hapticNudge()}
        >
          <Text style={styles.buttonText}>{t("home.startChat")}</Text>
        </Pressable>
      </Link>
      <Link href="/remedies" asChild>
        <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
          <Text style={styles.secondaryButtonText}>{t("remedies.title")}</Text>
        </Pressable>
      </Link>
      <Link href="/medications" asChild>
        <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
          <Text style={styles.secondaryButtonText}>{t("home.medications")}</Text>
        </Pressable>
      </Link>
      <Link href="/appointments" asChild>
        <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
          <Text style={styles.secondaryButtonText}>{t("home.appointments")}</Text>
        </Pressable>
      </Link>
      </Animated.View>

      {!loading && (
        <View style={styles.authRow}>
          {user ? (
            <>
              <View style={styles.authUserCol}>
                <Text style={styles.authEmail} numberOfLines={1}>
                  {user.email}
                </Text>
                {patientCode ? (
                  <Text style={styles.patientCodeText} numberOfLines={1}>
                    {t("chat.yourPatientId")}: {patientCode}
                  </Text>
                ) : null}
              </View>
              <Pressable onPress={() => void signOut()}>
                <Text style={styles.authLink}>{t("common.signOut")}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Link href="/sign-in" asChild>
                <Pressable style={({ pressed }) => pressed && styles.buttonPressed}>
                  <Text style={styles.authLink}>{t("common.signIn")}</Text>
                </Pressable>
              </Link>
              <Link href="/sign-up" asChild>
                <Pressable style={({ pressed }) => pressed && styles.buttonPressed}>
                  <Text style={styles.authLinkBold}>{t("common.signUp")}</Text>
                </Pressable>
              </Link>
            </>
          )}
        </View>
      )}
      <View>
        <LanguagePicker />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.fg,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    textAlign: "center",
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: radius.card,
    minHeight: 44,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  authUserCol: { alignItems: "center", maxWidth: 200 },
  patientCodeText: { fontSize: 11, color: colors.primary, fontWeight: "600", marginTop: 2 },
  authRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    marginTop: 28,
  },
  authEmail: {
    fontSize: 13,
    color: colors.muted,
    maxWidth: 180,
  },
  authLink: {
    fontSize: 14,
    color: colors.primary,
  },
  authLinkBold: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  secondaryButton: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderRadius: radius.card,
    minHeight: 44,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
