import { vi } from "vitest";

/** Mutable Supabase client mock for unit tests; configure in individual test files. */
export const supabaseAuthMock = {
  getSession: vi.fn(),
  refreshSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
};

const patientsSingle = vi.fn();
const patientsEq = vi.fn(() => ({ single: patientsSingle }));
const patientsSelect = vi.fn(() => ({ eq: patientsEq }));

export const supabaseFromMock = vi.fn(defaultFromImpl);

export const supabaseMock = {
  auth: supabaseAuthMock,
  from: supabaseFromMock,
};

/** Exported for tests that assert on patient lookup. */
export { patientsSingle };

function defaultFromImpl(table: string) {
  if (table === "patients") {
    return { select: patientsSelect };
  }
  return { select: vi.fn() };
}

export function resetSupabaseClientMock() {
  supabaseAuthMock.getSession.mockReset();
  supabaseAuthMock.refreshSession.mockReset();
  supabaseAuthMock.onAuthStateChange.mockReset();
  supabaseAuthMock.signInWithPassword.mockReset();
  supabaseAuthMock.signUp.mockReset();
  supabaseAuthMock.signOut.mockReset();
  supabaseFromMock.mockReset();
  supabaseFromMock.mockImplementation(defaultFromImpl);
  patientsSelect.mockReset();
  patientsSelect.mockImplementation(() => ({ eq: patientsEq }));
  patientsEq.mockReset();
  patientsEq.mockImplementation(() => ({ single: patientsSingle }));
  patientsSingle.mockReset();

  supabaseAuthMock.getSession.mockResolvedValue({ data: { session: null } });
  supabaseAuthMock.refreshSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });
  supabaseAuthMock.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
  supabaseAuthMock.signInWithPassword.mockResolvedValue({ error: null });
  supabaseAuthMock.signUp.mockResolvedValue({ error: null });
  supabaseAuthMock.signOut.mockResolvedValue({});

  patientsSingle.mockResolvedValue({ data: null, error: { message: "no row" } });
}

resetSupabaseClientMock();
