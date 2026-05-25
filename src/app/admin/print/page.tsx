"use client";

import { useMemo } from "react";
import { useCarnival, useEvents } from "@/lib/db";
import { DEFAULT_CARNIVAL_ID } from "@/lib/firebase";
import { formatClockTime } from "@/lib/time";

export default function AdminPrintPage() {
  const { carnival } = useCarnival(DEFAULT_CARNIVAL_ID);
  const events = useEvents(DEFAULT_CARNIVAL_ID);

  const grouped = useMemo(() => {
    if (!carnival) return [];
    const sessions = [...carnival.sessions].sort(
      (a, b) => a.order - b.order,
    );
    const fallback = { id: "__no_session__", name: "Unscheduled", order: 999 };
    return [...sessions, fallback].map((s) => ({
      session: s,
      events: events
        .filter((e) =>
          s.id === "__no_session__" ? !sessions.some((sx) => sx.id === e.sessionId) : e.sessionId === s.id,
        )
        .sort((a, b) => a.scheduledTime - b.scheduledTime),
    })).filter((g) => g.events.length > 0);
  }, [carnival, events]);

  if (!carnival) {
    return <p className="p-6 text-slate-500">Loading…</p>;
  }

  const logo = carnival.branding?.logoDataUrl;

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 14mm; }
          .print-hide { display: none !important; }
          body { background: white !important; color: black !important; font-size: 11pt; }
          .print-page { box-shadow: none !important; }
          tr { page-break-inside: avoid; }
        }
        .print-page { color-scheme: light; }
      `}</style>

      <div className="print-page mx-auto max-w-4xl bg-white p-6 text-slate-900">
        <div className="print-hide mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Use your browser&apos;s Print dialog to save as PDF.
          </p>
          <button
            onClick={() => window.print()}
            className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white shadow hover:bg-indigo-700"
          >
            Print / Save PDF
          </button>
        </div>

        <header className="mb-6 flex items-center gap-4 border-b border-slate-300 pb-4">
          {logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logo}
              alt={carnival.schoolName ?? "School logo"}
              className="h-16 w-16 object-contain"
            />
          ) : null}
          <div>
            <h1 className="text-2xl font-bold">{carnival.name}</h1>
            <p className="text-sm">
              {carnival.schoolName && <>{carnival.schoolName} · </>}
              {carnival.venue}
              {carnival.date && <> · {carnival.date}</>}
            </p>
          </div>
        </header>

        {grouped.length === 0 && (
          <p className="text-slate-500">No events scheduled.</p>
        )}

        {grouped.map(({ session, events: ev }) => (
          <section key={session.id} className="mb-6">
            <h2 className="mb-2 text-lg font-semibold">{session.name}</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-1 pr-2">Time</th>
                  <th className="py-1 pr-2">Event</th>
                  <th className="py-1 pr-2">Type</th>
                  <th className="py-1 pr-2">Age</th>
                  <th className="py-1 pr-2">Category</th>
                  <th className="py-1">Location</th>
                </tr>
              </thead>
              <tbody>
                {ev.map((e) => {
                  const ag = carnival.ageGroups.find(
                    (g) => g.id === e.ageGroupId,
                  );
                  const cat = carnival.categories.find(
                    (c) => c.id === e.categoryId,
                  );
                  return (
                    <tr
                      key={e.id}
                      className="border-b border-slate-200 align-top"
                    >
                      <td className="py-1 pr-2 tabular-nums">
                        {formatClockTime(e.scheduledTime)}
                      </td>
                      <td className="py-1 pr-2 font-medium">{e.name}</td>
                      <td className="py-1 pr-2 capitalize">{e.type}</td>
                      <td className="py-1 pr-2">{ag?.label ?? "—"}</td>
                      <td className="py-1 pr-2">{cat?.label ?? "—"}</td>
                      <td className="py-1">{e.location}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ))}

        <footer className="mt-8 text-xs text-slate-500">
          Generated from carnival-companion ·{" "}
          {new Date().toLocaleString()}
        </footer>
      </div>
    </>
  );
}
