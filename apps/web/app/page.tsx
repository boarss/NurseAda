"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguagePicker } from "@/components/LanguagePicker";
import { useAuth } from "@/lib/AuthContext";
import { PageShell } from "@/components/PageShell";

export default function HomePage() {
  const t = useTranslations();
  const { user, signOut, loading } = useAuth();

  return (
    <PageShell className="flex min-h-screen flex-col gap-6">
      <nav className="flex items-center justify-end gap-3 py-3 opacity-0 animate-in animate-in-delay-1">
        <LanguagePicker />
        {!loading && (
          <>
            {user ? (
              <>
                <span className="text-sm text-muted font-body truncate max-w-[180px]">
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="rounded-card border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:text-fg font-body transition-transform duration-fast ease-out-expo focus:outline-none focus:ring-2 focus:ring-primary active:scale-[0.98]"
                >
                  {t("common.signOut")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/sign-in"
                  className="rounded-card border border-border bg-surface px-3 py-1.5 text-sm font-body text-fg hover:bg-bubble-assistant/50 transition-transform duration-fast ease-out-expo focus:outline-none focus:ring-2 focus:ring-primary active:scale-[0.98]"
                >
                  {t("common.signIn")}
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="rounded-card bg-primary text-white px-3 py-1.5 text-sm font-body font-medium transition-transform duration-fast ease-out-expo hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary active:scale-[0.98]"
                >
                  {t("common.signUp")}
                </Link>
              </>
            )}
          </>
        )}
      </nav>

      <div className="flex flex-1 flex-col justify-center">
        <div className="max-w-xl">
          <p className="text-accent font-body text-sm font-semibold tracking-wide uppercase opacity-0 animate-in animate-in-delay-1">
            {t("home.tagline")}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-fg mt-2 tracking-tight opacity-0 animate-in animate-in-delay-2">
            {t("meta.appName")}
          </h1>
          <p className="font-body text-muted text-lg sm:text-xl mt-6 leading-relaxed opacity-0 animate-in animate-in-delay-3 max-w-md">
            {t("home.subtitle")}
          </p>
          <div className="mt-10 flex flex-wrap gap-4 opacity-0 animate-in animate-in-delay-3">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-card bg-primary text-white font-body font-semibold px-6 sm:px-8 py-4 min-h-[48px] shadow-card transition-transform duration-fast ease-out-expo hover:bg-primary-hover hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg touch-manipulation"
            >
              {t("home.startChat")}
              <span className="text-white/80" aria-hidden>
                &rarr;
              </span>
            </Link>
            <Link
              href="/medications"
              className="inline-flex items-center gap-2 rounded-card border-2 border-primary text-primary font-body font-semibold px-6 sm:px-8 py-4 min-h-[48px] transition-transform duration-fast ease-out-expo hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg touch-manipulation"
            >
              {t("home.medications")}
            </Link>
            <Link
              href="/appointments"
              className="inline-flex items-center gap-2 rounded-card border-2 border-primary text-primary font-body font-semibold px-6 sm:px-8 py-4 min-h-[48px] transition-transform duration-fast ease-out-expo hover:bg-primary/5 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg touch-manipulation"
            >
              {t("home.appointments")}
            </Link>
          </div>
        </div>
      </div>

      <div
        className="h-1.5 w-full bg-gradient-to-r from-primary via-accent/80 to-primary"
        aria-hidden
      />
    </PageShell>
  );
}

