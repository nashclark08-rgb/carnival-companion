"use client";

import { useState } from "react";
import { sendAnnouncement, useAnnouncements } from "@/lib/db";
import { DEFAULT_CARNIVAL_ID } from "@/lib/firebase";
import { Severity } from "@/lib/types";

const OPTIONS: { value: Severity; label: string; color: string }[] = [
  { value: "notice", label: "Notice", color: "bg-sky-600" },
  { value: "reminder", label: "Reminder", color: "bg-amber-500 text-slate-900" },
  { value: "urgent", label: "Urgent", color: "bg-red-600" },
];

export default function AdminAnnouncementsPage() {
  const announcements = useAnnouncements(DEFAULT_CARNIVAL_ID);
  const [severity, setSeverity] = useState<Severity>("notice");
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);

  async function trySend() {
    if (!message.trim()) return;
    if (severity === "urgent") {
      setConfirming(true);
      return;
    }
    await actuallySend();
  }

  async function actuallySend() {
    setSending(true);
    try {
      await sendAnnouncement(DEFAULT_CARNIVAL_ID, severity, message.trim());
      setMessage("");
      setConfirming(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-sm text-slate-500">
          Broadcast to every attendee. Targeted (per-house, per-age-group)
          announcements ship in Phase 2.
        </p>
      </header>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex gap-2">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setSeverity(o.value)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium text-white ${o.color} ${severity === o.value ? "ring-4 ring-offset-2 ring-indigo-300" : "opacity-70 hover:opacity-100"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <textarea
          className="input min-h-24"
          placeholder="e.g. Rain incoming, all students return to house areas."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={280}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {message.length}/280
          </span>
          <button
            onClick={trySend}
            disabled={sending || !message.trim()}
            className="rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send to all attendees"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          History
        </h2>
        <ul className="space-y-2">
          {announcements.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs uppercase text-white ${
                    a.severity === "urgent"
                      ? "bg-red-600"
                      : a.severity === "reminder"
                        ? "bg-amber-500 text-slate-900"
                        : "bg-sky-600"
                  }`}
                >
                  {a.severity}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1">{a.message}</p>
            </li>
          ))}
          {announcements.length === 0 && (
            <li className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No announcements yet.
            </li>
          )}
        </ul>
      </section>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
            <h2 className="text-lg font-bold text-red-700">Send Urgent alert?</h2>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              This sends a red banner to every device on site. Make sure the
              message is correct.
            </p>
            <blockquote className="rounded-lg border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-900">
              {message}
            </blockquote>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={actuallySend}
                disabled={sending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {sending ? "Sending…" : "Yes, send Urgent"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
