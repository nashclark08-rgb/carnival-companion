"use client";

import { useState } from "react";
import {
  clearExpiredAnnouncements,
  deleteAnnouncement,
  sendAnnouncement,
  useAnnouncements,
  useCarnival,
} from "@/lib/db";
import { DEFAULT_CARNIVAL_ID } from "@/lib/firebase";
import { AnnouncementTarget, Severity } from "@/lib/types";
import { formatAEST } from "@/lib/time";

const OPTIONS: { value: Severity; label: string; color: string }[] = [
  { value: "notice", label: "Notice", color: "bg-sky-600" },
  { value: "reminder", label: "Reminder", color: "bg-amber-500 text-slate-900" },
  { value: "urgent", label: "Urgent", color: "bg-red-600" },
];

const DEFAULT_DURATION_MIN: Record<Severity, number | null> = {
  notice: 30,
  reminder: 15,
  urgent: null,
};

const DURATION_PRESETS: { label: string; minutes: number | null }[] = [
  { label: "5 min", minutes: 5 },
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
  { label: "Sticky", minutes: null },
];

type TargetKey = "all" | `house:${string}` | `ageGroup:${string}`;

function targetKeyToTarget(key: TargetKey): AnnouncementTarget {
  if (key === "all") return { kind: "all" };
  if (key.startsWith("house:")) {
    return { kind: "house", houseId: key.slice("house:".length) };
  }
  return { kind: "ageGroup", ageGroupId: key.slice("ageGroup:".length) };
}

function describeTarget(
  target: AnnouncementTarget | undefined,
  carnival: {
    houses: { id: string; name: string }[];
    ageGroups: { id: string; label: string }[];
  } | null,
): string {
  if (!target || target.kind === "all") return "Everyone";
  if (target.kind === "house") {
    const house = carnival?.houses.find((h) => h.id === target.houseId);
    return `House: ${house?.name ?? target.houseId}`;
  }
  const ag = carnival?.ageGroups.find((g) => g.id === target.ageGroupId);
  return `Age group: ${ag?.label ?? target.ageGroupId}`;
}

export default function AdminAnnouncementsPage() {
  const { carnival } = useCarnival(DEFAULT_CARNIVAL_ID);
  const announcements = useAnnouncements(DEFAULT_CARNIVAL_ID);
  const [severity, setSeverity] = useState<Severity>("notice");
  const [targetKey, setTargetKey] = useState<TargetKey>("all");
  const [message, setMessage] = useState("");
  const [durationMin, setDurationMin] = useState<number | null>(30);
  const [durationDirty, setDurationDirty] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);

  function selectSeverity(next: Severity) {
    setSeverity(next);
    if (!durationDirty) {
      setDurationMin(DEFAULT_DURATION_MIN[next]);
    }
  }

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
      const expiresAt =
        durationMin != null ? Date.now() + durationMin * 60 * 1000 : undefined;
      await sendAnnouncement(
        DEFAULT_CARNIVAL_ID,
        severity,
        message.trim(),
        targetKeyToTarget(targetKey),
        expiresAt,
      );
      setMessage("");
      setConfirming(false);
      setDurationDirty(false);
      setDurationMin(DEFAULT_DURATION_MIN[severity]);
    } finally {
      setSending(false);
    }
  }

  const target = targetKeyToTarget(targetKey);
  const targetSummary = describeTarget(target, carnival);
  const now = Date.now();
  const sendButtonLabel =
    target.kind === "all"
      ? "Send to all attendees"
      : `Send to ${targetSummary.toLowerCase()}`;
  const previewExpires =
    durationMin != null ? `Auto-clears after ${durationMin} min` : "Stays until replaced or expired manually";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-sm text-slate-500">
          Broadcast to all attendees or scope to a single house or age group.
        </p>
      </header>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Severity
          </label>
          <div className="flex gap-2">
            {OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => selectSeverity(o.value)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium text-white ${o.color} ${
                  severity === o.value
                    ? "ring-4 ring-offset-2 ring-indigo-300"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            How long should it stay on screen?
          </label>
          <div className="flex flex-wrap gap-2">
            {DURATION_PRESETS.map((preset) => {
              const active = durationMin === preset.minutes;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setDurationMin(preset.minutes);
                    setDurationDirty(true);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "border border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-slate-500">{previewExpires}</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Send to
          </label>
          <select
            className="input"
            value={targetKey}
            onChange={(e) => setTargetKey(e.target.value as TargetKey)}
          >
            <option value="all">Everyone</option>
            {carnival && carnival.houses.length > 0 && (
              <optgroup label="House">
                {carnival.houses.map((h) => (
                  <option key={h.id} value={`house:${h.id}`}>
                    {h.name}
                  </option>
                ))}
              </optgroup>
            )}
            {carnival && carnival.ageGroups.length > 0 && (
              <optgroup label="Age group">
                {carnival.ageGroups.map((g) => (
                  <option key={g.id} value={`ageGroup:${g.id}`}>
                    {g.label}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
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
            {sending ? "Sending…" : sendButtonLabel}
          </button>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            History
          </h2>
          {announcements.some(
            (a) => a.expiresAt !== undefined && a.expiresAt < now,
          ) && (
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Delete every expired announcement?")) return;
                await clearExpiredAnnouncements(DEFAULT_CARNIVAL_ID);
              }}
              className="text-xs text-slate-600 underline hover:text-red-700"
            >
              Clear all expired
            </button>
          )}
        </div>
        <ul className="space-y-2">
          {announcements.map((a) => {
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
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {describeTarget(a.target, carnival)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatAEST(a.createdAt)} AEST
                  </span>
                  {a.expiresAt && (
                    <span
                      className={`text-xs ${
                        expired
                          ? "text-slate-500"
                          : "text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      {expired
                        ? `Expired ${formatAEST(a.expiresAt)}`
                        : `Active until ${formatAEST(a.expiresAt)}`}
                    </span>
                  )}
                  {!a.expiresAt && (
                    <span className="text-xs text-slate-500">Sticky</span>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm("Delete this announcement?")) return;
                      await deleteAnnouncement(DEFAULT_CARNIVAL_ID, a.id);
                    }}
                    className="ml-auto text-xs text-slate-500 hover:text-red-700"
                    aria-label="Delete announcement"
                  >
                    Delete
                  </button>
                </div>
                <p className="mt-1">{a.message}</p>
              </li>
            );
          })}
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
              This sends a red banner to{" "}
              <strong>
                {target.kind === "all"
                  ? "every device on site"
                  : targetSummary.toLowerCase()}
              </strong>
              . {previewExpires}.
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
