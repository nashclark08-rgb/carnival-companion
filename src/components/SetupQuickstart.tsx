"use client";

import { useRef, useState } from "react";
import { writeBatch, collection, doc, getDocs } from "firebase/firestore";
import { saveCarnival } from "@/lib/db";
import { DEFAULT_CARNIVAL_ID, getDb } from "@/lib/firebase";
import { AgeGroup, Carnival, Category, Session } from "@/lib/types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

type ExtractedEvent = {
  name: string;
  type: "track" | "field";
  ageGroupLabel: string;
  categoryLabel: string;
  sessionLabel: string;
  scheduledTime: string;
  location: string;
};

type Extraction = {
  carnival: { name?: string; date?: string; venue?: string };
  ageGroups: { label: string }[];
  categories: { label: string }[];
  sessions: { name: string; order: number }[];
  events: ExtractedEvent[];
  warnings: string[];
};

type Props = {
  draft: Carnival;
  onApplyDraft: (next: Carnival) => void;
};

function mergeByLabel<T extends { id: string; label: string }>(
  existing: T[],
  extracted: { label: string }[],
  makeNew: (label: string) => T,
): { merged: T[]; idByLabel: Map<string, string> } {
  const idByLabel = new Map<string, string>();
  existing.forEach((e) => idByLabel.set(e.label.toLowerCase(), e.id));
  const merged: T[] = [...existing];
  for (const x of extracted) {
    const key = x.label.toLowerCase();
    if (!idByLabel.has(key)) {
      const item = makeNew(x.label);
      merged.push(item);
      idByLabel.set(key, item.id);
    }
  }
  return { merged, idByLabel };
}

function mergeSessionsByName(
  existing: Session[],
  extracted: { name: string; order: number }[],
): { merged: Session[]; idByName: Map<string, string> } {
  const idByName = new Map<string, string>();
  existing.forEach((s) => idByName.set(s.name.toLowerCase(), s.id));
  const merged: Session[] = [...existing];
  let nextOrder = Math.max(0, ...existing.map((s) => s.order)) + 1;
  for (const x of extracted) {
    const key = x.name.toLowerCase();
    if (!idByName.has(key)) {
      const item: Session = { id: uid(), name: x.name, order: nextOrder++ };
      merged.push(item);
      idByName.set(key, item.id);
    }
  }
  return { merged, idByName };
}

