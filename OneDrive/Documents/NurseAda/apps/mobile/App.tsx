import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Button, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import type { ChatMessage } from "@nurseada/shared-ts/types";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function sendChat(messages: ChatMessage[]): Promise<ChatMessage | null> {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, locale: "en", country: "NG" }),
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.message as ChatMessage;
  } catch {
    return null;
  }
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setText("");
    setLoading(true);
    const reply = await sendChat(nextMessages);
    if (reply) {
      setMessages([...nextMessages, reply]);
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#020617" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, padding: 16 }}
      >
        <View style={{ marginBottom: 8 }}>
          <Text style={{ color: "#e2e8f0", fontSize: 20, fontWeight: "600" }}>NurseAda</Text>
          <Text style={{ color: "#94a3b8", fontSize: 12 }}>
            Friendly health chat. For emergencies, go to the nearest hospital or call your local emergency number.
          </Text>
        </View>
        <ScrollView style={{ flex: 1, marginBottom: 8 }}>
          {messages.length === 0 ? (
            <Text style={{ color: "#64748b", fontSize: 12 }}>
              Ask about your symptoms, medicines, or general health. I’ll respond in simple language.
            </Text>
          ) : (
            messages.map((m, idx) => (
              <View
                key={idx}
                style={{
                  alignItems: m.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 6,
                }}
              >
                <View
                  style={{
                    maxWidth: "80%",
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: m.role === "user" ? "#22c55e" : "#0f172a",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: m.role === "user" ? "#020617" : "#e2e8f0",
                    }}
                  >
                    {m.content}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            style={{
              flex: 1,
              borderRadius: 999,
              backgroundColor: "#020617",
              borderWidth: 1,
              borderColor: "#1e293b",
              paddingHorizontal: 12,
              paddingVertical: 8,
              color: "#e2e8f0",
              fontSize: 12,
            }}
            placeholder="Type your question..."
            placeholderTextColor="#64748b"
            value={text}
            onChangeText={setText}
          />
          <Button title={loading ? "..." : "Send"} onPress={handleSend} disabled={loading} />
        </View>
        <StatusBar style="light" />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

