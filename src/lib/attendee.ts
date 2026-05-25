"use client";

import {
  AttendeeProfile,
  ChildProfile,
  MyResult,
  ParentProfile,
  StudentProfile,
} from "./types";

const KEY = "carnival-companion:attendee";

type LegacyParentProfile = {
  role: "parent";
  carnivalId: string;
  houseId?: string;
  ageGroupId?: string;
  categoryId?: string;
  name?: string;
  children?: ChildProfile[];
};

type StoredProfile = StudentProfile | LegacyParentProfile;

function migrate(raw: StoredProfile): AttendeeProfile {
  if (raw.role === "student") return raw;

  if (Array.isArray(raw.children) && raw.children.length > 0) {
    return {
      role: "parent",
      carnivalId: raw.carnivalId,
      children: raw.children,
    };
  }

  if (raw.houseId && raw.ageGroupId && raw.categoryId) {
    return {
      role: "parent",
      carnivalId: raw.carnivalId,
      children: [
        {
          houseId: raw.houseId,
          ageGroupId: raw.ageGroupId,
          categoryId: raw.categoryId,
          name: raw.name,
        },
      ],
    };
  }

  return {
    role: "parent",
    carnivalId: raw.carnivalId,
    children: [],
  };
}

export function loadProfile(): AttendeeProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredProfile;
    return migrate(parsed);
  } catch {
    return null;
  }
}

export function saveProfile(profile: AttendeeProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(profile));
}

export function addChild(child: ChildProfile): AttendeeProfile | null {
  const current = loadProfile();
  if (!current || current.role !== "parent") return current;
  const updated: ParentProfile = {
    ...current,
    children: [...current.children, child],
  };
  saveProfile(updated);
  return updated;
}

export function removeChild(idx: number): AttendeeProfile | null {
  const current = loadProfile();
  if (!current || current.role !== "parent") return current;
  const updated: ParentProfile = {
    ...current,
    children: current.children.filter((_, i) => i !== idx),
  };
  saveProfile(updated);
  return updated;
}

export function setStudentSelectedEvents(
  ids: string[],
): AttendeeProfile | null {
  const current = loadProfile();
  if (!current || current.role !== "student") return current;
  const updated: StudentProfile = { ...current, selectedEventIds: ids };
  saveProfile(updated);
  return updated;
}

export function setChildSelectedEvents(
  childIdx: number,
  ids: string[],
): AttendeeProfile | null {
  const current = loadProfile();
  if (!current || current.role !== "parent") return current;
  const updated: ParentProfile = {
    ...current,
    children: current.children.map((c, i) =>
      i === childIdx ? { ...c, selectedEventIds: ids } : c,
    ),
  };
  saveProfile(updated);
  return updated;
}

function upsertMyResult(
  results: MyResult[] | undefined,
  result: MyResult,
): MyResult[] {
  const list = results ?? [];
  const idx = list.findIndex((r) => r.eventId === result.eventId);
  if (idx >= 0) {
    const next = [...list];
    next[idx] = result;
    return next;
  }
  return [...list, result];
}

function removeMyResult(
  results: MyResult[] | undefined,
  eventId: string,
): MyResult[] {
  return (results ?? []).filter((r) => r.eventId !== eventId);
}

export function recordStudentResult(result: MyResult): AttendeeProfile | null {
  const current = loadProfile();
  if (!current || current.role !== "student") return current;
  const updated: StudentProfile = {
    ...current,
    myResults: upsertMyResult(current.myResults, result),
  };
  saveProfile(updated);
  return updated;
}

export function clearStudentResult(eventId: string): AttendeeProfile | null {
  const current = loadProfile();
  if (!current || current.role !== "student") return current;
  const updated: StudentProfile = {
    ...current,
    myResults: removeMyResult(current.myResults, eventId),
  };
  saveProfile(updated);
  return updated;
}

export function recordChildResult(
  childIdx: number,
  result: MyResult,
): AttendeeProfile | null {
  const current = loadProfile();
  if (!current || current.role !== "parent") return current;
  const updated: ParentProfile = {
    ...current,
    children: current.children.map((c, i) =>
      i === childIdx
        ? { ...c, myResults: upsertMyResult(c.myResults, result) }
        : c,
    ),
  };
  saveProfile(updated);
  return updated;
}

export function clearChildResult(
  childIdx: number,
  eventId: string,
): AttendeeProfile | null {
  const current = loadProfile();
  if (!current || current.role !== "parent") return current;
  const updated: ParentProfile = {
    ...current,
    children: current.children.map((c, i) =>
      i === childIdx
        ? { ...c, myResults: removeMyResult(c.myResults, eventId) }
        : c,
    ),
  };
  saveProfile(updated);
  return updated;
}

export function clearProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
