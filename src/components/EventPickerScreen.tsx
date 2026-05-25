"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  loadProfile,
  setChildSelectedEvents,
  setStudentSelectedEvents,
} from "@/lib/attendee";
import { useCarnival, useEvents } from "@/lib/db";
import { DEFAULT_CARNIVAL_ID } from "@/lib/firebase";
import { AttendeeProfile } from "@/lib/types";
import { EventPicker } from "@/components/EventPicker";

export function EventPickerScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const childIdxParam = params.get("child");
  const childIdx = childIdxParam ? parseInt(childIdxParam, 10) : null;

  const [profile, setProfile] = useState<AttendeeProfile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    if (!p) {
      router.replace("/");
      return;
    }
    setProfile(p);
  }, [router]);

  const { carnival, loading } = useCarnival(DEFAULT_CARNIVAL_ID);
  const events = useEvents(DEFAULT_CARNIVAL_ID);

  if (!profile || loading || !carnival) {
    return <p className="text-center text-slate-500">Loading…</p>;
  }

  let matchAgeGroupId: string;
  let matchCategoryId: string;
  let initialSelectedIds: string[];
  let forWho: string | undefined;

  if (profile.role === "student") {
    matchAgeGroupId = profile.ageGroupId;
    matchCategoryId = profile.categoryId;
    initialSelectedIds = profile.selectedEventIds ?? [];
    forWho = undefined;
  } else {
    const idx = childIdx ?? 0;
    const child = profile.children[idx];
    if (!child) {
      router.replace("/schedule");
      return null;
    }
    matchAgeGroupId = child.ageGroupId;
    matchCategoryId = child.categoryId;
    initialSelectedIds = child.selectedEventIds ?? [];
    forWho = child.name ?? `Child ${idx + 1}`;
  }

  async function handleSave(ids: string[]) {
    setSaving(true);
    try {
      if (profile!.role === "student") {
        setStudentSelectedEvents(ids);
      } else {
        setChildSelectedEvents(childIdx ?? 0, ids);
      }
      router.replace("/schedule");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.back();
  }

  return (
    <EventPicker
      carnival={carnival}
      events={events}
      matchAgeGroupId={matchAgeGroupId}
      matchCategoryId={matchCategoryId}
      initialSelectedIds={initialSelectedIds}
      onCancel={handleCancel}
      onSave={handleSave}
      saving={saving}
      primaryColor={carnival.branding?.primaryColor}
      forWho={forWho}
    />
  );
}
