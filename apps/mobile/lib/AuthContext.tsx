import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

/** Seconds before access token expiry to proactively refresh (Supabase JWT TTL is typically 1h). */
const ACCESS_TOKEN_REFRESH_SLACK_SEC = 120;

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  accessToken: string | null;
  getValidAccessToken: () => Promise<string | null>;
  patientCode: string | null;
};

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => {},
  accessToken: null,
  getValidAccessToken: async () => null,
  patientCode: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientCode, setPatientCode] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setPatientCode(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("patients")
          .select("patient_code")
          .eq("user_id", userId)
          .single();
        if (cancelled) return;
        if (error) {
          setPatientCode(null);
          return;
        }
        setPatientCode(data?.patient_code ?? null);
      } catch {
        if (!cancelled) setPatientCode(null);
      }
    };
    void load();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return error ? error.message : null;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return error ? error.message : null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.access_token) return null;

    const sess = data.session;
    const exp = sess.expires_at;
    const nowSec = Math.floor(Date.now() / 1000);
    const needsRefresh =
      exp != null && exp - ACCESS_TOKEN_REFRESH_SLACK_SEC <= nowSec;

    if (!needsRefresh) return sess.access_token;

    const { data: refreshed, error: refErr } =
      await supabase.auth.refreshSession();
    if (refErr || !refreshed.session?.access_token) {
      return sess.access_token;
    }
    return refreshed.session.access_token;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signIn,
        signUp,
        signOut,
        accessToken: session?.access_token ?? null,
        getValidAccessToken,
        patientCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
