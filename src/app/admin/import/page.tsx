"use client";

import { useRef, useState } from "react";
import { writeBatch, collection, doc } from "firebase/firestore";
import { useCarnival } from "@/lib/db";
import { getDb, DEFAULT_CARNIVAL_ID } from "@/lib/firebase";
import { CarnivalEvent, EventType } from "@/lib/types";
import { formatClockTime, formatDateTimeLocal, parseDateTimeLocal } from "@/lib/time";

type DraftEvent = Omit<CarnivalEvent, "id">;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function AdminImportPage() {
  const { carnival } = useCarnival(DEFAULT_CARNIVAL_ID);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftEvent[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<number | null>(null);

  if (!carnival) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Import program</h1>
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Set up the carnival first (Setup tab). The AI needs to know your
          houses, age groups, categories, and sessions before it can parse the
          program into structured events.
        </p>
      </div>
    );
  }

  async function parse() {
    if (!file || !carnival) return;
    setParsing(true);
    setError(null);
    setDrafts(null);
    setWarnings([]);
    setSaved(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append(
      "context",
      JSON.stringify({
        carnivalDate: carnival.date || new Date().toISOString().slice(0, 10),
        ageGroups: carnival.ageGroups,
        categories: carnival.categories,
        sessions: carnival.sessions,
      }),
    );

    try {
      const res = await fetch("/api/parse-program", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Parse failed (${res.status})`);
      }
      setDrafts(data.events);
      setWarnings(data.warnings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parse failed");
    } finally {
      setParsing(false);
    }
  }

  function updateDraft(idx: number, patch: Partial<DraftEvent>) {
    setDrafts((current) =>
      current
        ? current.map((d, i) => (i === idx ? { ...d, ...patch } : d))
        : current,
    );
  }

  function removeDraft(idx: number) {
    setDrafts((current) =>
      current ? current.filter((_, i) => i !== idx) : current,
    );
  }

  async function confirmSave() {
    if (!drafts || !carnival) return;
    setSaving(true);
    setError(null);
    try {
      const db = getDb();
      const eventsCol = collection(
        db,
        "carnivals",
        DEFAULT_CARNIVAL_ID,
        "events",
      );
      const batch = writeBatch(db);
      drafts.forEach((d) => {
        batch.set(doc(eventsCol, uid()), d);
      });
      await batch.commit();
      setSaved(drafts.length);
      setDrafts(null);
      setFile(null);
      setWarnings([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Import program</h1>
        <p className="text-sm text-slate-500">
          Upload your existing program (PDF or image). Claude reads it,
          extracts the events, and gives you an editable list to review before
          anything is saved.
        </p>
      </header>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setSaved(null);
          }}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-700"
        />
        {file && (
          <p className="text-xs text-slate-500">
            {file.name} · {(file.size / 1024).toFixed(0)} KB · {file.type}
          </p>
        )}
        <button
          onClick={parse}
          disabled={!file || parsing}
          className="rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
        >
          {parsing ? "Parsing with Claude…" : "Parse program"}
        </button>
      </section>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </div>
      )}

      {saved !== null && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          Saved {saved} event{saved === 1 ? "" : "s"} to the schedule.
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="mb-1 font-semibold">Parsing warnings:</p>
          <ul className="list-disc pl-5">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {drafts && (
        <section className="space-y-3">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Review {drafts.length} extracted event
              {drafts.length === 1 ? "" : "s"}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDrafts(null);
                  setWarnings([]);
                }}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                Discard
              </button>
              <button
                onClick={confirmSave}
                disabled={saving || drafts.length === 0}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving
                  ? "Saving…"
                  : `Save ${drafts.length} event${drafts.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </header>

          <p className="text-sm text-slate-500">
            Tweak anything that looks wrong. Nothing is written to the schedule
            until you click Save.
          </p>

          <ul className="space-y-2">
            {drafts.map((d, i) => (
              <li
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="grid gap-2 sm:grid-cols-6">
                  <input
                    className="input sm:col-span-2"
                    placeholder="Name"
                    value={d.name}
                    onChange={(e) =>
                      updateDraft(i, { name: e.target.value })
                    }
                  />
                  <select
                    className="input"
                    value={d.type}
                    onChange={(e) =>
                      updateDraft(i, { type: e.target.value as EventType })
                    }
                  >
                    <option value="track">Track</option>
                    <option value="field">Field</option>
                  </select>
                  <select
                    className="input"
                    value={d.ageGroupId}
                    onChange={(e) =>
                      updateDraft(i, { ageGroupId: e.target.value })
                    }
                  >
                    <option value="">Age group…</option>
                    {carnival.ageGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="input"
                    value={d.categoryId}
                    onChange={(e) =>
                      updateDraft(i, { categoryId: e.target.value })
                    }
                  >
                    <option value="">Category…</option>
                    {carnival.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="input"
                    value={d.sessionId}
                    onChange={(e) =>
                      updateDraft(i, { sessionId: e.target.value })
                    }
                  >
                    <option value="">Session…</option>
                    {carnival.sessions
                      .slice()
                      .sort((a, b) => a.order - b.order)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-6">
                  <input
                    type="datetime-local"
                    className="input sm:col-span-2"
                    value={formatDateTimeLocal(d.scheduledTime)}
                    onChange={(e) =>
                      updateDraft(i, {
                        scheduledTime: parseDateTimeLocal(e.target.value),
                      })
                    }
                  />
                  <input
                    className="input sm:col-span-3"
                    placeholder="Location"
                    value={d.location}
                    onChange={(e) =>
                      updateDraft(i, { location: e.target.value })
                    }
                  />
                  <button
                    onClick={() => removeDraft(i)}
                    className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Originally extracted as {formatClockTime(d.scheduledTime)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
