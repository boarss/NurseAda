import { Link, Stack } from "expo-router";
import { Text, View, StyleSheet, Pressable } from "react-native";

export default function HomeScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "NurseAda" }} />
      <View style={styles.container}>
        <Text style={styles.title}>NurseAda</Text>
        <Text style={styles.subtitle}>
          Your 24/7 AI health assistant. Symptom guidance, medications, and
          support in English and local languages.
        </Text>
        <Link href="/chat" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Start chat</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  button: {
    backgroundColor: "#059669",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
