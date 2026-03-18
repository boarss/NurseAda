"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  accessToken: string | null;
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
  patientCode: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [patientCode, setPatientCode] = useState<string | null>(null);

  const formatAuthError = useCallback((err: unknown): string => {
    if (err instanceof Error) {
      const msg = err.message || "Authentication error";
      if (msg.toLowerCase().includes("supabase is not configured")) {
        return "Auth is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.";
      }
      if (msg.toLowerCase().includes("failed to fetch")) {
        return "Network error reaching Supabase. Please check your internet connection and Supabase URL.";
      }
      return msg;
    }
    return "Authentication error. Please try again.";
  }, []);

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
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return error ? error.message : null;
    } catch (err) {
      return formatAuthError(err);
    }
  }, [formatAuthError]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      return error ? error.message : null;
    } catch (err) {
      return formatAuthError(err);
    }
  }, [formatAuthError]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
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
