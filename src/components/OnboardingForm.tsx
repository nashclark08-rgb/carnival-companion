"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCarnival } from "@/lib/db";
import { addChild, saveProfile } from "@/lib/attendee";
import { DEFAULT_CARNIVAL_ID } from "@/lib/firebase";
import { Role } from "@/lib/types";

type Props = {
  role: Role;
  mode?: "new" | "addChild";
};

export function OnboardingForm({ role, mode = "new" }: Props) {
  const router = useRouter();
  const { carnival, loading } = useCarnival(DEFAULT_CARNIVAL_ID);
  const [houseId, setHouseId] = useState("");
  const [ageGroupId, setAgeGroupId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");

  if (loading) {
    return <p className="text-center text-slate-500">Loading carnival…</p>;
  }
  if (!carnival) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        No carnival is set up yet. Ask a staff member to configure one in the
        admin portal.
      </div>
    );
  }

  const isParent = role === "parent";
  const isAddingChild = isParent && mode === "addChild";
  const nameLabel = isParent ? "Child's first name" : "Your first name";
  const namePlaceholder = isParent ? "e.g. Mia" : "e.g. Sam";
  const heading = isAddingChild
    ? "Add another child"
    : isParent
      ? "Who are you following?"
      : "Tell us about yourself";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!houseId || !ageGroupId || !categoryId) return;

    if (isParent) {
      if (isAddingChild) {
        addChild({
          houseId,
          ageGroupId,
          categoryId,
          name: name.trim() || undefined,
        });
      } else {
        saveProfile({
          role: "parent",
          carnivalId: DEFAULT_CARNIVAL_ID,
          children: [
            {
              houseId,
              ageGroupId,
              categoryId,
              name: name.trim() || undefined,
            },
          ],
        });
      }
    } else {
      saveProfile({
        role: "student",
        carnivalId: DEFAULT_CARNIVAL_ID,
        houseId,
        ageGroupId,
        categoryId,
        name: name.trim() || undefined,
      });
    }

    router.replace("/schedule");
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <h2 className="text-xl font-semibold">{heading}</h2>

      <Field label="House">
        <select
          required
          value={houseId}
          onChange={(e) => setHouseId(e.target.value)}
          className="input"
        >
          <option value="">Select…</option>
          {carnival.houses.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Age group">
        <select
          required
          value={ageGroupId}
          onChange={(e) => setAgeGroupId(e.target.value)}
          className="input"
        >
          <option value="">Select…</option>
          {carnival.ageGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Category">
        <select
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="input"
        >
          <option value="">Select…</option>
          {carnival.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label={`${nameLabel} (optional)`}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={namePlaceholder}
          className="input"
          maxLength={40}
        />
      </Field>

      <button
        type="submit"
        className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow hover:bg-indigo-700 active:scale-[0.99]"
      >
        {isAddingChild
          ? "Add child"
          : isParent
            ? "See their schedule"
            : "See my schedule"}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
