"use client";

import { useState } from "react";
import { writeBatch, doc } from "firebase/firestore";
import {
  deleteEvent,
  upsertEvent,
  sendAnnouncement,
  useCarnival,
  useEvents,
} from "@/lib/db";
import { DEFAULT_CARNIVAL_ID, getDb } from "@/lib/firebase";
import { CarnivalEvent, EventType } from "@/lib/types";
import {
  formatDateTimeLocal,
  parseDateTimeLocal,
  formatClockTime,
} from "@/lib/time";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function blankEvent(): CarnivalEvent {
  return {
    id: uid(),
    name: "",
    type: "track",
    ageGroupId: "",
    categoryId: "",
    sessionId: "",
    scheduledTime: Date.now(),
    location: "",
  };
}

export default function AdminEventsPage() {
  const { carnival } = useCarnival(DEFAULT_CARNIVAL_ID);
  const events = useEvents(DEFAULT_CARNIVAL_ID);
  const [editing, setEditing] = useState<CarnivalEvent | null>(null);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [shiftMinutes, setShiftMinutes] = useState(15);
  const [notifyShift, setNotifyShift] = useState(true);
  const [shiftBusy, setShiftBusy] = useState(false);
  const [shiftScope, setShiftScope] = useState<"all" | "future">("future");

  if (!carnival) {
    return (
      <p className="text-slate-500">
        Set up the carnival first (Setup tab) before adding events.
      </p>
    );
  }

  function startNew() {
    if (!carnival) return;
    setEditing({
      ...blankEvent(),
      ageGroupId: carnival.ageGroups[0]?.id ?? "",
      categoryId: carnival.categories[0]?.id ?? "",
      sessionId: carnival.sessions[0]?.id ?? "",
    });
  }

  async function save() {
    if (!editing) return;
    await upsertEvent(DEFAULT_CARNIVAL_ID, editing);
    setEditing(null);
  }

  async function remove(id: string) {
    if (!confirm("Delete this event?")) return;
    await deleteEvent(DEFAULT_CARNIVAL_ID, id);
  }

  async function applyShift() {
    if (shiftMinutes === 0) return;
    setShiftBusy(true);
    try {
      const db = getDb();
      const batch = writeBatch(db);
      const cutoff = Date.now();
      const candidates =
        shiftScope === "all"
          ? events
          : events.filter((e) => e.scheduledTime >= cutoff);
      candidates.forEach((e) => {
        const ref = doc(
          db,
          "carnivals",
          DEFAULT_CARNIVAL_ID,
          "events",
          e.id,
        );
        batch.update(ref, {
          scheduledTime: e.scheduledTime + shiftMinutes * 60 * 1000,
        });
      });
      await batch.commit();
      if (notifyShift && candidates.length > 0) {
        const direction = shiftMinutes > 0 ? "delayed" : "brought forward";
        const abs = Math.abs(shiftMinutes);
        await sendAnnouncement(
          DEFAULT_CARNIVAL_ID,
          "reminder",
          `${shiftScope === "all" ? "All" : "Remaining"} events ${direction} by ${abs} minute${abs === 1 ? "" : "s"}. Please check your schedule.`,
        );
      }
      setShiftOpen(false);
      setShiftMinutes(15);
    } finally {
      setShiftBusy(false);
    }
  }

  const futureCount = events.filter((e) => e.scheduledTime >= Date.now()).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-sm text-slate-500">
            {events.length} event{events.length === 1 ? "" : "s"} scheduled
            {futureCount > 0 ? ` · ${futureCount} still upcoming` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShiftOpen(true)}
            disabled={events.length === 0}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Shift schedule…
          </button>
          <button
            onClick={startNew}
            className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white shadow hover:bg-indigo-700"
          >
            + Add event
          </button>
        </div>
      </header>

      <ul className="space-y-2">
        {events.map((e) => {
          const ag = carnival.ageGroups.find((g) => g.id === e.ageGroupId);
          const cat = carnival.categories.find((c) => c.id === e.categoryId);
          return (
            <li
              key={e.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
            >
              <div>
                <p className="font-semibold">{e.name || "(untitled)"}</p>
                <p className="text-xs text-slate-500">
                  {formatClockTime(e.scheduledTime)} · {e.type} · {e.location} ·{" "}
                  {ag?.label ?? "?"} {cat?.label ?? "?"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(e)}
                  className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(e.id)}
                  className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
        {events.length === 0 && (
          <li className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            No events yet. Click &quot;Add event&quot; to create one.
          </li>
        )}
      </ul>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
            <h2 className="text-lg font-bold">Event details</h2>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Name</span>
              <input
                className="input"
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Type</span>
                <select
                  className="input"
                  value={editing.type}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      type: e.target.value as EventType,
                    })
                  }
                >
                  <option value="track">Track</option>
                  <option value="field">Field</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Location</span>
                <input
                  className="input"
                  value={editing.location}
                  onChange={(e) =>
                    setEditing({ ...editing, location: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">
                  Age group
                </span>
                <select
                  className="input"
                  value={editing.ageGroupId}
                  onChange={(e) =>
                    setEditing({ ...editing, ageGroupId: e.target.value })
                  }
                >
                  {carnival.ageGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Category</span>
                <select
                  className="input"
                  value={editing.categoryId}
                  onChange={(e) =>
                    setEditing({ ...editing, categoryId: e.target.value })
                  }
                >
                  {carnival.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Session</span>
                <select
                  className="input"
                  value={editing.sessionId}
                  onChange={(e) =>
                    setEditing({ ...editing, sessionId: e.target.value })
                  }
                >
                  {carnival.sessions
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">
                  Start time
                </span>
                <input
                  type="datetime-local"
                  className="input"
                  value={formatDateTimeLocal(editing.scheduledTime)}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      scheduledTime: parseDateTimeLocal(e.target.value),
                    })
                  }
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditing(null)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Save event
              </button>
            </div>
          </div>
        </div>
      )}

      {shiftOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
            <h2 className="text-lg font-bold">Shift schedule</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Bulk-shift event start times. Useful for weather delays.
            </p>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Apply to
              </span>
              <select
                className="input"
                value={shiftScope}
                onChange={(e) =>
                  setShiftScope(e.target.value as "all" | "future")
                }
              >
                <option value="future">
                  Future events only ({futureCount})
                </option>
                <option value="all">
                  All events ({events.length})
                </option>
              </select>
            </label>

            <div className="grid grid-cols-4 gap-2">
              {[-15, -5, 5, 15].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => setShiftMinutes(delta)}
                  className={`rounded-lg border px-2 py-1.5 text-sm font-medium ${
                    shiftMinutes === delta
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta}m
                </button>
              ))}
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Custom shift (minutes)
              </span>
              <input
                type="number"
                className="input"
                value={shiftMinutes}
                onChange={(e) =>
                  setShiftMinutes(parseInt(e.target.value, 10) || 0)
                }
              />
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifyShift}
                onChange={(e) => setNotifyShift(e.target.checked)}
                className="h-4 w-4"
              />
              Also send a Reminder announcement to all attendees
            </label>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShiftOpen(false)}
                disabled={shiftBusy}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={applyShift}
                disabled={shiftBusy || shiftMinutes === 0}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {shiftBusy
                  ? "Shifting…"
                  : `Shift by ${shiftMinutes > 0 ? "+" : ""}${shiftMinutes}m`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
