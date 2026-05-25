"use client";

import { CarnivalEvent, House } from "@/lib/types";
import { formatClockTime } from "@/lib/time";

export type ScheduleEvent = CarnivalEvent & {
  ownerLabel?: string;
};

const CONFLICT_WINDOW_MS = 15 * 60 * 1000;

function findConflicts(events: ScheduleEvent[]): Set<string> {
  const conflicting = new Set<string>();
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];
      if (!a.ownerLabel || !b.ownerLabel) continue;
      if (a.ownerLabel === b.ownerLabel) continue;
      if (Math.abs(a.scheduledTime - b.scheduledTime) < CONFLICT_WINDOW_MS) {
        conflicting.add(`${a.id}-${a.ownerLabel}-${i}`);
        conflicting.add(`${b.id}-${b.ownerLabel}-${j}`);
      }
    }
  }
  return conflicting;
}

type Props = {
  events: ScheduleEvent[];
  now: number;
  showOwners?: boolean;
  houses?: House[];
};

export function ScheduleList({ events, now, showOwners, houses }: Props) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
        No events match. Check that your house, age group, and category are
        correct.
      </div>
    );
  }
  const conflicts = showOwners ? findConflicts(events) : new Set<string>();

  return (
    <ul className="space-y-2">
      {events.map((e, i) => {
        const past = e.scheduledTime < now - 60 * 60 * 1000;
        const key = `${e.id}-${e.ownerLabel ?? ""}-${i}`;
        const hasConflict = conflicts.has(key);
        const hasResults = e.results && e.results.length > 0;
        return (
          <li
            key={key}
            className={`rounded-xl border p-4 transition ${
              past
                ? "border-slate-200 bg-slate-50 opacity-80 dark:border-slate-800 dark:bg-slate-900/40"
                : hasConflict
                  ? "border-amber-400 bg-amber-50 dark:border-amber-500/60 dark:bg-amber-950/30"
                  : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {showOwners && e.ownerLabel && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                    {e.ownerLabel}
                  </span>
                )}
                <h4 className="font-semibold">{e.name}</h4>
                {hasConflict && !past && (
                  <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
                    Clash
                  </span>
                )}
                {hasResults && (
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200">
                    Result
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {formatClockTime(e.scheduledTime)}
              </span>
            </div>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
              {e.type} · {e.location}
            </p>
            {hasResults && e.results && (
              <ul className="mt-2 space-y-0.5 border-t border-slate-200 pt-2 text-sm dark:border-slate-700">
                {e.results
                  .slice()
                  .sort((a, b) => a.placement - b.placement)
                  .map((r) => {
                    const house = houses?.find((h) => h.id === r.houseId);
                    return (
                      <li
                        key={r.placement}
                        className="flex items-center gap-2"
                      >
                        <span className="w-6 text-xs font-semibold text-slate-500">
                          {["1st", "2nd", "3rd"][r.placement - 1] ??
                            `${r.placement}th`}
                        </span>
                        {house && (
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: house.color }}
                            aria-hidden
                          />
                        )}
                        <span>{r.name || "—"}</span>
                        {r.time && (
                          <span className="ml-auto text-xs tabular-nums text-slate-500">
                            {r.time}
                          </span>
                        )}
                      </li>
                    );
                  })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
