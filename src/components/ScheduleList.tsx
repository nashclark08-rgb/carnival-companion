"use client";

import { CarnivalEvent } from "@/lib/types";
import { formatClockTime } from "@/lib/time";

type Props = {
  events: CarnivalEvent[];
  now: number;
};

export function ScheduleList({ events, now }: Props) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
        No events match your details. Check that your house, age group, and
        category are correct.
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {events.map((e) => {
        const past = e.scheduledTime < now - 60 * 60 * 1000;
        return (
          <li
            key={e.id}
            className={`rounded-xl border p-4 transition ${
              past
                ? "border-slate-200 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-900/40"
                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h4 className="font-semibold">{e.name}</h4>
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
