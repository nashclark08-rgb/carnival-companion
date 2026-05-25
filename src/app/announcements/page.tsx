"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadProfile } from "@/lib/attendee";
import { useAnnouncements, useCarnival } from "@/lib/db";
import { DEFAULT_CARNIVAL_ID } from "@/lib/firebase";
import { AttendeeProfile, Severity } from "@/lib/types";

const SEVERITY_STYLES: Record<Severity, string> = {
  notice: "bg-sky-600 text-white",
  reminder: "bg-amber-500 text-slate-900",
  urgent: "bg-red-600 text-white",
};

const SEVERITY_LABELS: Record<Severity, string> = {
  notice: "Notice",
  reminder: "Reminder",
  urgent: "Urgent",
};

export default function AnnouncementsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AttendeeProfile | null>(null);
  const [filter, setFilter] = useState<"all" | Severity>("all");

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace("/");
      return;
    }
    setProfile(p);
  }, [router]);

  const { carnival } = useCarnival(DEFAULT_CARNIVAL_ID);
  const announcements = useAnnouncements(DEFAULT_CARNIVAL_ID);

  const visible = useMemo(() => {
    if (!profile) return announcements;
    return announcements.filter((a) => {
      const target = a.target;
      if (!target || target.kind === "all") return true;
      if (target.kind === "house") {
        if (profile.role === "student")
          return target.houseId === profile.houseId;
        return profile.children.some((c) => c.houseId === target.houseId);
      }
      if (target.kind === "ageGroup") {
        if (profile.role === "student")
          return target.ageGroupId === profile.ageGroupId;
        return profile.children.some(
          (c) => c.ageGroupId === target.ageGroupId,
        );
      }
      return true;
    });
  }, [announcements, profile]);

  const now = Date.now();

  const filtered = useMemo(
    () => (filter === "all" ? visible : visible.filter((a) => a.severity === filter)),
    [visible, filter],
  );

  if (!profile) return null;

  function describeTarget(target: typeof visible[number]["target"]) {
    if (!target || target.kind === "all") return "All attendees";
    if (target.kind === "house") {
      const house = carnival?.houses.find((h) => h.id === target.houseId);
      return `House: ${house?.name ?? target.houseId}`;
    }
    const ag = carnival?.ageGroups.find((g) => g.id === target.ageGroupId);
    return `Age group: ${ag?.label ?? target.ageGroupId}`;
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-4 p-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-xs text-slate-500">
            {visible.length} message{visible.length === 1 ? "" : "s"} for you
          </p>
        </div>
        <Link
          href="/schedule"
          className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
        >
          Back
        </Link>
      </header>

      <div className="flex gap-2 overflow-x-auto">
        {(["all", "urgent", "reminder", "notice"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
              filter === f
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {f === "all" ? "All" : SEVERITY_LABELS[f]}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {filtered.length === 0 && (
          <li className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            No announcements{filter !== "all" ? ` at ${SEVERITY_LABELS[filter]} level` : ""}.
          </li>
        )}
        {filtered.map((a) => {
          const expired = a.expiresAt !== undefined && a.expiresAt < now;
          return (
            <li
              key={a.id}
              className={`rounded-xl border bg-white p-3 dark:bg-slate-900 ${
                expired
                  ? "border-slate-200 opacity-60 dark:border-slate-800"
                  : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs uppercase ${SEVERITY_STYLES[a.severity]}`}
                >
                  {SEVERITY_LABELS[a.severity]}
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {describeTarget(a.target)}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(a.createdAt).toLocaleString()}
                </span>
                {expired && (
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    Expired
                  </span>
                )}
              </div>
              <p className="mt-1">{a.message}</p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
