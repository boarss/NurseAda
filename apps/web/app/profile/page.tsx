"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LanguagePicker } from "@/components/LanguagePicker";
import { PageShell } from "@/components/PageShell";
import { useAuth } from "@/lib/AuthContext";
import { useLocale } from "@/lib/IntlProvider";
import type { SupportedLanguage } from "@/lib/locale";

function intlLocaleForApp(lang: SupportedLanguage): string {
  switch (lang) {
    case "ha":
      return "ha-NG";
    case "yo":
      return "yo-NG";
    case "ig":
      return "ig-NG";
    case "en":
    case "pcm":
    default:
      return "en-NG";
  }
}

export default function ProfilePage() {
  const t = useTranslations();
  const { locale } = useLocale();
  const { user, patientCode, loading: authLoading, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name;
  const displayNameStr =
    typeof displayName === "string" && displayName.trim()
      ? displayName.trim()
      : null;

  const memberSinceFormatted = useMemo(() => {
    if (!user?.created_at) return null;
    const d = new Date(user.created_at);
    if (Number.isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat(intlLocaleForApp(locale), {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  }, [user?.created_at, locale]);

  if (authLoading) return null;

  if (!user) {
    return (
      <PageShell maxWidthClass="max-w-xl" className="flex min-h-[60vh] flex-col justify-center">
        <div className="text-center space-y-4">
          <h1 className="font-display text-2xl font-semibold text-fg">
            {t("profile.guestTitle")}
          </h1>
          <p className="text-muted font-body text-sm">{t("profile.guestBody")}</p>
          <Link
            href="/auth/sign-in"
            className="inline-block rounded-card bg-primary text-white px-6 py-3 font-body font-semibold hover:bg-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {t("common.signIn")}
          </Link>
        </div>
      </PageShell>
    );
  }

  const handleCopy = async () => {
    if (!patientCode) return;
    try {
      await navigator.clipboard.writeText(patientCode);
      toast.success(t("account.copied"));
    } catch {
      toast.error(t("common.copyFailed"));
    }
  };

  return (
    <PageShell maxWidthClass="max-w-xl">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/chat"
          className="rounded-lg p-2 -ml-2 text-muted hover:text-fg hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={t("common.backToChat")}
        >
          <span className="font-body font-medium">&larr;</span>
        </Link>
        <h1 className="font-display text-2xl font-semibold text-fg">{t("profile.title")}</h1>
      </div>

      <div className="rounded-card border border-border bg-surface px-6 py-5 space-y-5">
        <div className="space-y-4">
          {displayNameStr && (
            <div>
              <p className="text-xs text-muted font-body">{t("profile.displayName")}</p>
              <p className="text-sm text-fg font-body font-semibold mt-1">{displayNameStr}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted font-body">{t("common.email")}</p>
            <p className="text-sm text-fg font-body font-semibold mt-1">{user.email}</p>
          </div>
          {memberSinceFormatted && (
            <div>
              <p className="text-xs text-muted font-body">{t("profile.memberSince")}</p>
              <p className="text-sm text-fg font-body font-semibold mt-1">{memberSinceFormatted}</p>
            </div>
          )}
        </div>

        <div className="border-t border-border pt-5 space-y-3">
          <p className="text-xs text-muted font-body">{t("profile.languageLabel")}</p>
          <LanguagePicker />
        </div>

        <div className="border-t border-border pt-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted font-body">{t("account.patientIdLabel")}</p>
              <p className="text-lg text-fg font-display font-semibold mt-1">
                {patientCode ?? "—"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleCopy()}
              disabled={!patientCode}
              className="rounded-card border border-border bg-bg px-3 py-2 text-sm font-body text-muted hover:text-fg hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {t("account.copy")}
            </button>
          </div>
          <p className="text-xs text-muted font-body leading-relaxed">{t("account.patientIdHelp")}</p>
        </div>

        <div className="border-t border-border pt-5">
          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full rounded-card border border-border bg-bg px-4 py-3 text-sm font-body font-semibold text-fg hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {t("common.signOut")}
          </button>
        </div>
      </div>
    </PageShell>
  );
}
