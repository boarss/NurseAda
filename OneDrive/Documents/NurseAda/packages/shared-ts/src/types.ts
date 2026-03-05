export type Locale = "en" | "pcm" | "ha" | "yo" | "ig";

export type ChatMessageRole = "user" | "assistant" | "system";

export type ChatMessage = {
  role: ChatMessageRole;
  content: string;
  createdAt?: string;
};

export type ChatRequest = {
  messages: ChatMessage[];
  locale?: Locale;
  country?: string;
  userId?: string;
};

export type ChatResponse = {
  message: ChatMessage;
  safety: {
    emergency: boolean;
    confidence: number; // 0..1
    disclaimers: string[];
  };
  citations?: { title: string; url?: string }[];
  traceId: string;
};

