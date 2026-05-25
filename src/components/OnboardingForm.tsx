"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCarnival } from "@/lib/db";
import { addChild, saveProfile } from "@/lib/attendee";
import { DEFAULT_CARNIVAL_ID } from "@/lib/firebase";
import { ChildProfile, Role } from "@/lib/types";
import {
  anyAgeGroupHasBirthYear,
  findAgeGroupForBirthDate,
} from "@/lib/age";

type Props = {
  role: Role;
  mode?: "new" | "addChild";
};

type ChildDraft = {
  houseId: string;
  ageGroupId: string;
  categoryId: string;
  dob: string;
  overrideAgeGroup: boolean;
};

function emptyChildDraft(): ChildDraft {
  return {
    houseId: "",
    ageGroupId: "",
    categoryId: "",
    dob: "",
    overrideAgeGroup: false,
  };
}

export function OnboardingForm({ role, mode = "new" }: Props) {
  const router = useRouter();
  const { carnival, loading } = useCarnival(DEFAULT_CARNIVAL_ID);
  const isParent = role === "parent";
  const isAddingChild = isParent && mode === "addChild";

  const [studentHouseId, setStudentHouseId] = useState("");
  const [studentAgeGroupId, setStudentAgeGroupId] = useState("");
  const [studentCategoryId, setStudentCategoryId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentDob, setStudentDob] = useState("");
  const [studentOverride, setStudentOverride] = useState(false);

  const [drafts, setDrafts] = useState<ChildDraft[]>([emptyChildDraft()]);

  const useDob = useMemo(
    () => (carnival ? anyAgeGroupHasBirthYear(carnival.ageGroups) : false),
    [carnival],
  );

  const studentMatched = useMemo(() => {
    if (!carnival || !studentDob) return undefined;
    return findAgeGroupForBirthDate(carnival.ageGroups, studentDob);
  }, [carnival, studentDob]);

  useEffect(() => {
    if (!useDob) return;
    if (studentMatched) {
      setStudentAgeGroupId(studentMatched.id);
      setStudentOverride(false);
    }
  }, [studentMatched, useDob]);

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

  const todayIso = new Date().toISOString().slice(0, 10);
  const primaryColor = carnival.branding?.primaryColor ?? "#4f46e5";
  const secondaryColor = carnival.branding?.secondaryColor ?? "#7c3aed";

  if (isParent) {
    return (
      <ParentForm
        carnival={carnival}
        drafts={drafts}
        setDrafts={setDrafts}
        useDob={useDob}
        todayIso={todayIso}
        isAddingChild={isAddingChild}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        onSubmit={(validDrafts) => {
          const childProfiles: ChildProfile[] = validDrafts.map((d) => ({
            houseId: d.houseId,
            ageGroupId: d.ageGroupId,
            categoryId: d.categoryId,
          }));
          if (isAddingChild) {
            childProfiles.forEach((c) => addChild(c));
          } else {
            saveProfile({
              role: "parent",
              carnivalId: DEFAULT_CARNIVAL_ID,
              children: childProfiles,
            });
          }
          router.replace("/schedule");
        }}
      />
    );
  }

  function submitStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!studentHouseId || !studentAgeGroupId || !studentCategoryId) return;
    saveProfile({
      role: "student",
      carnivalId: DEFAULT_CARNIVAL_ID,
      houseId: studentHouseId,
      ageGroupId: studentAgeGroupId,
      categoryId: studentCategoryId,
      name: studentName.trim() || undefined,
    });
    router.replace("/onboarding/events");
  }

  const studentDobUnmatched = useDob && studentDob && !studentMatched;
  const studentNeedsManualPicker =
    !useDob || studentDobUnmatched || studentOverride;

  return (
    <form onSubmit={submitStudent} className="space-y-5">
      <h2 className="text-xl font-semibold">Tell us about yourself</h2>

      <Field label="House">
        <select
          required
          value={studentHouseId}
          onChange={(e) => setStudentHouseId(e.target.value)}
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
        <Field label="Your date of birth">
          <input
            type="date"
            required
            max={todayIso}
            value={studentDob}
            onChange={(e) => setStudentDob(e.target.value)}
            className="input"
          />
          {studentDob && studentMatched && !studentOverride && (
            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
              Age group: <strong>{studentMatched.label}</strong>.{" "}
              <button
                type="button"
                onClick={() => setStudentOverride(true)}
                className="underline"
              >
                Not right?
              </button>
            </p>
          )}
          {studentDobUnmatched && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              Couldn&apos;t match your birthday. Pick a group below.
            </p>
          )}
        </Field>
      )}

      {studentNeedsManualPicker && (
        <Field label="Age group">
          <select
            required
            value={studentAgeGroupId}
            onChange={(e) => setStudentAgeGroupId(e.target.value)}
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
          value={studentCategoryId}
          onChange={(e) => setStudentCategoryId(e.target.value)}
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

      <Field label="Your first name (optional)">
        <input
          type="text"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="e.g. Sam"
          className="input"
          maxLength={40}
        />
      </Field>

      <button
        type="submit"
        className="w-full rounded-xl px-4 py-3 font-semibold text-white shadow active:scale-[0.99]"
        style={{ background: primaryColor }}
      >
        See my schedule
      </button>
    </form>
  );
}

