/**
 * Client-side API helpers for NurseAda gateway.
 *
 * Local: NEXT_PUBLIC_GATEWAY_URL=http://localhost:8080 (direct to gateway).
 * Vercel: NEXT_PUBLIC_GATEWAY_URL=/api/gateway and set server-side GATEWAY_URL to the real gateway origin.
 */
import type { ClinicalDiagnosis } from "@/lib/clinical/diagnosisEngine";
import type { ExtractedSymptom } from "@/lib/clinical/extractSymptoms";

function gatewayBase(): string {
  const raw = (process.env.NEXT_PUBLIC_GATEWAY_URL ?? "http://localhost:8080").trim();
  if (raw.endsWith("/") && raw.length > 1) return raw.slice(0, -1);
  return raw;
}

/** Full URL to a gateway path (supports absolute base or same-origin prefix e.g. /api/gateway). */
function gatewayUrl(path: string): string {
  const base = gatewayBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function authHeaders(token?: string | null): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

/** Generic authenticated fetch to gateway; path is relative (e.g. "/admin/clinics"). */
export async function apiFetch<T = unknown>(
  path: string,
  options?: { token?: string | null; method?: string; body?: unknown }
): Promise<T> {
  const res = await fetch(gatewayUrl(path), {
    method: options?.method ?? "GET",
    headers: authHeaders(options?.token),
    ...(options?.body !== undefined && { body: JSON.stringify(options.body) }),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Please sign in to continue.");
    const text = await res.text();
    let msg = "Request failed";
    try {
      const parsed = text ? JSON.parse(text) : {};
      msg = parsed.detail ?? parsed.message ?? msg;
    } catch {
      if (res.status >= 500) msg = "Server error. Please try again shortly.";
    }
    throw new Error(typeof msg === "string" ? msg : "Request failed");
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export async function healthCheck(): Promise<{ status: "healthy" | "unhealthy" }> {
  const res = await fetch(gatewayUrl("/health"), { cache: "no-store" });
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}
// Types for chat
export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ChatOptions = {
  patientId?: string | null;                // send as string to backend
  imageBase64?: string | null;
  token?: string | null;
  locale?: "en" | "pcm" | "ha" | "yo" | "ig" | null;
};

export type ChatResponse = string; // backend reply text
export type ClinicalTrace = {
  extracted_symptoms: ExtractedSymptom[];
  diagnosis: ClinicalDiagnosis;
  recommendations: string[];
};

export async function sendChatMessage(
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<{ reply: ChatResponse; clinical?: ClinicalTrace | null }> {
  type BodyType = {
    messages: ChatMessage[];
    patient_id?: string | null;
    image_base64?: string | null;
    locale?: string | null;
  };

  const body: BodyType = {
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };

  if (options?.patientId) body.patient_id = options.patientId;
  if (options?.imageBase64) body.image_base64 = options.imageBase64;
  if (options?.locale) body.locale = options.locale;

  const res = await fetch(gatewayUrl("/chat"), {
    method: "POST",
    headers: authHeaders(options?.token),
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    let msg = "Chat request failed";
    try {
      const parsed = text ? JSON.parse(text) : {};
      if (parsed.detail) {
        msg =
          typeof parsed.detail === "string"
            ? parsed.detail
            : parsed.detail[0]?.msg ?? msg;
      } else if (parsed.message) {
        msg = parsed.message;
      }
    } catch {
      if (res.status === 401) msg = "Please sign in to continue.";
      else if (res.status === 404)
        msg = "Gateway not found. Ensure the gateway is running.";
      else if (res.status >= 500)
        msg = "Server error. Please try again shortly.";
    }
    throw new Error(msg);
  }

  return text ? JSON.parse(text) : { reply: "", clinical: null };
}

// ── Herbal catalog ──────────────────────────────────────────────────

export type HerbalRemedy = {
  text: string;
  source: string;
  condition: string;
  evidence_level: string;
  evidence_label: string;
  contraindications: string[];
  keywords: string[];
};

export type HerbalCatalogResponse = {
  items: HerbalRemedy[];
  total: number;
};

export async function getHerbalCatalog(
  condition?: string
): Promise<HerbalCatalogResponse> {
  const params = condition ? `?condition=${encodeURIComponent(condition)}` : "";
  const res = await fetch(`${gatewayUrl("/herbal/catalog")}${params}`);
  if (!res.ok) {
    if (res.status === 503) throw new Error("Herbal catalog is not configured");
    throw new Error("Failed to fetch herbal catalog");
  }
  return res.json();
}

// ── Medication reminders ─────────────────────────────────────────────

export type MedicationReminder = {
  id: string;
  user_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  reminder_times: string[];
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type ReminderCreatePayload = {
  medication_name: string;
  dosage?: string;
  frequency?: string;
  reminder_times?: string[];
  start_date?: string;
  end_date?: string | null;
  notes?: string;
};

export async function getReminders(
  token?: string | null
): Promise<{ reminders: MedicationReminder[] }> {
  const res = await fetch(gatewayUrl("/medications/reminders"), {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Please sign in to view medication reminders.");
    if (res.status === 503) throw new Error("Medication reminders are not configured.");
    throw new Error("Failed to fetch reminders");
  }
  return res.json();
}

export async function createReminder(
  data: ReminderCreatePayload,
  token?: string | null
): Promise<MedicationReminder> {
  const res = await fetch(gatewayUrl("/medications/reminders"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Please sign in to create reminders.");
    throw new Error("Failed to create reminder");
  }
  return res.json();
}

export async function updateReminder(
  id: string,
  fields: Partial<MedicationReminder>,
  token?: string | null
): Promise<MedicationReminder> {
  const res = await fetch(gatewayUrl(`/medications/reminders/${id}`), {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(fields),
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("Reminder not found.");
    throw new Error("Failed to update reminder");
  }
  return res.json();
}

export async function deleteReminder(
  id: string,
  token?: string | null
): Promise<void> {
  const res = await fetch(gatewayUrl(`/medications/reminders/${id}`), {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("Reminder not found.");
    throw new Error("Failed to delete reminder");
  }
}

// ── Drug interaction checker ─────────────────────────────────────────

export type InteractionResult = {
  drug_a?: string;
  drug_b?: string;
  severity?: string;
  message?: string;
};

export type InteractionCheckResponse = {
  interactions: InteractionResult[];
  warnings: string[];
  codes_checked?: Array<{ name?: string; code?: string }>;
  message?: string;
};

export async function checkInteractions(
  drugs: string[]
): Promise<InteractionCheckResponse> {
  const res = await fetch(gatewayUrl("/medications/check-interactions"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ drugs }),
  });
  if (!res.ok) throw new Error("Interaction check failed");
  return res.json();
}

// ── Clinic directory & appointments ──────────────────────────────────

export type Clinic = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  specialties: string[];
  facility_type: string;
  accepts_telemedicine: boolean;
  hours: string;
};

export type Appointment = {
  id: string;
  user_id: string;
  clinic_name: string;
  clinic_id: string | null;
  specialty: string;
  appointment_type: string;
  reason: string;
  preferred_date: string | null;
  preferred_time: string | null;
  status: string;
  severity: string | null;
  referral_agent: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type AppointmentCreatePayload = {
  clinic_name: string;
  clinic_id?: string | null;
  specialty?: string;
  appointment_type?: string;
  reason?: string;
  preferred_date?: string | null;
  preferred_time?: string | null;
  notes?: string;
};

export async function getClinics(
  filters?: { state?: string; specialty?: string; type?: string; q?: string }
): Promise<{ clinics: Clinic[]; total: number }> {
  const params = new URLSearchParams();
  if (filters?.state) params.set("state", filters.state);
  if (filters?.specialty) params.set("specialty", filters.specialty);
  if (filters?.type) params.set("type", filters.type);
  if (filters?.q) params.set("q", filters.q);
  const qs = params.toString();
  const res = await fetch(
    `${gatewayUrl("/appointments/clinics")}${qs ? `?${qs}` : ""}`
  );
  if (!res.ok) throw new Error("Failed to fetch clinic directory");
  return res.json();
}

export async function getAppointments(
  token?: string | null
): Promise<{ appointments: Appointment[] }> {
  const res = await fetch(gatewayUrl("/appointments"), {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Please sign in to view appointments.");
    if (res.status === 503) throw new Error("Appointments are not configured.");
    throw new Error("Failed to fetch appointments");
  }
  return res.json();
}

export async function createAppointment(
  data: AppointmentCreatePayload,
  token?: string | null
): Promise<Appointment> {
  const res = await fetch(gatewayUrl("/appointments"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Please sign in to book appointments.");
    throw new Error("Failed to create appointment");
  }
  return res.json();
}

export async function updateAppointment(
  id: string,
  fields: Partial<Appointment>,
  token?: string | null
): Promise<Appointment> {
  const res = await fetch(gatewayUrl(`/appointments/${id}`), {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(fields),
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("Appointment not found.");
    throw new Error("Failed to update appointment");
  }
  return res.json();
}

export async function deleteAppointment(
  id: string,
  token?: string | null
): Promise<void> {
  const res = await fetch(gatewayUrl(`/appointments/${id}`), {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("Appointment not found.");
    throw new Error("Failed to delete appointment");
  }
}

// ── Feedback ────────────────────────────────────────────────────────

export type FeedbackPayload = {
  conversationId?: string | null;
  messageId?: string | null;
  agentId?: string | null;
  rating: number;
  comment?: string | null;
  token?: string | null;
};

export async function sendFeedback(payload: FeedbackPayload): Promise<void> {
  const body = {
    conversation_id: payload.conversationId ?? null,
    message_id: payload.messageId ?? null,
    agent_id: payload.agentId ?? null,
    rating: payload.rating,
    comment: payload.comment ?? "",
  };
  await fetch(gatewayUrl("/feedback"), {
    method: "POST",
    headers: authHeaders(payload.token),
    body: JSON.stringify(body),
  });
}

export type MedicalFeedbackPayload = {
  sourceUrl: string;
  conversationId?: string | null;
  messageId?: string | null;
  agentId?: string | null;
  rating: number;
  comment?: string | null;
  maxPages?: number;
  token?: string | null;
};

export type MedicalFeedbackResponse = {
  status: string;
  crawl_status?: string;
  pages_captured?: number;
  disclaimer?: string;
};

/** Signed-in only: records RLHF feedback plus Cloudflare crawl excerpts from allowlisted URLs. */
export async function sendMedicalFeedbackWithSource(
  payload: MedicalFeedbackPayload
): Promise<MedicalFeedbackResponse> {
  return apiFetch<MedicalFeedbackResponse>("/feedback/medical-source", {
    method: "POST",
    token: payload.token,
    body: {
      source_url: payload.sourceUrl,
      conversation_id: payload.conversationId ?? null,
      message_id: payload.messageId ?? null,
      agent_id: payload.agentId ?? null,
      rating: payload.rating,
      comment: payload.comment ?? "",
      max_pages: payload.maxPages ?? 3,
    },
  });
}
