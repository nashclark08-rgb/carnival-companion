"use client";

import { useEffect, useMemo, useState } from "react";
import { useAnnouncements, useCarnival, useEvents } from "@/lib/db";
import { DEFAULT_CARNIVAL_ID } from "@/lib/firebase";
import { formatClockTime } from "@/lib/time";

const IN_PROGRESS_MS = 30 * 60 * 1000;

export default function DisplayPage() {
  const { carnival } = useCarnival(DEFAULT_CARNIVAL_ID);
  const events = useEvents(DEFAULT_CARNIVAL_ID);
  const announcements = useAnnouncements(DEFAULT_CARNIVAL_ID);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const inProgress = useMemo(
    () =>
      events.filter(
        (e) => e.scheduledTime <= now && e.scheduledTime + IN_PROGRESS_MS > now,
      ),
    [events, now],
  );

  const upcoming = useMemo(
    () =>
      events
        .filter((e) => e.scheduledTime > now)
        .slice(0, 5),
    [events, now],
  );

  const sortedHouses = useMemo(() => {
    if (!carnival) return [];
    return [...carnival.houses].sort((a, b) => b.points - a.points);
  }, [carnival]);

  const latestAnnouncement = announcements.find(
    (a) => !a.target || a.target.kind === "all",
  );

  const clock = new Date(now).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!carnival) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-2xl">Loading carnival…</p>
      </main>
    );
  }

  const primary = carnival.branding?.primaryColor;
  const secondary = carnival.branding?.secondaryColor;
  const logo = carnival.branding?.logoDataUrl;
  const maxPoints = Math.max(...sortedHouses.map((h) => h.points), 1);
  const inProgressBg = secondary
    ? `linear-gradient(135deg, ${secondary}, ${primary ?? secondary})`
    : "linear-gradient(135deg, #10b981, #0d9488)";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl space-y-8 p-8">
        <header className="flex items-center justify-between gap-6 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-5">
            {logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logo}
                alt={carnival.schoolName ?? "School logo"}
                className="h-20 w-20 rounded-lg bg-white/10 object-contain p-2"
              />
            ) : (
              <div
                className="h-20 w-20 rounded-lg"
                style={{
                  background: primary
                    ? `linear-gradient(135deg, ${primary}, ${secondary ?? primary})`
                    : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                }}
              />
            )}
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                {carnival.name}
              </h1>
              <p className="mt-1 text-lg text-slate-400">
                {carnival.schoolName ? `${carnival.schoolName} · ` : ""}
                {carnival.venue}
                {carnival.date ? ` · ${carnival.date}` : ""}
              </p>
            </div>
          </div>
          <p className="text-6xl font-bold tabular-nums">{clock}</p>
        </header>

        {latestAnnouncement && (
          <div
            className={`rounded-2xl p-6 text-2xl font-semibold ${
              latestAnnouncement.severity === "urgent"
                ? "bg-red-700"
                : latestAnnouncement.severity === "reminder"
                  ? "bg-amber-500 text-slate-900"
                  : "bg-sky-700"
            }`}
          >
            <span className="mr-3 rounded bg-black/30 px-3 py-1 text-base uppercase tracking-wider">
              {latestAnnouncement.severity}
            </span>
            {latestAnnouncement.message}
          </div>
        )}

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
            Happening now
          </h2>
          {inProgress.length === 0 ? (
            <p className="rounded-2xl bg-slate-900 p-8 text-2xl text-slate-400">
              No events in progress
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {inProgress.map((e) => (
                <li
                  key={e.id}
                  className="rounded-2xl p-6 text-white shadow-lg"
                  style={{ background: inProgressBg }}
                >
                  <p className="text-3xl font-bold">{e.name}</p>
                  <p className="mt-1 text-lg opacity-90">{e.location}</p>
                  <p className="mt-2 text-sm uppercase tracking-wide opacity-80">
                    Started at {formatClockTime(e.scheduledTime)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
            Coming up next
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {upcoming.map((e) => (
              <li
                key={e.id}
                className="rounded-xl bg-slate-900 p-4"
                style={
                  primary
                    ? { borderTop: `3px solid ${primary}` }
                    : undefined
                }
              >
                <p className="text-2xl font-bold tabular-nums">
                  {formatClockTime(e.scheduledTime)}
                </p>
                <p className="mt-1 text-lg">{e.name}</p>
                <p className="text-sm text-slate-400">{e.location}</p>
              </li>
            ))}
            {upcoming.length === 0 && (
              <li className="col-span-full rounded-xl bg-slate-900 p-4 text-slate-400">
                Schedule complete for today.
              </li>
            )}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
            House points
          </h2>
          <ul className="space-y-3">
            {sortedHouses.map((h, i) => {
              const pct = Math.max((h.points / maxPoints) * 100, 6);
              return (
                <li key={h.id} className="flex items-center gap-4">
                  <span className="w-10 text-3xl font-bold text-slate-500">
                    {i + 1}
                  </span>
                  <span className="w-40 text-2xl font-semibold">{h.name}</span>
                  <div className="relative h-10 flex-1 rounded-lg bg-slate-900">
                    <div
                      className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: h.color }}
                    />
                  </div>
                  <span className="w-24 text-right text-3xl font-bold tabular-nums">
                    {h.points}
                  </span>
                </li>
              );
            })}
            {sortedHouses.length === 0 && (
              <li className="text-slate-400">No houses configured.</li>
            )}
          </ul>
        </section>

        <footer className="border-t border-slate-800 pt-4 text-xs text-slate-500">
          carnival-companion · live display · auto-refreshing
        </footer>
      </div>
    </main>
  );
}
