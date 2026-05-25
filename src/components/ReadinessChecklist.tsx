"use client";

import { Carnival, CarnivalEvent } from "@/lib/types";

type Status = "ok" | "warn" | "missing";

type Check = {
  label: string;
  status: Status;
  note?: string;
};

type Props = {
  carnival: Carnival | null;
  events: CarnivalEvent[];
};

export function ReadinessChecklist({ carnival, events }: Props) {
  const checks: Check[] = [];

  if (!carnival) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        No carnival configured yet. Start in Setup.
      </div>
    );
  }

  checks.push({
    label: "Carnival name + venue",
    status: carnival.name && carnival.venue ? "ok" : "missing",
    note: !carnival.name
      ? "Name is blank"
      : !carnival.venue
        ? "Venue is blank"
        : undefined,
  });

  checks.push({
    label: "Carnival date",
    status: carnival.date ? "ok" : "warn",
    note: !carnival.date ? "Date not set — countdown defaults to today" : undefined,
  });

  checks.push({
    label: "Houses",
    status:
      carnival.houses.length >= 2
        ? "ok"
        : carnival.houses.length === 0
          ? "missing"
          : "warn",
    note:
      carnival.houses.length === 0
        ? "No houses — leaderboard will be empty"
        : carnival.houses.length === 1
          ? "Only 1 house configured"
          : `${carnival.houses.length} houses`,
  });

  const ageGroupsWithYears = carnival.ageGroups.filter(
    (g) => g.birthYearFrom !== undefined && g.birthYearTo !== undefined,
  ).length;
  checks.push({
    label: "Age groups",
    status:
      carnival.ageGroups.length === 0
        ? "missing"
        : ageGroupsWithYears === carnival.ageGroups.length
          ? "ok"
          : ageGroupsWithYears > 0
            ? "warn"
            : "warn",
    note:
      carnival.ageGroups.length === 0
        ? "None configured"
        : ageGroupsWithYears === carnival.ageGroups.length
          ? `${carnival.ageGroups.length} groups, all DOB-enabled`
          : ageGroupsWithYears > 0
            ? `${ageGroupsWithYears}/${carnival.ageGroups.length} have birth-year ranges (others fall back to picker)`
            : `${carnival.ageGroups.length} groups, no birth-year ranges — attendees pick manually`,
  });

  checks.push({
    label: "Categories",
    status: carnival.categories.length >= 2 ? "ok" : carnival.categories.length === 0 ? "missing" : "warn",
    note:
      carnival.categories.length === 0
        ? "None configured"
        : `${carnival.categories.length} configured (${carnival.categories.map((c) => c.label).join(", ")})`,
  });

  checks.push({
    label: "Sessions",
    status: carnival.sessions.length >= 1 ? "ok" : "missing",
    note:
      carnival.sessions.length === 0
        ? "None configured"
        : `${carnival.sessions.length} session${carnival.sessions.length === 1 ? "" : "s"}`,
  });

  checks.push({
    label: "Events",
    status: events.length === 0 ? "missing" : events.length < 5 ? "warn" : "ok",
    note:
      events.length === 0
        ? "No events — Import or add manually"
        : `${events.length} event${events.length === 1 ? "" : "s"} scheduled`,
  });

  const hasBranding = Boolean(
    carnival.branding?.logoDataUrl ||
      carnival.branding?.primaryColor ||
      carnival.branding?.secondaryColor,
  );
  checks.push({
    label: "School branding",
    status: hasBranding ? "ok" : "warn",
    note: hasBranding ? "Logo / colours set" : "Optional — using defaults",
  });

  const missing = checks.filter((c) => c.status === "missing").length;
  const warnings = checks.filter((c) => c.status === "warn").length;
  const headline =
    missing > 0
      ? `${missing} blocker${missing === 1 ? "" : "s"} before you can run this carnival`
      : warnings > 0
        ? "Ready to run — a few optional gaps"
        : "Ready to run";

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Carnival readiness</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            missing > 0
              ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
              : warnings > 0
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
          }`}
        >
          {headline}
        </span>
      </header>
      <ul className="space-y-1.5 text-sm">
        {checks.map((c, i) => (
          <li key={i} className="flex items-start gap-2">
            <span
              className={`mt-0.5 inline-block h-4 w-4 shrink-0 rounded-full text-center text-[10px] font-bold leading-4 text-white ${
                c.status === "ok"
                  ? "bg-emerald-600"
                  : c.status === "warn"
                    ? "bg-amber-500"
                    : "bg-red-600"
              }`}
            >
              {c.status === "ok" ? "✓" : c.status === "warn" ? "!" : "×"}
            </span>
            <span>
              <span className="font-medium">{c.label}</span>
              {c.note && (
                <span className="text-slate-500"> · {c.note}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
