"use client";

import Link from "next/link";
import { useState } from "react";
import { useCarnival, useEvents, useAnnouncements } from "@/lib/db";
import { DEFAULT_CARNIVAL_ID } from "@/lib/firebase";
import { seedDemoCarnival } from "@/lib/seed";
import { ReadinessChecklist } from "@/components/ReadinessChecklist";

export default function AdminDashboardPage() {
  const { carnival, loading } = useCarnival(DEFAULT_CARNIVAL_ID);
  const events = useEvents(DEFAULT_CARNIVAL_ID);
  const announcements = useAnnouncements(DEFAULT_CARNIVAL_ID);

  const [seeding, setSeeding] = useState(false);
  const [confirmSeed, setConfirmSeed] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  async function runSeed() {
    setSeeding(true);
    setSeedError(null);
    try {
      await seedDemoCarnival();
      setConfirmSeed(false);
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  }

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
        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/admin/setup"
            className="block rounded-xl bg-indigo-600 p-6 text-white shadow"
          >
            <h2 className="text-xl font-bold">Set up manually</h2>
            <p className="mt-1 text-sm">
              Configure your real carnival: houses, age groups, categories,
              events.
            </p>
          </Link>
          <button
            onClick={() => setConfirmSeed(true)}
            className="block rounded-xl bg-emerald-600 p-6 text-left text-white shadow hover:bg-emerald-700"
          >
            <h2 className="text-xl font-bold">Load demo carnival</h2>
            <p className="mt-1 text-sm">
              Populate a sample carnival (4 houses, 6 age groups, 19 events
              today) so you can try the app immediately.
            </p>
          </button>
        </div>
      )}

      {carnival && (
        <ReadinessChecklist carnival={carnival} events={events} />
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

      {carnival && (
        <details className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <summary className="cursor-pointer text-sm font-medium text-slate-600">
            Danger zone: reload demo data
          </summary>
          <p className="mt-2 text-sm text-slate-500">
            Replaces the current carnival, all events, and all announcements
            with the demo set. Use this for testing only.
          </p>
          <button
            onClick={() => setConfirmSeed(true)}
            className="mt-3 rounded-lg border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50"
          >
            Reload demo data
          </button>
        </details>
      )}

      {confirmSeed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
            <h2 className="text-lg font-bold">Load demo carnival?</h2>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              This will <strong>overwrite</strong> the current carnival
              configuration, all events, and all announcements with sample
              data. Existing house points will be replaced.
            </p>
            {seedError && (
              <p className="rounded-lg border border-red-300 bg-red-50 p-2 text-sm text-red-900">
                {seedError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmSeed(false)}
                disabled={seeding}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={runSeed}
                disabled={seeding}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {seeding ? "Loading…" : "Yes, load demo"}
              </button>
            </div>
          </div>
        </div>
      )}
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
