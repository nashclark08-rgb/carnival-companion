"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  clearChildResult,
  clearProfile,
  loadProfile,
  recordChildResult,
  recordStudentResult,
  clearStudentResult,
  removeChild,
} from "@/lib/attendee";
import { useAnnouncements, useCarnival, useEvents } from "@/lib/db";
import { DEFAULT_CARNIVAL_ID } from "@/lib/firebase";
import { AttendeeProfile } from "@/lib/types";
import {
  AnnouncementBanner,
  AnnouncementHistory,
} from "@/components/AnnouncementBanner";
import { CountdownPin } from "@/components/CountdownPin";
import { Leaderboard } from "@/components/Leaderboard";
import { ScheduleList, ScheduleEvent } from "@/components/ScheduleList";
import { RecordResultModal } from "@/components/RecordResultModal";
import { MyResult } from "@/lib/types";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { NotificationOptIn } from "@/components/NotificationOptIn";
import { BrandedHeader } from "@/components/BrandedHeader";
import { InstallPrompt } from "@/components/InstallPrompt";

function ownerLabel(name: string | undefined, idx: number) {
  return name && name.trim() ? name : `Child ${idx + 1}`;
}

export default function SchedulePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AttendeeProfile | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const p = loadProfile();
    if (!p || (p.role === "parent" && p.children.length === 0)) {
      router.replace("/");
      return;
    }
    setProfile(p);
  }, [router]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const { carnival } = useCarnival(DEFAULT_CARNIVAL_ID);
  const events = useEvents(DEFAULT_CARNIVAL_ID);
  const announcements = useAnnouncements(DEFAULT_CARNIVAL_ID);

  const scheduleEvents: ScheduleEvent[] = useMemo(() => {
    if (!profile) return [];
    if (profile.role === "student") {
      if (profile.selectedEventIds !== undefined) {
        const idSet = new Set(profile.selectedEventIds);
        return events
          .filter((e) => idSet.has(e.id))
          .map((e) => ({ ...e, ownerKey: "student" }));
      }
      return events
        .filter(
          (e) =>
            e.ageGroupId === profile.ageGroupId &&
            e.categoryId === profile.categoryId,
        )
        .map((e) => ({ ...e, ownerKey: "student" }));
    }
    const out: ScheduleEvent[] = [];
    profile.children.forEach((child, idx) => {
      const label = ownerLabel(child.name, idx);
      const childEvents = events.filter(
        (e) =>
          e.ageGroupId === child.ageGroupId &&
          e.categoryId === child.categoryId,
      );
      childEvents.forEach((e) =>
        out.push({ ...e, ownerLabel: label, ownerKey: `child:${idx}` }),
      );
    });
    return out.sort((a, b) => a.scheduledTime - b.scheduledTime);
  }, [events, profile]);

  const visibleAnnouncements = useMemo(() => {
    if (!profile) return announcements;
    return announcements.filter((a) => {
      if (a.expiresAt !== undefined && a.expiresAt < now) return false;
      const target = a.target;
      if (!target || target.kind === "all") return true;
      if (target.kind === "house") {
        if (profile.role === "student")
          return target.houseId === profile.houseId;
        return profile.children.some((c) => c.houseId === target.houseId);
      }
      if (target.kind === "ageGroup") {
        if (profile.role === "student")
          return target.ageGroupId === profile.ageGroupId;
        return profile.children.some(
          (c) => c.ageGroupId === target.ageGroupId,
        );
      }
      return true;
    });
  }, [announcements, profile, now]);

  const nextEvent = useMemo(
    () =>
      scheduleEvents.find(
        (e) => e.scheduledTime + 30 * 60 * 1000 >= now,
      ) ?? null,
    [scheduleEvents, now],
  );

  const [recording, setRecording] = useState<ScheduleEvent | null>(null);

  function lookupMyResult(event: ScheduleEvent): MyResult | undefined {
    if (!profile) return undefined;
    if (profile.role === "student") {
      return profile.myResults?.find((r) => r.eventId === event.id);
    }
    if (event.ownerKey?.startsWith("child:")) {
      const idx = parseInt(event.ownerKey.slice("child:".length), 10);
      return profile.children[idx]?.myResults?.find(
        (r) => r.eventId === event.id,
      );
    }
    return undefined;
  }

  async function handleSaveResult(result: MyResult) {
    if (!profile || !recording) return;
    let updated;
    if (profile.role === "student") {
      updated = recordStudentResult(result);
    } else if (recording.ownerKey?.startsWith("child:")) {
      const idx = parseInt(
        recording.ownerKey.slice("child:".length),
        10,
      );
      updated = recordChildResult(idx, result);
    }
    if (updated) setProfile(updated);
    setRecording(null);
  }

  async function handleClearResult() {
    if (!profile || !recording) return;
    let updated;
    if (profile.role === "student") {
      updated = clearStudentResult(recording.id);
    } else if (recording.ownerKey?.startsWith("child:")) {
      const idx = parseInt(
        recording.ownerKey.slice("child:".length),
        10,
      );
      updated = clearChildResult(idx, recording.id);
    }
    if (updated) setProfile(updated);
    setRecording(null);
  }

  if (!profile || !carnival) {
    return <p className="p-6 text-center text-slate-500">Loading…</p>;
  }

  const isParent = profile.role === "parent";
  const multiChild = isParent && profile.children.length > 1;

  const greeting = isParent
    ? profile.children.length === 1
      ? `Following ${ownerLabel(profile.children[0].name, 0)}`
      : `Following ${profile.children.length} children`
    : profile.name
      ? `Hi ${profile.name}`
      : "Your schedule";

  const who = nextEvent?.ownerLabel ?? (isParent ? "Your child" : undefined);

  return (
    <div className="flex flex-1 flex-col">
      <AnnouncementBanner items={visibleAnnouncements} />
      <BrandedHeader carnival={carnival} subtitle={carnival.schoolName} />

      <main className="mx-auto w-full max-w-md flex-1 space-y-6 p-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{greeting}</h1>
            <p className="text-xs text-slate-500">{carnival.venue}</p>
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

        <CountdownPin
          event={nextEvent}
          who={who}
          primaryColor={carnival.branding?.primaryColor}
          secondaryColor={carnival.branding?.secondaryColor}
        />

        <NotificationOptIn announcements={visibleAnnouncements} />
        <InstallPrompt />

        {isParent && (
          <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Following
              </h3>
              <Link
                href="/onboarding/parent?mode=addChild"
                className="rounded-lg bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-700"
              >
                + Add child
              </Link>
            </div>
            <ul className="mt-2 space-y-1">
              {profile.children.map((c, i) => {
                const house = carnival.houses.find((h) => h.id === c.houseId);
                const ag = carnival.ageGroups.find(
                  (g) => g.id === c.ageGroupId,
                );
                const cat = carnival.categories.find(
                  (x) => x.id === c.categoryId,
                );
                return (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: house?.color ?? "#888" }}
                      />
                      <span className="font-medium">
                        {ownerLabel(c.name, i)}
                      </span>
                      <span className="text-slate-500">
                        {ag?.label ?? "?"} · {cat?.label ?? "?"}
                      </span>
                    </span>
                    {profile.children.length > 1 && (
                      <button
                        onClick={() => {
                          const updated = removeChild(i);
                          setProfile(updated);
                        }}
                        className="text-xs text-slate-400 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <Leaderboard
          houses={carnival.houses}
          updatedAt={carnival.pointsUpdatedAt}
        />

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {isParent ? "Their events" : "Your events"}
            </h3>
            {!isParent && (
              <Link
                href="/onboarding/events"
                className="text-xs font-medium underline"
                style={{
                  color: carnival.branding?.primaryColor ?? "#4f46e5",
                }}
              >
                Update my events
              </Link>
            )}
          </div>
          <ScheduleList
            events={scheduleEvents}
            now={now}
            showOwners={multiChild}
            houses={carnival.houses}
            getMyResult={lookupMyResult}
            onRecord={(e) => setRecording(e)}
            primaryColor={carnival.branding?.primaryColor}
          />
        </section>

        <AnnouncementHistory items={visibleAnnouncements} />

        <p className="pt-4 text-center text-xs text-slate-500">
          Staff?{" "}
          <Link href="/admin" className="underline">
            Admin sign in
          </Link>
        </p>
      </main>

      <ConnectionStatus />

      {recording && (
        <RecordResultModal
          event={recording}
          existing={lookupMyResult(recording)}
          forWho={recording.ownerLabel}
          primaryColor={carnival.branding?.primaryColor}
          onCancel={() => setRecording(null)}
          onSave={handleSaveResult}
          onClear={handleClearResult}
        />
      )}
    </div>
  );
}
