"use client";

import { House } from "@/lib/types";
import { formatAEST, formatRelative } from "@/lib/time";

type Props = {
  houses: House[];
  updatedAt?: number;
};

export function Leaderboard({ houses, updatedAt }: Props) {
  if (houses.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
        Leaderboard not configured yet.
      </div>
    );
  }
  const max = Math.max(...houses.map((h) => h.points), 1);
  const sorted = [...houses].sort((a, b) => b.points - a.points);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          House points
        </h3>
        {updatedAt && (
          <span
            className="text-xs text-slate-500"
            title={`Updated ${formatAEST(updatedAt)} (AEST)`}
          >
            Updated {formatRelative(updatedAt)} · {formatAEST(updatedAt)} AEST
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {sorted.map((h, i) => {
          const pct = Math.max((h.points / max) * 100, 4);
          return (
            <li key={h.id} className="flex items-center gap-3">
              <span className="w-5 text-sm font-semibold text-slate-500">
                {i + 1}
              </span>
              <span className="w-20 truncate text-sm font-medium">
                {h.name}
              </span>
              <div className="relative h-6 flex-1 rounded bg-slate-100 dark:bg-slate-800">
                <div
                  className="absolute inset-y-0 left-0 rounded transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: h.color }}
                />
              </div>
              <span className="w-12 text-right text-sm font-semibold tabular-nums">
                {h.points}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
