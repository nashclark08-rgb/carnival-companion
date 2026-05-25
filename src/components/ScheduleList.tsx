"use client";

import { CarnivalEvent } from "@/lib/types";
import { formatClockTime } from "@/lib/time";

export type ScheduleEvent = CarnivalEvent & {
  ownerLabel?: string;
};

type Props = {
  events: ScheduleEvent[];
  now: number;
  showOwners?: boolean;
};

export function ScheduleList({ events, now, showOwners }: Props) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
        No events match. Check that your house, age group, and category are
        correct.
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {events.map((e, i) => {
        const past = e.scheduledTime < now - 60 * 60 * 1000;
        return (
          <li
            key={`${e.id}-${e.ownerLabel ?? ""}-${i}`}
            className={`rounded-xl border p-4 transition ${
              past
                ? "border-slate-200 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-900/40"
                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-center gap-2">
                {showOwners && e.ownerLabel && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                    {e.ownerLabel}
                  </span>
                )}
                <h4 className="font-semibold">{e.name}</h4>
              </div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {formatClockTime(e.scheduledTime)}
              </span>
            </div>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
              {e.type} · {e.location}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
