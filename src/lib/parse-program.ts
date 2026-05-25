import { CarnivalEvent } from "./types";

export type ParsedEvent = Omit<CarnivalEvent, "id"> & {
  warnings?: string[];
};

export type ParseResult = {
  events: ParsedEvent[];
  warnings: string[];
};

export type ParseRequestContext = {
  carnivalDate: string;
  ageGroups: { id: string; label: string }[];
  categories: { id: string; label: string }[];
  sessions: { id: string; name: string; order: number }[];
};
