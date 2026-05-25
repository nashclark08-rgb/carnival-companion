"use client";

import { useEffect, useState } from "react";
import { CarnivalEvent } from "@/lib/types";
import { formatClockTime, formatCountdown } from "@/lib/time";

type Props = {
  event: CarnivalEvent | null;
  who?: string;
  primaryColor?: string;
  secondaryColor?: string;
};

const IN_PROGRESS_WINDOW_MS = 30 * 60 * 1000;

export function CountdownPin({
  event,
  who,
  primaryColor,
  secondaryColor,
}: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!event) {
    return (
      <div className="rounded-2xl bg-slate-100 p-6 text-center text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        No more events today
      </div>
    );
  }

  const msUntil = event.scheduledTime - now;
  const inProgress =
    msUntil <= 0 && Math.abs(msUntil) <= IN_PROGRESS_WINDOW_MS;
  const upcoming = msUntil > 0;
  const label = who ? `${who} — next event` : "Your next event";
  const inProgressLabel = who ? `${who} — happening now` : "Happening now";

  const fallbackUpcoming = "linear-gradient(135deg, #4f46e5, #7c3aed)";
  const fallbackInProgress = "linear-gradient(135deg, #10b981, #0d9488)";
  const gradient = inProgress
    ? secondaryColor
      ? `linear-gradient(135deg, ${secondaryColor}, ${primaryColor ?? secondaryColor})`
      : fallbackInProgress
    : primaryColor
      ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor ?? primaryColor})`
      : fallbackUpcoming;

  return (
    <div
      className="rounded-2xl p-6 text-white shadow-lg"
      style={{ background: gradient }}
    >
      <p className="text-sm font-medium uppercase tracking-wide opacity-80">
        {inProgress ? inProgressLabel : label}
      </p>
      <h2 className="mt-1 text-2xl font-bold">{event.name}</h2>
      <p className="mt-1 text-sm opacity-90">
        {event.location} · {formatClockTime(event.scheduledTime)}
      </p>
      {upcoming && (
        <>
          <p className="mt-4 text-5xl font-bold tabular-nums">
            {formatCountdown(msUntil)}
          </p>
          <p className="mt-1 text-sm opacity-80">until start</p>
        </>
      )}
      {inProgress && (
        <>
          <p className="mt-4 text-3xl font-bold">In progress</p>
          <p className="mt-1 text-sm opacity-90">
            Started {formatCountdown(Math.abs(msUntil))} ago
          </p>
        </>
      )}
    </div>
  );
}
