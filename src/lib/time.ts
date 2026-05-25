export function formatCountdown(msUntil: number): string {
  if (msUntil <= 0) return "Starting now";
  const totalSeconds = Math.floor(msUntil / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }
  return `${seconds}s`;
}

export function formatClockTime(epochMs: number): string {
  const d = new Date(epochMs);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatDateTimeLocal(epochMs: number): string {
  const d = new Date(epochMs);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function parseDateTimeLocal(value: string): number {
  return new Date(value).getTime();
}

export function formatAEST(epochMs: number): string {
  return new Date(epochMs).toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
    hour12: false,
  });
}

export function formatRelative(epochMs: number, now: number = Date.now()): string {
  const diff = now - epochMs;
  const absSec = Math.floor(Math.abs(diff) / 1000);
  if (absSec < 60) return diff >= 0 ? "just now" : "in a moment";
  const absMin = Math.floor(absSec / 60);
  if (absMin < 60) return diff >= 0 ? `${absMin}m ago` : `in ${absMin}m`;
  const absH = Math.floor(absMin / 60);
  if (absH < 24) return diff >= 0 ? `${absH}h ago` : `in ${absH}h`;
  const absD = Math.floor(absH / 24);
  return diff >= 0 ? `${absD}d ago` : `in ${absD}d`;
}
