"use client";

import { useMemo, useState } from "react";
import { useAnnouncements, useCarnival, useEvents } from "@/lib/db";
import { DEFAULT_CARNIVAL_ID } from "@/lib/firebase";
import {
  AnnouncementBanner,
  AnnouncementHistory,
} from "@/components/AnnouncementBanner";
import { CountdownPin } from "@/components/CountdownPin";
import { Leaderboard } from "@/components/Leaderboard";
import { ScheduleList, ScheduleEvent } from "@/components/ScheduleList";
import { Role } from "@/lib/types";

type Draft = {
  role: Role;
  houseId: string;
  ageGroupId: string;
  categoryId: string;
};

export default function AdminPreviewPage() {
  const { carnival } = useCarnival(DEFAULT_CARNIVAL_ID);
  const events = useEvents(DEFAULT_CARNIVAL_ID);
  const announcements = useAnnouncements(DEFAULT_CARNIVAL_ID);

  const [draft, setDraft] = useState<Draft>({
    role: "student",
    houseId: "",
    ageGroupId: "",
    categoryId: "",
  });

  const now = Date.now();

  const filtered: ScheduleEvent[] = useMemo(() => {
    if (!draft.ageGroupId || !draft.categoryId) return [];
    return events.filter(
      (e) =>
        e.ageGroupId === draft.ageGroupId &&
        e.categoryId === draft.categoryId,
    );
  }, [events, draft]);

  const visibleAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      const target = a.target;
      if (!target || target.kind === "all") return true;
      if (target.kind === "house") return target.houseId === draft.houseId;
      if (target.kind === "ageGroup")
        return target.ageGroupId === draft.ageGroupId;
      return true;
    });
  }, [announcements, draft]);

  const nextEvent =
    filtered.find((e) => e.scheduledTime + 30 * 60 * 1000 >= now) ?? null;

  if (!carnival) {
    return (
      <p className="text-slate-500">
        Set up the carnival first before previewing.
      </p>
    );
  }

  const profileReady =
    draft.houseId && draft.ageGroupId && draft.categoryId;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Preview as attendee</h1>
        <p className="text-sm text-slate-500">
          See exactly what a student or parent with these details will see.
          Nothing is saved.
        </p>
      </header>

      <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4 dark:border-slate-700 dark:bg-slate-900">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Role
          </span>
          <select
            className="input"
            value={draft.role}
            onChange={(e) =>
              setDraft({ ...draft, role: e.target.value as Role })
            }
          >
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
            House
          </span>
          <select
            className="input"
            value={draft.houseId}
            onChange={(e) => setDraft({ ...draft, houseId: e.target.value })}
          >
            <option value="">Pick…</option>
            {carnival.houses.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Age group
          </span>
          <select
            className="input"
            value={draft.ageGroupId}
            onChange={(e) =>
              setDraft({ ...draft, ageGroupId: e.target.value })
            }
          >
            <option value="">Pick…</option>
            {carnival.ageGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Category
          </span>
          <select
            className="input"
            value={draft.categoryId}
            onChange={(e) =>
              setDraft({ ...draft, categoryId: e.target.value })
            }
          >
            <option value="">Pick…</option>
            {carnival.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Attendee view preview
        </p>
        {!profileReady ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            Pick a house, age group, and category to see the preview.
          </p>
        ) : (
          <div className="mx-auto max-w-md space-y-4">
            <AnnouncementBanner items={visibleAnnouncements} />
            <CountdownPin
              event={nextEvent}
              who={draft.role === "parent" ? "Their child" : undefined}
            />
            <Leaderboard houses={carnival.houses} />
            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Events
              </h3>
              <ScheduleList events={filtered} now={now} />
            </section>
            <AnnouncementHistory items={visibleAnnouncements} />
          </div>
        )}
      </section>
    </div>
  );
}
