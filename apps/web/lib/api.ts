/**
 * Client-side API helpers for NurseAda gateway.
 * Set NEXT_PUBLIC_GATEWAY_URL in .env (e.g. http://localhost:8000).
 */

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL ?? "";

function authHeaders(token?: string | null): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${GATEWAY_URL}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type ChatOptions = {
  patientId?: string | null;
  imageBase64?: string | null;
  token?: string | null;
  locale?: string | null;
};

export async function sendChatMessage(
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<{ reply: string }> {
  const body: Record<string, unknown> = { messages };
  if (options?.patientId) body.patient_id = options.patientId;
  if (options?.imageBase64) body.image_base64 = options.imageBase64;
  if (options?.locale) body.locale = options.locale;
  const res = await fetch(`${GATEWAY_URL}/chat`, {
    method: "POST",
    headers: authHeaders(options?.token),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = "Chat request failed";
    try {
      const parsed = text ? JSON.parse(text) : {};
      if (parsed.detail) msg = typeof parsed.detail === "string" ? parsed.detail : parsed.detail[0]?.msg ?? msg;
      else if (parsed.message) msg = parsed.message;
    } catch {
      if (res.status === 401) msg = "Please sign in to continue.";
      else if (res.status === 404) msg = "Gateway not found. Ensure the gateway is running.";
      else if (res.status >= 500) msg = "Server error. Please try again shortly.";
    }
    throw new Error(msg);
  }
  return text ? JSON.parse(text) : { reply: "" };
}

export type PatientSummary = {
  resourceType: string;
  id?: string;
  name?: Array<{ given?: string[]; family?: string }>;
  birthDate?: string;
  gender?: string;
};

export async function getPatient(
  patientId: string,
  token?: string | null
): Promise<PatientSummary> {
  const res = await fetch(`${GATEWAY_URL}/patient/${patientId}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Please sign in to view patient information.");
    if (res.status === 404) throw new Error("Patient not found");
    if (res.status === 503) throw new Error("Patient data is not configured");
    throw new Error("Failed to fetch patient");
  }
  return res.json();
}

// ── FHIR resource types (simplified) ────────────────────────────────

export type FhirBundle<T = Record<string, unknown>> = {
  resourceType: "Bundle";
  total?: number;
  entry?: Array<{ resource: T }>;
};

export type FhirObservation = {
  resourceType: "Observation";
  id?: string;
  status?: string;
  code?: { coding?: Array<{ display?: string; code?: string }>; text?: string };
  valueQuantity?: { value?: number; unit?: string };
  valueString?: string;
  effectiveDateTime?: string;
  issued?: string;
};

export type FhirMedicationRequest = {
  resourceType: "MedicationRequest";
  id?: string;
  status?: string;
  medicationCodeableConcept?: { text?: string; coding?: Array<{ display?: string }> };
  dosageInstruction?: Array<{ text?: string }>;
  authoredOn?: string;
};

export type FhirDiagnosticReport = {
  resourceType: "DiagnosticReport";
  id?: string;
  status?: string;
  code?: { coding?: Array<{ display?: string }>; text?: string };
  conclusion?: string;
  effectiveDateTime?: string;
  issued?: string;
  category?: Array<{ coding?: Array<{ display?: string }> }>;
};

// ── Patient data helpers ────────────────────────────────────────────

async function _patientGet<T>(path: string, token?: string | null): Promise<T> {
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Please sign in to view patient information.");
    if (res.status === 404) throw new Error("Resource not found");
    if (res.status === 503) throw new Error("Patient data is not configured");
    throw new Error("Failed to fetch patient data");
  }
  return res.json();
}

export async function getObservations(
  patientId: string,
  token?: string | null
): Promise<FhirBundle<FhirObservation>> {
  return _patientGet(`/patient/${patientId}/observations`, token);
}

export async function getMedications(
  patientId: string,
  token?: string | null
): Promise<FhirBundle<FhirMedicationRequest>> {
  return _patientGet(`/patient/${patientId}/medications`, token);
}

export async function getDiagnosticReports(
  patientId: string,
  token?: string | null
): Promise<FhirBundle<FhirDiagnosticReport>> {
  return _patientGet(`/patient/${patientId}/reports`, token);
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
  const res = await fetch(`${GATEWAY_URL}/herbal/catalog${params}`);
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
  const res = await fetch(`${GATEWAY_URL}/medications/reminders`, {
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
  const res = await fetch(`${GATEWAY_URL}/medications/reminders`, {
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
  const res = await fetch(`${GATEWAY_URL}/medications/reminders/${id}`, {
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
  const res = await fetch(`${GATEWAY_URL}/medications/reminders/${id}`, {
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
  const res = await fetch(`${GATEWAY_URL}/medications/check-interactions`, {
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
  const res = await fetch(`${GATEWAY_URL}/appointments/clinics${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error("Failed to fetch clinic directory");
  return res.json();
}

export async function getAppointments(
  token?: string | null
): Promise<{ appointments: Appointment[] }> {
  const res = await fetch(`${GATEWAY_URL}/appointments`, {
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
  const res = await fetch(`${GATEWAY_URL}/appointments`, {
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
  const res = await fetch(`${GATEWAY_URL}/appointments/${id}`, {
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
  const res = await fetch(`${GATEWAY_URL}/appointments/${id}`, {
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
  await fetch(`${GATEWAY_URL}/feedback`, {
    method: "POST",
    headers: authHeaders(payload.token),
    body: JSON.stringify(body),
  });
}
