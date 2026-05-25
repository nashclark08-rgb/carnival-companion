import { AgeGroup } from "./types";

export function anyAgeGroupHasBirthYear(ageGroups: AgeGroup[]): boolean {
  return ageGroups.some(
    (g) => g.birthYearFrom !== undefined || g.birthYearTo !== undefined,
  );
}

export function findAgeGroupForBirthDate(
  ageGroups: AgeGroup[],
  birthDateIso: string,
): AgeGroup | undefined {
  if (!birthDateIso) return undefined;
  const d = new Date(birthDateIso);
  if (isNaN(d.getTime())) return undefined;
  const year = d.getFullYear();
  return ageGroups.find(
    (g) =>
      g.birthYearFrom !== undefined &&
      g.birthYearTo !== undefined &&
      year >= g.birthYearFrom &&
      year <= g.birthYearTo,
  );
}

export type AgeGroupIssue = {
  severity: "error" | "warning";
  message: string;
};

const REASONABLE_MIN_YEAR = 1900;

export function validateAgeGroupRanges(ageGroups: AgeGroup[]): AgeGroupIssue[] {
  const issues: AgeGroupIssue[] = [];
  const currentYear = new Date().getFullYear();
  const usable: { group: AgeGroup; from: number; to: number }[] = [];

  for (const g of ageGroups) {
    const label = g.label || "(unlabelled group)";
    const hasFrom = g.birthYearFrom !== undefined;
    const hasTo = g.birthYearTo !== undefined;

    if (!hasFrom && !hasTo) continue;

    if (hasFrom !== hasTo) {
      issues.push({
        severity: "error",
        message: `${label} has only one of "Year from" / "Year to" set — fill in both, or clear both to fall back to the manual picker.`,
      });
      continue;
    }

    const from = g.birthYearFrom!;
    const to = g.birthYearTo!;

    if (from > to) {
      issues.push({
        severity: "error",
        message: `${label}: "Year from" (${from}) is after "Year to" (${to}). Swap them.`,
      });
      continue;
    }

    if (from < REASONABLE_MIN_YEAR || to > currentYear) {
      issues.push({
        severity: "warning",
        message: `${label}: range ${from}–${to} looks unusual. Birth years should normally sit between ${REASONABLE_MIN_YEAR} and ${currentYear}.`,
      });
    }

    usable.push({ group: g, from, to });
  }

  for (let i = 0; i < usable.length; i++) {
    for (let j = i + 1; j < usable.length; j++) {
      const a = usable[i];
      const b = usable[j];
      if (a.from <= b.to && b.from <= a.to) {
        const overlapFrom = Math.max(a.from, b.from);
        const overlapTo = Math.min(a.to, b.to);
        const range =
          overlapFrom === overlapTo
            ? `${overlapFrom}`
            : `${overlapFrom}–${overlapTo}`;
        issues.push({
          severity: "warning",
          message: `${a.group.label || "(unlabelled)"} and ${b.group.label || "(unlabelled)"} both cover ${range}. Whichever is listed first wins — students born in that year will silently land in the first group.`,
        });
      }
    }
  }

  return issues;
}
