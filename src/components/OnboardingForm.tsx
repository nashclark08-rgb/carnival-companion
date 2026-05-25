"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCarnival } from "@/lib/db";
import { addChild, saveProfile } from "@/lib/attendee";
import { DEFAULT_CARNIVAL_ID } from "@/lib/firebase";
import { Role } from "@/lib/types";
import {
  anyAgeGroupHasBirthYear,
  findAgeGroupForBirthDate,
} from "@/lib/age";

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
  const [dob, setDob] = useState("");
  const [overrideAgeGroup, setOverrideAgeGroup] = useState(false);

  const useDob = useMemo(
    () => (carnival ? anyAgeGroupHasBirthYear(carnival.ageGroups) : false),
    [carnival],
  );

  const matchedAgeGroup = useMemo(() => {
    if (!carnival || !dob) return undefined;
    return findAgeGroupForBirthDate(carnival.ageGroups, dob);
  }, [carnival, dob]);

  useEffect(() => {
    if (!useDob) return;
    if (matchedAgeGroup) {
      setAgeGroupId(matchedAgeGroup.id);
      setOverrideAgeGroup(false);
    }
  }, [matchedAgeGroup, useDob]);

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

  const dobLabel = isParent ? "Child's date of birth" : "Your date of birth";
  const todayIso = new Date().toISOString().slice(0, 10);
  const dobUnmatched = useDob && dob && !matchedAgeGroup;
  const needsManualPicker = !useDob || dobUnmatched || overrideAgeGroup;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!houseId || !ageGroupId || !categoryId) return;

    let nextHref = "/onboarding/events";

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
      nextHref = "/schedule";
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

    router.replace(nextHref);
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

      {useDob && (
        <Field label={dobLabel}>
          <input
            type="date"
            required
            max={todayIso}
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="input"
          />
          {dob && matchedAgeGroup && !overrideAgeGroup && (
            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
              Age group: <strong>{matchedAgeGroup.label}</strong>.{" "}
              <button
                type="button"
                onClick={() => setOverrideAgeGroup(true)}
                className="underline"
              >
                Not right?
              </button>
            </p>
          )}
          {dobUnmatched && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              Couldn&apos;t match your birthday to an age group. Pick one
              below.
            </p>
          )}
        </Field>
      )}

      {needsManualPicker && (
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
      )}

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
        className="w-full rounded-xl px-4 py-3 font-semibold text-white shadow active:scale-[0.99]"
        style={{
          background: carnival.branding?.primaryColor ?? "#4f46e5",
        }}
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