export function SetupQuickstart({ draft, onApplyDraft }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [replaceExistingEvents, setReplaceExistingEvents] = useState(false);
  const [applied, setApplied] = useState<{
    events: number;
    ageGroups: number;
    categories: number;
    sessions: number;
  } | null>(null);

  async function parse() {
    if (!file) return;
    setParsing(true);
    setError(null);
    setExtraction(null);
    setApplied(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/parse-setup", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Parse failed (${res.status})`);
      }
      setExtraction(data as Extraction);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parse failed");
    } finally {
      setParsing(false);
    }
  }

  async function applyAll() {
    if (!extraction) return;
    setApplying(true);
    setError(null);
    try {
      const { merged: mergedAgeGroups, idByLabel: ageGroupIdByLabel } =
        mergeByLabel<AgeGroup>(
          draft.ageGroups,
          extraction.ageGroups,
          (label) => ({ id: uid(), label }),
        );
      const { merged: mergedCategories, idByLabel: categoryIdByLabel } =
        mergeByLabel<Category>(
          draft.categories,
          extraction.categories,
          (label) => ({ id: uid(), label }),
        );
      const { merged: mergedSessions, idByName: sessionIdByName } =
        mergeSessionsByName(draft.sessions, extraction.sessions);

      const nextDraft: Carnival = {
        ...draft,
        name: draft.name || extraction.carnival.name || "",
        date: draft.date || extraction.carnival.date || "",
        venue: draft.venue || extraction.carnival.venue || "",
        ageGroups: mergedAgeGroups,
        categories: mergedCategories,
        sessions: mergedSessions,
      };

      await saveCarnival(nextDraft);
      onApplyDraft(nextDraft);

      const dateStr =
        nextDraft.date || new Date().toISOString().slice(0, 10);
      const db = getDb();
      const eventsCol = collection(
        db,
        "carnivals",
        DEFAULT_CARNIVAL_ID,
        "events",
      );
      const batch = writeBatch(db);

      if (replaceExistingEvents) {
        const existing = await getDocs(eventsCol);
        existing.forEach((d) => batch.delete(d.ref));
      }

      let written = 0;
      let skipped = 0;
      extraction.events.forEach((e) => {
        const agId = ageGroupIdByLabel.get(e.ageGroupLabel.toLowerCase());
        const catId = categoryIdByLabel.get(e.categoryLabel.toLowerCase());
        const sesId = sessionIdByName.get(e.sessionLabel.toLowerCase());
        if (!agId || !catId || !sesId) {
          skipped++;
          return;
        }
        const [hStr, mStr] = e.scheduledTime.split(":");
        const h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);
        const d = new Date(dateStr);
        d.setHours(
          Number.isFinite(h) ? h : 0,
          Number.isFinite(m) ? m : 0,
          0,
          0,
        );
        batch.set(doc(eventsCol, uid()), {
          name: e.name,
          type: e.type,
          ageGroupId: agId,
          categoryId: catId,
          sessionId: sesId,
          scheduledTime: d.getTime(),
          location: e.location,
        });
        written++;
      });

      await batch.commit();
      setApplied({
        events: written,
        ageGroups: mergedAgeGroups.length - draft.ageGroups.length,
        categories: mergedCategories.length - draft.categories.length,
        sessions: mergedSessions.length - draft.sessions.length,
      });
      if (skipped > 0) {
        setError(
          `${skipped} event${skipped === 1 ? "" : "s"} could not be mapped to an age group / category / session and were skipped.`,
        );
      }
      setExtraction(null);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Apply failed");
    } finally {
      setApplying(false);
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30">
      <header>
        <h2 className="text-lg font-semibold">Auto-fill from program</h2>
        <p className="text-sm text-indigo-900/80 dark:text-indigo-200/80">
          Upload your printed program (PDF, image, or CSV). Claude extracts
          the carnival meta, age groups, categories, sessions and all events
          in one go. You still review the result before it goes live.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/png,image/jpeg,image/webp,text/csv,text/plain,.csv,.tsv,.txt"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setExtraction(null);
            setApplied(null);
          }}
          className="block text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-700"
        />
        <button
          onClick={parse}
          disabled={!file || parsing}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
        >
          {parsing ? "Reading…" : "Parse program"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </div>
      )}

      {applied && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
          Applied. Wrote {applied.events} events;{" "}
          {applied.ageGroups > 0 ? `${applied.ageGroups} new age group${applied.ageGroups === 1 ? "" : "s"}, ` : ""}
          {applied.categories > 0 ? `${applied.categories} new categor${applied.categories === 1 ? "y" : "ies"}, ` : ""}
          {applied.sessions > 0 ? `${applied.sessions} new session${applied.sessions === 1 ? "" : "s"}.` : ""}
          {" "}Don&apos;t forget to add houses and branding, then click Save.
        </div>
      )}

      {extraction && (
        <div className="space-y-3 rounded-lg border border-indigo-200 bg-white p-3 dark:border-indigo-900 dark:bg-slate-900">
          <h3 className="text-sm font-semibold">Review what Claude found</h3>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            <li>
              <strong>Carnival:</strong>{" "}
              {extraction.carnival.name || "(no name)"} ·{" "}
              {extraction.carnival.date || "no date"} ·{" "}
              {extraction.carnival.venue || "no venue"}
            </li>
            <li>
              <strong>Age groups ({extraction.ageGroups.length}):</strong>{" "}
              {extraction.ageGroups.map((g) => g.label).join(", ") || "—"}
            </li>
            <li>
              <strong>Categories ({extraction.categories.length}):</strong>{" "}
              {extraction.categories.map((c) => c.label).join(", ") || "—"}
            </li>
            <li>
              <strong>Sessions ({extraction.sessions.length}):</strong>{" "}
              {extraction.sessions.map((s) => s.name).join(", ") || "—"}
            </li>
            <li className="sm:col-span-2">
              <strong>Events:</strong> {extraction.events.length} extracted
            </li>
          </ul>

          {extraction.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
              <p className="font-semibold">Parsing warnings:</p>
              <ul className="list-disc pl-4">
                {extraction.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={replaceExistingEvents}
              onChange={(e) => setReplaceExistingEvents(e.target.checked)}
              className="h-4 w-4"
            />
            Also delete all existing events before applying (recommended for a
            fresh setup)
          </label>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setExtraction(null)}
              disabled={applying}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              Discard
            </button>
            <button
              onClick={applyAll}
              disabled={applying}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {applying
                ? "Applying…"
                : `Apply: write ${extraction.events.length} events`}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
