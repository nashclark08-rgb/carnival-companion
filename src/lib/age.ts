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
