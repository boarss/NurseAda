"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getHerbalCatalog, type HerbalRemedy } from "@/lib/api";

const EVIDENCE_COLORS: Record<string, string> = {
  strong: "bg-primary/15 text-primary border-primary/30",
  moderate: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  limited: "bg-surface text-muted border-border",
  traditional: "bg-surface text-muted border-border border-dashed",
};

const CONDITION_CHIPS = [
  "All",
  "nausea",
  "malaria",
  "cough",
  "headache",
  "diarrhea",
  "fever",
  "pain",
  "fatigue",
  "hypertension",
  "skin",
  "toothache",
  "congestion",
];

function extractRemedyName(text: string): string {
  const m = text.match(/\*\*(.+?)\*\*/);
  return m ? m[1] : text.slice(0, 40);
}

function stripMarkdownBold(text: string): string {
  return text.replace(/\*\*/g, "");
}

function EvidenceBadge({ level, label }: { level: string; label: string }) {
  const cls = EVIDENCE_COLORS[level] || EVIDENCE_COLORS.limited;
  return (
    <span
      className={`inline-block text-[11px] font-body font-medium px-2 py-0.5 rounded-full border ${cls}`}
    >
      {label || level}
    </span>
  );
}

function RemedyCard({
  remedy,
  expanded,
  onToggle,
}: {
  remedy: HerbalRemedy;
  expanded: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations();
  const name = extractRemedyName(remedy.text);
  const body = stripMarkdownBold(remedy.text);

  return (
    <div className="rounded-card border border-border bg-surface shadow-card transition-shadow duration-fast ease-out-expo hover:shadow-lg">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset rounded-card"
        aria-expanded={expanded}
        aria-label={`${name} — ${expanded ? t("remedies.collapse") : t("remedies.expand")} details`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold text-fg leading-snug">
              {name}
            </h3>
            <p className="text-xs text-muted font-body mt-0.5 capitalize">
              {remedy.condition}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            <EvidenceBadge
              level={remedy.evidence_level}
              label={remedy.evidence_label}
            />
            <span
              className="text-muted text-sm transition-transform"
              style={{ transform: expanded ? "rotate(180deg)" : "none" }}
              aria-hidden
            >
              &#x25BE;
            </span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-0 space-y-3 animate-in">
          <p className="font-body text-sm text-fg leading-relaxed">{body}</p>

          {remedy.contraindications.length > 0 && (
            <div className="rounded-lg border border-error/30 bg-error/5 px-3 py-2">
              <p className="text-xs font-body font-semibold text-error mb-1">
                {t("remedies.avoidIf")}
              </p>
              <p className="text-xs font-body text-error/90">
                {remedy.contraindications.join(", ")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RemediesPage() {
  const t = useTranslations();
  const [remedies, setRemedies] = useState<HerbalRemedy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCondition, setActiveCondition] = useState("All");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getHerbalCatalog()
      .then((data) => setRemedies(data.items))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load remedies")
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = remedies;
    if (activeCondition !== "All") {
      list = list.filter(
        (r) =>
          r.condition.toLowerCase().includes(activeCondition) ||
          r.keywords.some((kw) => kw.includes(activeCondition))
      );
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.text.toLowerCase().includes(q) ||
          r.condition.toLowerCase().includes(q) ||
          r.keywords.some((kw) => kw.includes(q))
      );
    }
    return list;
  }, [remedies, activeCondition, search]);

  return (
    <main className="min-h-screen max-w-3xl mx-auto w-full px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/chat"
          className="rounded-lg p-2 -ml-2 text-muted hover:text-fg hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={t("common.backToChat")}
        >
          <span className="font-body font-medium">&larr;</span>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold text-fg">
            {t("remedies.title")}
          </h1>
          <p className="text-sm text-muted font-body mt-0.5">
            {t("remedies.subtitle")}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("remedies.searchPlaceholder")}
          className="w-full rounded-card border border-border bg-surface text-fg placeholder:text-muted px-4 py-3 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={t("remedies.searchLabel")}
        />
      </div>

      <div className="flex gap-2 flex-wrap mb-6" role="tablist" aria-label={t("remedies.filterLabel")}>
        {CONDITION_CHIPS.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={activeCondition === c}
            onClick={() => {
              setActiveCondition(c);
              setExpandedIdx(null);
            }}
            className={`px-3 py-2 min-h-[44px] rounded-full text-xs font-body font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation ${
              activeCondition === c
                ? "bg-primary text-white border-primary"
                : "bg-surface text-muted border-border hover:text-fg hover:border-fg/30"
            }`}
          >
            {c === "All" ? t("remedies.all") : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-busy="true" aria-label={t("remedies.loading")}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-card border border-border bg-surface shadow-card overflow-hidden"
            >
              <div className="px-5 py-4 space-y-2">
                <div className="h-5 w-3/4 rounded bg-border animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-border animate-pulse" />
                <div className="h-3 w-full rounded bg-border animate-pulse mt-2" />
                <div className="h-3 w-5/6 rounded bg-border animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div
          className="rounded-card border border-error/40 bg-error/10 px-6 py-4 mb-6 text-sm text-error font-body"
          role="alert"
        >
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16 text-muted text-sm font-body">
          {t("remedies.noResults")}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((remedy, i) => (
            <div
              key={`${remedy.condition}-${i}`}
              className="animate-in opacity-0"
              style={{ animationDelay: `calc(var(--stagger-delay) * ${i})` }}
            >
              <RemedyCard
                remedy={remedy}
                expanded={expandedIdx === i}
                onToggle={() =>
                  setExpandedIdx(expandedIdx === i ? null : i)
                }
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-border">
        <p className="text-xs text-muted font-body leading-relaxed">
          {t("remedies.disclaimer")}
        </p>
      </div>
    </main>
  );
}
