"use client";

import { useEffect, useState } from "react";
import { checkHealth, type HealthStatus } from "../../lib/api";

const statusConfig: Record<HealthStatus, { label: string; className: string }> = {
  ok: { label: "Service available", className: "border-emerald-500/50 bg-emerald-950/30 text-emerald-200" },
  unreachable: { label: "Service temporarily unavailable", className: "border-amber-500/50 bg-amber-950/30 text-amber-200" },
  timeout: { label: "Checking...", className: "border-slate-500/50 bg-slate-800/30 text-slate-300" },
};

export function ServiceStatus() {
  const [status, setStatus] = useState<HealthStatus>("timeout");

  useEffect(() => {
    let cancelled = false;
    setStatus("timeout");
    checkHealth().then((s) => {
      if (!cancelled) setStatus(s);
    });
    const t = setInterval(() => {
      checkHealth().then((s) => {
        if (!cancelled) setStatus(s);
      });
    }, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const { label, className } = statusConfig[status];
  return (
    <div
      className={`rounded-md border px-2 py-1 text-xs ${className}`}
      role="status"
      aria-live="polite"
    >
      {status === "ok" && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />}
      {status === "unreachable" && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />}
      {status === "timeout" && <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" />}
      {label}
    </div>
  );
}
