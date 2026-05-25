"use client";

import { Announcement } from "@/lib/types";

const SEVERITY_STYLES: Record<Announcement["severity"], string> = {
  notice: "bg-sky-600 text-white",
  reminder: "bg-amber-500 text-slate-900",
  urgent: "bg-red-600 text-white animate-pulse",
};

const SEVERITY_LABELS: Record<Announcement["severity"], string> = {
  notice: "Notice",
  reminder: "Reminder",
  urgent: "Urgent",
};

export function AnnouncementBanner({ items }: { items: Announcement[] }) {
  if (items.length === 0) return null;
  const latest = items[0];
  return (
    <div
      className={`${SEVERITY_STYLES[latest.severity]} px-4 py-3 text-base font-medium shadow`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span className="rounded bg-black/20 px-2 py-0.5 text-xs uppercase tracking-wide">
          {SEVERITY_LABELS[latest.severity]}
        </span>
        <span className="flex-1">{latest.message}</span>
      </div>
    </div>
  );
}

export function AnnouncementHistory({ items }: { items: Announcement[] }) {
  if (items.length <= 1) return null;
  return (
    <details className="rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
      <summary className="cursor-pointer font-medium">
        Earlier announcements ({items.length - 1})
      </summary>
      <ul className="mt-2 space-y-2">
        {items.slice(1).map((a) => (
          <li key={a.id} className="border-t border-slate-100 pt-2 dark:border-slate-800">
            <span className="mr-2 text-xs uppercase text-slate-500">
              {SEVERITY_LABELS[a.severity]}
            </span>
            {a.message}
          </li>
        ))}
      </ul>
    </details>
  );
}
