"use client";

import { useEffect, useState } from "react";
import { Announcement } from "@/lib/types";

const SEEN_KEY = "carnival-companion:notified-ids";

function loadSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(
      JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? "[]") as string[],
    );
  } catch {
    return new Set();
  }
}

function persistSeen(seen: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    SEEN_KEY,
    JSON.stringify(Array.from(seen).slice(-200)),
  );
}

type Permission = "default" | "granted" | "denied" | "unsupported";

function readPermission(): Permission {
  if (typeof window === "undefined" || !("Notification" in window))
    return "unsupported";
  return Notification.permission as Permission;
}

export function NotificationOptIn({
  announcements,
  primaryColor,
}: {
  announcements: Announcement[];
  primaryColor?: string;
}) {
  const [permission, setPermission] = useState<Permission>("default");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setPermission(readPermission());
  }, []);

  useEffect(() => {
    if (permission !== "granted") return;
    const seen = loadSeen();
    let changed = false;
    const recent = announcements.filter(
      (a) => Date.now() - a.createdAt < 10 * 60 * 1000,
    );
    for (const a of recent) {
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      changed = true;
      try {
        new Notification(
          a.severity === "urgent"
            ? "Urgent — Carnival alert"
            : a.severity === "reminder"
              ? "Carnival reminder"
              : "Carnival update",
          {
            body: a.message,
            icon: "/icon.svg",
            tag: a.id,
            requireInteraction: a.severity === "urgent",
          },
        );
      } catch {
        // ignore — some browsers refuse Notifications from non-secure contexts
      }
    }
    if (changed) persistSeen(seen);
  }, [announcements, permission]);

  async function enable() {
    if (permission === "unsupported") return;
    const result = await Notification.requestPermission();
    setPermission(result as Permission);
    if (result === "granted") {
      const seen = loadSeen();
      announcements.forEach((a) => seen.add(a.id));
      persistSeen(seen);
    }
  }

  if (permission === "granted" || permission === "unsupported" || dismissed) {
    return null;
  }

  if (permission === "denied") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900">
        Notifications are blocked for this site. To re-enable, click the lock
        icon in the address bar and allow notifications.
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm dark:border-indigo-900/60 dark:bg-indigo-950/40">
      <div className="flex-1">
        <p className="font-medium text-indigo-900 dark:text-indigo-100">
          Get a buzz for new alerts
        </p>
        <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80">
          Allow notifications so you don&apos;t miss urgent updates while the
          app is in the background.
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <button
          onClick={enable}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
          style={{ background: primaryColor ?? "#4f46e5" }}
        >
          Allow
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-indigo-700/80 hover:underline dark:text-indigo-300/80"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
