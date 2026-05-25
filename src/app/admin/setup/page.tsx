"use client";

import { useEffect, useState } from "react";
import { useCarnival, saveCarnival } from "@/lib/db";
import { DEFAULT_CARNIVAL_ID } from "@/lib/firebase";
import {
  AgeGroup,
  Carnival,
  Category,
  House,
  Session,
} from "@/lib/types";
import { resizeImageToDataUrl } from "@/lib/image";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const EMPTY: Carnival = {
  id: DEFAULT_CARNIVAL_ID,
  name: "",
  date: "",
  venue: "",
  schoolName: "",
  status: "draft",
  houses: [],
  ageGroups: [],
  categories: [
    { id: uid(), label: "Boys" },
    { id: uid(), label: "Girls" },
  ],
  sessions: [
    { id: uid(), name: "Session 1", order: 1 },
    { id: uid(), name: "Session 2", order: 2 },
    { id: uid(), name: "Session 3", order: 3 },
  ],
};

export default function AdminSetupPage() {
  const { carnival, loading } = useCarnival(DEFAULT_CARNIVAL_ID);
  const [draft, setDraft] = useState<Carnival>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (carnival) setDraft(carnival);
  }, [carnival]);

  async function handleSave() {
    setSaving(true);
    try {
      await saveCarnival(draft);
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Setup</h1>
        <p className="text-sm text-slate-500">
          Configure the carnival. Changes go live to attendees the moment you
          save.
        </p>
      </header>

      <Section title="Carnival">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
          <TextField label="School" value={draft.schoolName} onChange={(v) => setDraft({ ...draft, schoolName: v })} />
          <TextField label="Venue" value={draft.venue} onChange={(v) => setDraft({ ...draft, venue: v })} />
          <TextField label="Date" type="date" value={draft.date} onChange={(v) => setDraft({ ...draft, date: v })} />
        </div>
      </Section>

      <Section title="School branding">
        <p className="text-sm text-slate-500">
          Logo and colours are used on the attendee app (header, countdown
          pin). Optional — defaults apply if blank.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <span className="mb-1 block text-sm font-medium">Logo</span>
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded border border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800">
                {draft.branding?.logoDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={draft.branding.logoDataUrl}
                    alt="Logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-400">none</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const dataUrl = await resizeImageToDataUrl(file, 256);
                      setDraft({
                        ...draft,
                        branding: { ...draft.branding, logoDataUrl: dataUrl },
                      });
                    } catch {
                      // ignore — preview stays blank if resize fails
                    }
                  }}
                  className="text-xs"
                />
                {draft.branding?.logoDataUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        branding: {
                          ...draft.branding,
                          logoDataUrl: undefined,
                        },
                      })
                    }
                    className="self-start text-xs text-slate-500 underline hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Primary colour
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-10 w-12 cursor-pointer rounded border border-slate-300"
                value={draft.branding?.primaryColor ?? "#4f46e5"}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    branding: {
                      ...draft.branding,
                      primaryColor: e.target.value,
                    },
                  })
                }
              />
              <input
                type="text"
                className="input"
                placeholder="#4f46e5"
                value={draft.branding?.primaryColor ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    branding: {
                      ...draft.branding,
                      primaryColor: e.target.value || undefined,
                    },
                  })
                }
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Secondary colour
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                className="h-10 w-12 cursor-pointer rounded border border-slate-300"
                value={draft.branding?.secondaryColor ?? "#7c3aed"}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    branding: {
                      ...draft.branding,
                      secondaryColor: e.target.value,
                    },
                  })
                }
              />
              <input
                type="text"
                className="input"
                placeholder="#7c3aed"
                value={draft.branding?.secondaryColor ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    branding: {
                      ...draft.branding,
                      secondaryColor: e.target.value || undefined,
                    },
                  })
                }
              />
            </div>
          </label>
        </div>
      </Section>

      <Section title="Houses">
        <ListEditor<House>
          items={draft.houses}
          onChange={(houses) => setDraft({ ...draft, houses })}
          newItem={() => ({ id: uid(), name: "", color: "#10b981", points: 0 })}
          render={(item, set) => (
            <>
              <input
                className="input flex-1"
                placeholder="House name"
                value={item.name}
                onChange={(e) => set({ ...item, name: e.target.value })}
              />
              <input
                type="color"
                className="h-10 w-12 cursor-pointer rounded border border-slate-300"
                value={item.color}
                onChange={(e) => set({ ...item, color: e.target.value })}
              />
            </>
          )}
        />
      </Section>

      <Section title="Age groups">
        <ListEditor<AgeGroup>
          items={draft.ageGroups}
          onChange={(ageGroups) => setDraft({ ...draft, ageGroups })}
          newItem={() => ({ id: uid(), label: "" })}
          render={(item, set) => (
            <input
              className="input flex-1"
              placeholder="e.g. Under 13"
              value={item.label}
              onChange={(e) => set({ ...item, label: e.target.value })}
            />
          )}
        />
      </Section>

      <Section title="Categories">
        <ListEditor<Category>
          items={draft.categories}
          onChange={(categories) => setDraft({ ...draft, categories })}
          newItem={() => ({ id: uid(), label: "" })}
          render={(item, set) => (
            <input
              className="input flex-1"
              placeholder="e.g. Boys, Girls, Open, Mixed, All-abilities"
              value={item.label}
              onChange={(e) => set({ ...item, label: e.target.value })}
            />
          )}
        />
      </Section>

      <Section title="Sessions">
        <ListEditor<Session>
          items={draft.sessions}
          onChange={(sessions) => setDraft({ ...draft, sessions })}
          newItem={() => ({
            id: uid(),
            name: "",
            order: draft.sessions.length + 1,
          })}
          render={(item, set) => (
            <>
              <input
                className="input flex-1"
                placeholder="Session name"
                value={item.name}
                onChange={(e) => set({ ...item, name: e.target.value })}
              />
              <input
                type="number"
                className="input w-20"
                value={item.order}
                onChange={(e) =>
                  set({ ...item, order: parseInt(e.target.value, 10) || 0 })
                }
              />
            </>
          )}
        />
      </Section>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-between border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <span className="text-sm text-slate-500">
          {savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString()}` : ""}
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      />
    </label>
  );
}

type ListEditorProps<T extends { id: string }> = {
  items: T[];
  onChange: (items: T[]) => void;
  newItem: () => T;
  render: (item: T, set: (updated: T) => void) => React.ReactNode;
};

function ListEditor<T extends { id: string }>({
  items,
  onChange,
  newItem,
  render,
}: ListEditorProps<T>) {
  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <p className="text-sm text-slate-500">None yet.</p>
      )}
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          {render(item, (updated) =>
            onChange(items.map((i) => (i.id === item.id ? updated : i))),
          )}
          <button
            type="button"
            onClick={() => onChange(items.filter((i) => i.id !== item.id))}
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-600 hover:bg-red-50 hover:text-red-700"
            aria-label="Remove"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, newItem()])}
        className="rounded-lg border border-dashed border-slate-400 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        + Add
      </button>
    </div>
  );
}
