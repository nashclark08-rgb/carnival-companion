"use client";

import { useEffect, useState } from "react";
import { CarnivalEvent, MyResult } from "@/lib/types";
import { formatClockTime } from "@/lib/time";

type Props = {
  event: CarnivalEvent;
  existing?: MyResult;
  forWho?: string;
  primaryColor?: string;
  onCancel: () => void;
  onSave: (result: MyResult) => Promise<void> | void;
  onClear?: () => Promise<void> | void;
};

const PLACE_PRESETS = [1, 2, 3, 4, 5];

export function RecordResultModal({
  event,
  existing,
  forWho,
  primaryColor,
  onCancel,
  onSave,
  onClear,
}: Props) {
  const [placement, setPlacement] = useState<number | "">("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPlacement(existing?.placement ?? "");
    setTime(existing?.time ?? "");
    setNotes(existing?.notes ?? "");
  }, [existing]);

  async function save() {
    setSaving(true);
    try {
      await onSave({
        eventId: event.id,
        placement: placement === "" ? undefined : Number(placement),
        time: time.trim() || undefined,
        notes: notes.trim() || undefined,
        recordedAt: Date.now(),
      });
    } finally {
      setSaving(false);
    }
  }

  const primaryStyle = primaryColor
    ? { background: primaryColor }
    : { background: "#4f46e5" };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <header>
          <h2 className="text-lg font-bold">
            {existing ? "Edit my result" : "Record my result"}
          </h2>
          <p className="text-xs text-slate-500">
            {event.name} · {event.location} ·{" "}
            {formatClockTime(event.scheduledTime)}
            {forWho && ` · ${forWho}`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Stays private on this device — only you can see it.
          </p>
        </header>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Placement
          </label>
          <div className="flex flex-wrap gap-2">
            {PLACE_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlacement(p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  placement === p
                    ? "text-white"
                    : "border border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                }`}
                style={placement === p ? primaryStyle : undefined}
              >
                {p === 1 ? "1st" : p === 2 ? "2nd" : p === 3 ? "3rd" : `${p}th`}
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={50}
              className="input w-24"
              placeholder="Other"
              value={placement}
              onChange={(e) =>
                setPlacement(
                  e.target.value === ""
                    ? ""
                    : Math.max(1, parseInt(e.target.value, 10) || 1),
                )
              }
            />
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Time (optional)
          </span>
          <input
            type="text"
            inputMode="decimal"
            className="input"
            placeholder={
              event.type === "track" ? "e.g. 12.45 or 1:23.45" : "e.g. 4.85m"
            }
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Notes (optional)
          </span>
          <input
            type="text"
            className="input"
            placeholder="e.g. PB, false start"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={120}
          />
        </label>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          {existing && onClear && (
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Clear your recorded result for this event?"))
                  return;
                await onClear();
              }}
              className="mr-auto rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              Clear result
            </button>
          )}
          <button
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving || placement === ""}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            style={primaryStyle}
          >
            {saving ? "Saving…" : "Save result"}
          </button>
        </div>
      </div>
    </div>
  );
}
