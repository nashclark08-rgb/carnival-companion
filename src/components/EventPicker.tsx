"use client";

import { useMemo, useState } from "react";
import { CarnivalEvent, Carnival } from "@/lib/types";
import { formatClockTime } from "@/lib/time";

type Props = {
  carnival: Carnival;
  events: CarnivalEvent[];
  matchAgeGroupId: string;
  matchCategoryId: string;
  initialSelectedIds: string[];
  onCancel: () => void;
  onSave: (ids: string[]) => Promise<void> | void;
  saving?: boolean;
  primaryColor?: string;
  forWho?: string;
};

export function EventPicker({
  carnival,
  events,
  matchAgeGroupId,
  matchCategoryId,
  initialSelectedIds,
  onCancel,
  onSave,
  saving,
  primaryColor,
  forWho,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelectedIds),
  );
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    if (showAll) return events;
    return events.filter(
      (e) =>
        e.ageGroupId === matchAgeGroupId &&
        e.categoryId === matchCategoryId,
    );
  }, [events, matchAgeGroupId, matchCategoryId, showAll]);

  const grouped = useMemo(() => {
    const sessions = [...carnival.sessions].sort((a, b) => a.order - b.order);
    const fallback = {
      id: "__no_session__",
      name: "Unscheduled",
      order: 999,
    };
    return [...sessions, fallback]
      .map((s) => ({
        session: s,
        events: filtered
          .filter((e) =>
            s.id === "__no_session__"
              ? !sessions.some((sx) => sx.id === e.sessionId)
              : e.sessionId === s.id,
          )
          .sort((a, b) => {
            if (a.scheduledTime !== b.scheduledTime) {
              return a.scheduledTime - b.scheduledTime;
            }
            const nameCmp = a.name.localeCompare(b.name);
            if (nameCmp !== 0) return nameCmp;
            const aAg =
              carnival.ageGroups.find((g) => g.id === a.ageGroupId)?.label ?? "";
            const bAg =
              carnival.ageGroups.find((g) => g.id === b.ageGroupId)?.label ?? "";
            const agCmp = aAg.localeCompare(bAg);
            if (agCmp !== 0) return agCmp;
            const aCat =
              carnival.categories.find((c) => c.id === a.categoryId)?.label ?? "";
            const bCat =
              carnival.categories.find((c) => c.id === b.categoryId)?.label ?? "";
            return aCat.localeCompare(bCat);
          }),
      }))
      .filter((g) => g.events.length > 0);
  }, [filtered, carnival.sessions, carnival.ageGroups, carnival.categories]);

  function toggle(id: string) {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function tickAllMatching() {
    setSelected((cur) => {
      const next = new Set(cur);
      events
        .filter(
          (e) =>
            e.ageGroupId === matchAgeGroupId &&
            e.categoryId === matchCategoryId,
        )
        .forEach((e) => next.add(e.id));
      return next;
    });
  }

  function clearAll() {
    setSelected(new Set());
  }

  const matchCount = events.filter(
    (e) =>
      e.ageGroupId === matchAgeGroupId &&
      e.categoryId === matchCategoryId,
  ).length;

  const primaryStyle = primaryColor
    ? { background: primaryColor }
    : undefined;

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">
          {forWho ? `Pick ${forWho}'s events` : "Pick your events"}
        </h2>
        <p className="text-sm text-slate-500">
          Tick the events you&apos;re competing in. Untick to remove.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={tickAllMatching}
          className="rounded-lg border border-slate-300 px-2 py-1 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
        >
          Tick all in my group ({matchCount})
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="rounded-lg border border-slate-300 px-2 py-1 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
        >
          Clear all
        </button>
        <label className="ml-auto flex items-center gap-2">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="h-4 w-4"
          />
          Show all events (other age groups / categories)
        </label>
      </div>

      <div className="space-y-4">
        {grouped.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            No events to pick from. Ask staff if the schedule is set up.
          </p>
        )}
        {grouped.map(({ session, events: ev }) => (
          <section key={session.id} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {session.name}
            </h3>
            <ul className="space-y-1.5">
              {ev.map((e) => {
                const ag = carnival.ageGroups.find(
                  (g) => g.id === e.ageGroupId,
                );
                const cat = carnival.categories.find(
                  (c) => c.id === e.categoryId,
                );
                const isSelected = selected.has(e.id);
                const isMyGroup =
                  e.ageGroupId === matchAgeGroupId &&
                  e.categoryId === matchCategoryId;
                return (
                  <li
                    key={e.id}
                    className={`rounded-xl border p-3 ${
                      isSelected
                        ? "border-indigo-400 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/40"
                        : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                    }`}
                    style={
                      isSelected && primaryColor
                        ? {
                            borderColor: primaryColor,
                            background: `${primaryColor}14`,
                          }
                        : undefined
                    }
                  >
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(e.id)}
                        className="h-5 w-5"
                      />
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-semibold">{e.name}</span>
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {formatClockTime(e.scheduledTime)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {e.type} · {e.location} · {ag?.label ?? "?"}{" "}
                          {cat?.label ?? "?"}
                          {!isMyGroup && (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                              Outside your group
                            </span>
                          )}
                        </p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-between border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <span className="text-sm text-slate-500">
          {selected.size} event{selected.size === 1 ? "" : "s"} selected
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(Array.from(selected))}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
            style={primaryStyle ?? { background: "#4f46e5" }}
          >
            {saving ? "Saving…" : "Save selection"}
          </button>
        </div>
      </div>
    </div>
  );
}
