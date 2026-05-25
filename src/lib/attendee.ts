"use client";

import {
  AttendeeProfile,
  ChildProfile,
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

export function clearProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