type ParentFormProps = {
  carnival: NonNullable<ReturnType<typeof useCarnival>["carnival"]>;
  drafts: ChildDraft[];
  setDrafts: (drafts: ChildDraft[]) => void;
  useDob: boolean;
  todayIso: string;
  isAddingChild: boolean;
  primaryColor: string;
  secondaryColor: string;
  onSubmit: (validDrafts: ChildDraft[]) => void;
};

function ParentForm({
  carnival,
  drafts,
  setDrafts,
  useDob,
  todayIso,
  isAddingChild,
  primaryColor,
  secondaryColor,
  onSubmit,
}: ParentFormProps) {
  const maxSlots = isAddingChild ? 1 : 3;

  function updateDraft(idx: number, patch: Partial<ChildDraft>) {
    setDrafts(drafts.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  }

  function addSlot() {
    if (drafts.length < maxSlots)
      setDrafts([...drafts, emptyChildDraft()]);
  }

  function removeSlot(idx: number) {
    if (drafts.length === 1) return;
    setDrafts(drafts.filter((_, i) => i !== idx));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const valid = drafts.filter(
      (d) => d.houseId && d.ageGroupId && d.categoryId,
    );
    if (valid.length === 0) return;
    onSubmit(valid);
  }

  const heading = isAddingChild
    ? "Add another child"
    : "Who are you following?";

  return (
    <form onSubmit={submit} className="space-y-5">
      <h2 className="text-xl font-semibold">{heading}</h2>
      {!isAddingChild && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Add up to {maxSlots} children. Each one&apos;s events will appear on
          your schedule.
        </p>
      )}

      {drafts.map((draft, idx) => {
        const matched =
          useDob && draft.dob
            ? findAgeGroupForBirthDate(carnival.ageGroups, draft.dob)
            : undefined;
        const dobUnmatched = useDob && draft.dob && !matched;
        const needsManualPicker =
          !useDob || dobUnmatched || draft.overrideAgeGroup;

        return (
          <fieldset
            key={idx}
            className="space-y-3 rounded-2xl border-2 p-4"
            style={{ borderColor: secondaryColor }}
          >
            <legend
              className="-ml-1 rounded px-2 py-0.5 text-sm font-semibold text-white"
              style={{ background: secondaryColor }}
            >
              Child {idx + 1}
              {drafts.length > 1 && !isAddingChild && (
                <button
                  type="button"
                  onClick={() => removeSlot(idx)}
                  className="ml-3 text-xs font-normal opacity-80 underline hover:opacity-100"
                >
                  Remove
                </button>
              )}
            </legend>

            <Field label="House">
              <select
                required
                value={draft.houseId}
                onChange={(e) =>
                  updateDraft(idx, { houseId: e.target.value })
                }
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
              <Field label="Child's date of birth">
                <input
                  type="date"
                  required
                  max={todayIso}
                  value={draft.dob}
                  onChange={(e) => {
                    const newDob = e.target.value;
                    const newMatch = findAgeGroupForBirthDate(
                      carnival.ageGroups,
                      newDob,
                    );
                    updateDraft(idx, {
                      dob: newDob,
                      ageGroupId: newMatch?.id ?? draft.ageGroupId,
                      overrideAgeGroup: newMatch
                        ? false
                        : draft.overrideAgeGroup,
                    });
                  }}
                  className="input"
                />
                {draft.dob && matched && !draft.overrideAgeGroup && (
                  <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                    Age group: <strong>{matched.label}</strong>.{" "}
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft(idx, { overrideAgeGroup: true })
                      }
                      className="underline"
                    >
                      Not right?
                    </button>
                  </p>
                )}
                {dobUnmatched && (
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                    Couldn&apos;t match — pick a group below.
                  </p>
                )}
              </Field>
            )}

            {needsManualPicker && (
              <Field label="Age group">
                <select
                  required
                  value={draft.ageGroupId}
                  onChange={(e) =>
                    updateDraft(idx, { ageGroupId: e.target.value })
                  }
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
                value={draft.categoryId}
                onChange={(e) =>
                  updateDraft(idx, { categoryId: e.target.value })
                }
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
          </fieldset>
        );
      })}

      {!isAddingChild && drafts.length < maxSlots && (
        <button
          type="button"
          onClick={addSlot}
          className="w-full rounded-xl border-2 border-dashed px-4 py-2 text-sm font-semibold"
          style={{ borderColor: secondaryColor, color: secondaryColor }}
        >
          + Add another child ({drafts.length}/{maxSlots})
        </button>
      )}

      <button
        type="submit"
        className="w-full rounded-xl px-4 py-3 font-semibold text-white shadow active:scale-[0.99]"
        style={{ background: primaryColor }}
      >
        {isAddingChild
          ? "Add child"
          : drafts.length === 1
            ? "See their schedule"
            : `See ${drafts.length} schedules`}
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
