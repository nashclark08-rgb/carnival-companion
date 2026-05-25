import { Branding } from "./types";

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string | number }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { mapValue: { fields?: Record<string, FirestoreValue> } }
  | { arrayValue: { values?: FirestoreValue[] } };

function decode(value: FirestoreValue | undefined): unknown {
  if (!value) return undefined;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) {
    const n =
      typeof value.integerValue === "string"
        ? parseInt(value.integerValue, 10)
        : value.integerValue;
    return Number.isNaN(n) ? undefined : n;
  }
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("nullValue" in value) return null;
  if ("mapValue" in value) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value.mapValue.fields ?? {})) {
      out[k] = decode(v);
    }
    return out;
  }
  if ("arrayValue" in value) {
    return (value.arrayValue.values ?? []).map(decode);
  }
  return undefined;
}

export type ServerCarnival = {
  name?: string;
  schoolName?: string;
  branding?: Branding;
};

export async function fetchCarnivalForManifest(): Promise<ServerCarnival | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return null;
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/carnivals/default`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      fields?: Record<string, FirestoreValue>;
    };
    if (!data.fields) return null;
    const decoded = decode({ mapValue: { fields: data.fields } }) as Record<
      string,
      unknown
    >;
    return {
      name: typeof decoded.name === "string" ? decoded.name : undefined,
      schoolName:
        typeof decoded.schoolName === "string"
          ? decoded.schoolName
          : undefined,
      branding: decoded.branding as Branding | undefined,
    };
  } catch {
    return null;
  }
}
