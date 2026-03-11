/**
 * NurseAda gateway client for mobile.
 * Set EXPO_PUBLIC_GATEWAY_URL (e.g. http://10.0.2.2:8000 for Android emulator).
 */

const GATEWAY_URL = process.env.EXPO_PUBLIC_GATEWAY_URL ?? "";

function authHeaders(token?: string | null): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${GATEWAY_URL}/health`);
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
  if (!res.ok) throw new Error("Chat request failed");
  return res.json();
}

// ── Patient data types ──────────────────────────────────────────────

export type PatientSummary = {
  resourceType: string;
  id?: string;
  name?: Array<{ given?: string[]; family?: string }>;
  birthDate?: string;
  gender?: string;
};

export type FhirBundle<T = Record<string, unknown>> = {
  resourceType: "Bundle";
  total?: number;
  entry?: Array<{ resource: T }>;
};

export type FhirObservation = {
  resourceType: "Observation";
  id?: string;
  status?: string;
  code?: { coding?: Array<{ display?: string }>; text?: string };
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

export async function getPatient(
  patientId: string,
  token?: string | null
): Promise<PatientSummary> {
  return _patientGet(`/patient/${patientId}`, token);
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
  if (!res.ok) throw new Error("Failed to fetch reminders");
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
  if (!res.ok) throw new Error("Failed to create reminder");
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
  if (!res.ok) throw new Error("Failed to update reminder");
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
  if (!res.ok) throw new Error("Failed to delete reminder");
}

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
  if (!res.ok) throw new Error("Failed to fetch appointments");
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
  if (!res.ok) throw new Error("Failed to create appointment");
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
  if (!res.ok) throw new Error("Failed to update appointment");
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
  if (!res.ok) throw new Error("Failed to delete appointment");
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
