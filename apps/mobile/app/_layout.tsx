import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { AuthProvider } from "../lib/AuthContext";
import "../lib/i18n";

export default function RootLayout() {
  const { t } = useTranslation();

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#059669" },
          headerTintColor: "#fff",
        }}
      >
        <Stack.Screen name="index" options={{ title: t("meta.appName") }} />
        <Stack.Screen name="chat" options={{ title: t("chat.title") }} />
        <Stack.Screen name="remedies" options={{ title: t("remedies.title") }} />
        <Stack.Screen name="medications" options={{ title: t("medications.title") }} />
        <Stack.Screen name="appointments" options={{ title: t("appointments.title") }} />
        <Stack.Screen name="patient" options={{ title: t("patient.title") }} />
        <Stack.Screen name="sign-in" options={{ title: t("common.signIn") }} />
        <Stack.Screen name="sign-up" options={{ title: t("common.signUp") }} />
      </Stack>
    </AuthProvider>
  );
}
