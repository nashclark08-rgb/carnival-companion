"use client";

import { AttendeeProfile } from "./types";

const KEY = "carnival-companion:attendee";

export function loadProfile(): AttendeeProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AttendeeProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: AttendeeProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(profile));
}

export function clearProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
