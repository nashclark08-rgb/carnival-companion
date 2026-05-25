"use client";

import Link from "next/link";
import { useCarnival, useEvents, useAnnouncements } from "@/lib/db";
import { DEFAULT_CARNIVAL_ID } from "@/lib/firebase";

export default function AdminDashboardPage() {
  const { carnival, loading } = useCarnival(DEFAULT_CARNIVAL_ID);
  const events = useEvents(DEFAULT_CARNIVAL_ID);
  const announcements = useAnnouncements(DEFAULT_CARNIVAL_ID);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">
          {loading
            ? "Loading…"
            : carnival
              ? `${carnival.name} · ${carnival.venue} · ${carnival.date}`
              : "No carnival configured yet."}
        </p>
      </header>

      {!loading && !carnival && (
        <Link
          href="/admin/setup"
          className="block rounded-xl bg-indigo-600 p-6 text-white shadow"
        >
          <h2 className="text-xl font-bold">Get started</h2>
          <p className="mt-1 text-sm">
            Set up your carnival: name, houses, age groups, and categories.
          </p>
        </Link>
      )}

      {carnival && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Houses" value={carnival.houses.length} />
          <Stat label="Age groups" value={carnival.ageGroups.length} />
          <Stat label="Categories" value={carnival.categories.length} />
          <Stat label="Events" value={events.length} />
          <Stat label="Announcements" value={announcements.length} />
          <Stat
            label="Leading house"
            value={
              carnival.houses
                .slice()
                .sort((a, b) => b.points - a.points)[0]?.name ?? "—"
            }
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <QuickLink href="/admin/setup" title="Setup" desc="Houses, age groups, categories, sessions" />
        <QuickLink href="/admin/events" title="Events" desc="Add and edit the schedule" />
        <QuickLink href="/admin/leaderboard" title="Leaderboard" desc="Update house points" />
        <QuickLink href="/admin/announcements" title="Announcements" desc="Broadcast banners and alerts" />
        <QuickLink href="/admin/qr" title="QR code" desc="Print or share the attendee link" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-400 hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500 dark:hover:bg-slate-800"
    >
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-slate-500">{desc}</p>
    </Link>
  );
}
