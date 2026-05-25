"use client";

import { useEffect, useState } from "react";
import { updateHousePoints, useCarnival } from "@/lib/db";
import { DEFAULT_CARNIVAL_ID } from "@/lib/firebase";
import { House } from "@/lib/types";
import { Leaderboard } from "@/components/Leaderboard";

export default function AdminLeaderboardPage() {
  const { carnival } = useCarnival(DEFAULT_CARNIVAL_ID);
  const [houses, setHouses] = useState<House[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (carnival) setHouses(carnival.houses);
  }, [carnival]);

  if (!carnival) {
    return (
      <p className="text-slate-500">
        Set up the carnival and add houses first.
      </p>
    );
  }

  function setPoints(id: string, points: number) {
    setHouses(houses.map((h) => (h.id === id ? { ...h, points } : h)));
  }

  function adjust(id: string, delta: number) {
    const h = houses.find((x) => x.id === id);
    if (h) setPoints(id, Math.max(0, h.points + delta));
  }

  async function save() {
    setSaving(true);
    try {
      await updateHousePoints(DEFAULT_CARNIVAL_ID, houses);
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-sm text-slate-500">
          Update house points. Attendees see changes the moment you save.
        </p>
      </header>

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        {houses.length === 0 && (
          <p className="text-sm text-slate-500">
            No houses set up yet. Add them in the Setup tab.
          </p>
        )}
        {houses.map((h) => (
          <div key={h.id} className="flex items-center gap-3">
            <span
              className="h-6 w-6 rounded-full border border-slate-300"
              style={{ backgroundColor: h.color }}
            />
            <span className="w-28 font-medium">{h.name}</span>
            <button
              onClick={() => adjust(h.id, -10)}
              className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              −10
            </button>
            <input
              type="number"
              className="input w-24 text-center"
              value={h.points}
              onChange={(e) =>
                setPoints(h.id, parseInt(e.target.value, 10) || 0)
              }
            />
            <button
              onClick={() => adjust(h.id, 10)}
              className="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              +10
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">
          {savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString()}` : ""}
        </span>
        <button
          onClick={save}
          disabled={saving || houses.length === 0}
          className="rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save points"}
        </button>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Preview
        </h2>
        <Leaderboard houses={houses} />
      </section>
    </div>
  );
}
