"use client";

import { useEffect, useState } from "react";
import { CarnivalEvent } from "@/lib/types";
import { formatClockTime, formatCountdown } from "@/lib/time";

type Props = {
  event: CarnivalEvent | null;
  who?: string;
};

export function CountdownPin({ event, who }: Props) {
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
  const inProgress = msUntil <= 0;
  const label = who ? `${who} — next event` : "Your next event";

  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-lg">
      <p className="text-sm font-medium uppercase tracking-wide opacity-80">
        {label}
      </p>
      <h2 className="mt-1 text-2xl font-bold">{event.name}</h2>
      <p className="mt-1 text-sm opacity-90">
        {event.location} · {formatClockTime(event.scheduledTime)}
      </p>
      <p className="mt-4 text-5xl font-bold tabular-nums">
        {inProgress ? "Now" : formatCountdown(msUntil)}
      </p>
      {!inProgress && (
        <p className="mt-1 text-sm opacity-80">until start</p>
      )}
    </div>
  );
}
