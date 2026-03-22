"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/AuthContext";
import { apiFetch } from "@/lib/api";

type Clinic = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone?: string;
  specialties: string[];
  facility_type: string;
  accepts_telemedicine: boolean;
  hours?: string;
  is_active?: boolean;
};

export default function AdminClinicsPage() {
  const t = useTranslations();
  const { user, getValidAccessToken } = useAuth();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const token = await getValidAccessToken();
      if (!token || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await apiFetch<{ clinics: Clinic[] }>("/admin/clinics", {
          token,
        });
        if (!cancelled) {
          setClinics(res.clinics ?? []);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Failed to load clinics.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, getValidAccessToken]);

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="text-muted font-body text-sm max-w-md text-center">
          {t("appointments.adminSignInRequired", {
            defaultValue: "Please sign in to manage clinics.",
          })}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-8 max-w-5xl mx-auto">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-fg">
            {t("appointments.adminClinicsTitle", {
              defaultValue: "Clinic network",
            })}
          </h1>
          <p className="font-body text-sm text-muted mt-1">
            {t("appointments.adminClinicsSubtitle", {
              defaultValue:
                "Manage the NurseAda primary care network. Only admins can see this page.",
            })}
          </p>
        </div>
      </header>

      {loading && (
        <p className="font-body text-sm text-muted">
          {t("common.loading", { defaultValue: "Loading…" })}
        </p>
      )}
      {error && (
        <p className="font-body text-sm text-error">
          {t("common.error", { defaultValue: "Error" })}: {error}
        </p>
      )}

      {!loading && !error && (
        <div className="mt-4 space-y-3">
          {clinics.map((c) => (
            <div
              key={c.id}
              className="rounded-card border border-border bg-surface px-4 py-3 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-body font-semibold text-fg">
                    {c.name}
                    {!c.is_active && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                        {t("appointments.adminClinicsInactive", {
                          defaultValue: "Inactive",
                        })}
                      </span>
                    )}
                  </div>
                  <div className="font-body text-xs text-muted">
                    {c.city}, {c.state} • {c.facility_type}
                  </div>
                </div>
              </div>
              <div className="font-body text-xs text-muted">
                {c.address}
                {c.phone ? ` • ${c.phone}` : null}
              </div>
              {c.specialties?.length ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {c.specialties.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center rounded-full bg-bubble-assistant/40 px-2 py-0.5 text-[11px] font-body text-muted"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {clinics.length === 0 && (
            <p className="font-body text-sm text-muted">
              {t("appointments.adminClinicsEmpty", {
                defaultValue: "No clinics found.",
              })}
            </p>
          )}
        </div>
      )}
    </main>
  );
}

