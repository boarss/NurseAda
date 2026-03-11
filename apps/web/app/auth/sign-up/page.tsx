"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/AuthContext";

export default function SignUpPage() {
  const t = useTranslations();
  const { signUp, loading: authLoading, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (authLoading) return null;
  if (user) {
    router.replace("/chat");
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError(t("auth.passwordsMismatch"));
      return;
    }
    if (password.length < 6) {
      setError(t("auth.passwordTooShort"));
      return;
    }
    setSubmitting(true);
    const err = await signUp(email.trim(), password);
    setSubmitting(false);
    if (err) {
      setError(err);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <h1 className="font-display text-3xl font-semibold text-fg">
            {t("auth.checkEmail")}
          </h1>
          <p className="font-body text-muted text-sm leading-relaxed">
            {t.rich("auth.confirmationSent", {
              bold: (chunks) => <strong>{chunks}</strong>,
              email,
            })}
          </p>
          <Link
            href="/auth/sign-in"
            className="inline-block rounded-card bg-primary text-white font-body font-semibold px-6 py-3 transition-transform duration-fast ease-out-expo hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg active:scale-[0.98]"
          >
            {t("auth.goToSignIn")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 opacity-0 animate-in">
        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold text-fg">
            {t("auth.createAccount")}
          </h1>
          <p className="font-body text-muted text-sm mt-2">
            {t("auth.signUpSubtitle")}
          </p>
        </div>

        {error && (
          <div
            className="rounded-card border border-error/40 bg-error/10 px-4 py-3 text-sm text-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block font-body text-sm font-medium text-fg mb-1"
            >
              {t("common.email")}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              className="w-full rounded-card border border-border bg-surface text-fg placeholder:text-muted px-4 py-3 font-body text-[15px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autoComplete="email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-body text-sm font-medium text-fg mb-1"
            >
              {t("common.password")}
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.passwordHint")}
              className="w-full rounded-card border border-border bg-surface text-fg placeholder:text-muted px-4 py-3 font-body text-[15px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="block font-body text-sm font-medium text-fg mb-1"
            >
              {t("auth.confirmPassword")}
            </label>
            <input
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t("auth.repeatPassword")}
              className="w-full rounded-card border border-border bg-surface text-fg placeholder:text-muted px-4 py-3 font-body text-[15px] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-card bg-primary text-white font-body font-semibold px-5 py-3 transition-transform duration-fast ease-out-expo hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg active:scale-[0.98]"
          >
            {submitting ? t("common.creatingAccount") : t("auth.createAccount")}
          </button>
        </form>

        <p className="text-center text-xs font-body text-muted leading-relaxed">
          {t("auth.signUpDisclaimer")}
        </p>

        <p className="text-center text-sm font-body text-muted">
          {t("auth.alreadyHaveAccount")}{" "}
          <Link
            href="/auth/sign-in"
            className="text-primary hover:underline font-medium"
          >
            {t("common.signIn")}
          </Link>
        </p>
      </div>
    </main>
  );
}
