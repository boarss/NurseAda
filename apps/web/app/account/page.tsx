"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

export default function AccountPage() {
  const t = useTranslations();
  const { user, patientCode, loading: authLoading } = useAuth();

  if (authLoading) return null;

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="font-display text-2xl font-semibold text-fg">
            {t("patient.signInRequired")}
          </h1>
          <p className="text-muted font-body text-sm">{t("patient.authRequired")}</p>
          <Link
            href="/auth/sign-in"
            className="inline-block rounded-card bg-primary text-white px-6 py-3 font-body font-semibold hover:bg-primary-hover transition-colors"
          >
            {t("common.signIn")}
          </Link>
        </div>
      </main>
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
    <main className="min-h-screen max-w-xl mx-auto w-full px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/chat"
          className="rounded-lg p-2 -ml-2 text-muted hover:text-fg hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={t("common.backToChat")}
        >
          <span className="font-body font-medium">&larr;</span>
        </Link>
        <h1 className="font-display text-2xl font-semibold text-fg">
          {t("account.title")}
        </h1>
      </div>

      <div className="rounded-card border border-border bg-surface px-6 py-5 space-y-4">
        <div>
          <p className="text-xs text-muted font-body">{t("common.email")}</p>
          <p className="text-sm text-fg font-body font-semibold mt-1">{user.email}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted font-body">
              {t("account.patientIdLabel")}
            </p>
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

        <p className="text-xs text-muted font-body leading-relaxed">
          {t("account.patientIdHelp")}
        </p>
      </div>
    </main>
  );
}

