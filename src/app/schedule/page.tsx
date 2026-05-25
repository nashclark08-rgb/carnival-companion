"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearProfile, loadProfile } from "@/lib/attendee";
import { useAnnouncements, useCarnival, useEvents } from "@/lib/db";
import { DEFAULT_CARNIVAL_ID } from "@/lib/firebase";
import { AttendeeProfile } from "@/lib/types";
import {
  AnnouncementBanner,
  AnnouncementHistory,
} from "@/components/AnnouncementBanner";
import { CountdownPin } from "@/components/CountdownPin";
import { Leaderboard } from "@/components/Leaderboard";
import { ScheduleList } from "@/components/ScheduleList";

export default function SchedulePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AttendeeProfile | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace("/");
      return;
    }
    setProfile(p);
  }, [router]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  const { carnival } = useCarnival(DEFAULT_CARNIVAL_ID);
  const events = useEvents(DEFAULT_CARNIVAL_ID);
  const announcements = useAnnouncements(DEFAULT_CARNIVAL_ID);

  const filtered = useMemo(() => {
    if (!profile) return [];
    return events.filter(
      (e) =>
        e.ageGroupId === profile.ageGroupId &&
        e.categoryId === profile.categoryId,
    );
  }, [events, profile]);

  const nextEvent = useMemo(
    () => filtered.find((e) => e.scheduledTime + 60 * 60 * 1000 >= now) ?? null,
    [filtered, now],
  );

  if (!profile || !carnival) {
    return <p className="p-6 text-center text-slate-500">Loading…</p>;
  }

  const who = profile.role === "parent" ? profile.name ?? "Your child" : undefined;
  const greeting =
    profile.role === "parent"
      ? `Following ${profile.name ?? "your child"}`
      : profile.name
        ? `Hi ${profile.name}`
        : "Your schedule";

  return (
    <div className="flex flex-1 flex-col">
      <AnnouncementBanner items={announcements} />

      <main className="mx-auto w-full max-w-md flex-1 space-y-6 p-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{greeting}</h1>
            <p className="text-xs text-slate-500">{carnival.name}</p>
          </div>
          <button
            onClick={() => {
              clearProfile();
              router.replace("/");
            }}
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Change
          </button>
        </header>

        <CountdownPin event={nextEvent} who={who} />

        <Leaderboard houses={carnival.houses} />

        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {profile.role === "parent" ? "Their events" : "Your events"}
          </h3>
          <ScheduleList events={filtered} now={now} />
        </section>

        <AnnouncementHistory items={announcements} />

        <p className="pt-4 text-center text-xs text-slate-500">
          Staff?{" "}
          <Link href="/admin" className="underline">
            Admin sign in
          </Link>
        </p>
      </main>
    </div>
  );
}
